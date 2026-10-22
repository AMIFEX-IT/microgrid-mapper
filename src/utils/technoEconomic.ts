import { AISpatialResult, SensitivityParams, TechnoEconomicMetrics } from '../types';

export const DEFAULT_SENSITIVITY: SensitivityParams = {
  peakSunHours: 4.5,
  autonomyDays: 1.5,
  pvCostPerKw: 900,
  batteryCostPerKwh: 250,
  omCostPerKwh: 0.05,
};

/**
 * Calculates mini-grid techno-economic metrics based on usable rooftop area and sensitivity parameters.
 */
export function calculateTechnoEconomics(
  aiResult: AISpatialResult,
  params: SensitivityParams = DEFAULT_SENSITIVITY
): TechnoEconomicMetrics {
  const { usable_rooftop_m2 } = aiResult;
  const { peakSunHours, autonomyDays, pvCostPerKw, batteryCostPerKwh, omCostPerKwh } = params;

  // 1. PV Capacity (kWp): usable_rooftop_m2 * 0.20 (assuming 20% efficiency)
  const pvCapacityKwp = Math.round((usable_rooftop_m2 * 0.20) * 10) / 10;

  // 2. Daily Generation (kWh): PV Capacity * peakSunHours
  const dailyGenerationKwh = Math.round((pvCapacityKwp * peakSunHours) * 10) / 10;

  // Annual Generation (kWh)
  const annualGenerationKwh = Math.round(dailyGenerationKwh * 365);

  // 3. Battery Storage (kWh): Daily Generation * autonomyDays
  const batteryStorageKwh = Math.round((dailyGenerationKwh * autonomyDays) * 10) / 10;

  // 4. Estimated CAPEX ($): (PV Capacity * 900) + (Battery Storage * 250)
  const pvCapex = Math.round(pvCapacityKwp * pvCostPerKw);
  const batteryCapex = Math.round(batteryStorageKwh * batteryCostPerKwh);
  const bosAndBalanceCapex = Math.round((pvCapex + batteryCapex) * 0.12); // Balance of System / Inverters
  const estimatedCapex = pvCapex + batteryCapex; // As specified in core prompt formula

  // 5. LCOE ($/kWh): (CAPEX / (Daily Generation * 365 * 20)) + 0.05
  const denominator = dailyGenerationKwh * 365 * 20;
  const lcoePerKwh = denominator > 0
    ? Math.round(((estimatedCapex / denominator) + omCostPerKwh) * 1000) / 1000
    : 0;

  // Social & Environmental impacts
  const householdsElectrified = Math.max(15, Math.round(dailyGenerationKwh / 1.75));
  const co2MitigatedTonsYear = Math.round((annualGenerationKwh * 0.00068) * 10) / 10; // 0.68 kg CO2/kWh displaced diesel
  const dieselAlternativeCostPerKwh = 0.52; // $/kWh average off-grid diesel gen
  const dieselSavingsPerYearUsd = Math.round(annualGenerationKwh * Math.max(0, dieselAlternativeCostPerKwh - lcoePerKwh));

  // Determine feasibility tier
  let feasibilityScore: 'High Viability' | 'Moderate Viability' | 'Requires Subsidy' = 'High Viability';
  if (lcoePerKwh > 0.28 || aiResult.building_density === 'Sparse') {
    feasibilityScore = 'Requires Subsidy';
  } else if (lcoePerKwh > 0.19) {
    feasibilityScore = 'Moderate Viability';
  }

  // Dynamic 3-sentence summary of site feasibility based on data
  const summarySentence = generateDynamicSummary(aiResult, pvCapacityKwp, dailyGenerationKwh, batteryStorageKwh, estimatedCapex, lcoePerKwh, feasibilityScore);

  return {
    usableRooftopM2: usable_rooftop_m2,
    pvCapacityKwp,
    dailyGenerationKwh,
    annualGenerationKwh,
    batteryStorageKwh,
    pvCapex,
    batteryCapex,
    bosAndBalanceCapex,
    estimatedCapex,
    lcoePerKwh,
    dieselSavingsPerYearUsd,
    co2MitigatedTonsYear,
    householdsElectrified,
    feasibilityScore,
    summarySentence,
  };
}

/**
 * Generates an authoritative 3-sentence techno-economic summary conforming to industry mini-grid guidelines.
 */
function generateDynamicSummary(
  ai: AISpatialResult,
  pvKwp: number,
  dailyKwh: number,
  batteryKwh: number,
  capex: number,
  lcoe: number,
  score: 'High Viability' | 'Moderate Viability' | 'Requires Subsidy'
): string {
  const sentence1 = `Satellite reconnaissance identified ${ai.usable_rooftop_m2.toLocaleString()} m² of viable rooftop area characterized by ${ai.building_density.toLowerCase()} settlement density and predominantly ${ai.roof_material.toLowerCase()} structural envelopes with ${ai.visible_infrastructure ? 'pre-existing local low-voltage poles' : 'no prior grid interconnection'}.`;
  
  const sentence2 = `Based on a local solar resource of ${ai.avg_solar_ghi_kwh_m2.toFixed(1)} kWh/m²/day, the automated mini-grid architecture specifies a ${pvKwp.toLocaleString()} kWp photovoltaic array delivering ${dailyKwh.toLocaleString()} kWh/day alongside a ${batteryKwh.toLocaleString()} kWh battery energy storage system (BESS).`;
  
  const formattedCapex = `$${capex.toLocaleString()}`;
  const formattedLcoe = `$${lcoe.toFixed(3)}/kWh`;
  const sentence3 = `With a projected initial CAPEX of ${formattedCapex} and a 20-year LCOE of ${formattedLcoe}, the project demonstrates ${score.toLowerCase()} for rural off-grid electrification under concessional clean energy development and bilateral climate finance facilities.`;

  return `${sentence1} ${sentence2} ${sentence3}`;
}
