export type BuildingDensity = 'Sparse' | 'Medium' | 'Dense';
export type RoofMaterial = 'Mostly Metal' | 'Thatch' | 'Mixed';

export interface AISpatialResult {
  usable_rooftop_m2: number;
  building_density: BuildingDensity;
  visible_infrastructure: boolean;
  roof_material: RoofMaterial;
  estimated_households: number;
  grid_distance_km: number;
  avg_solar_ghi_kwh_m2: number;
  slope_percentage: number;
  analyzed_at: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: {
    lat: number;
    lng: number;
  };
}

export interface SensitivityParams {
  peakSunHours: number; // default: 4.5
  autonomyDays: number; // default: 1.5
  pvCostPerKw: number; // default: 900 ($/kWp)
  batteryCostPerKwh: number; // default: 250 ($/kWh)
  omCostPerKwh: number; // default: 0.05 ($/kWh)
}

export interface TechnoEconomicMetrics {
  usableRooftopM2: number;
  pvCapacityKwp: number; // usable_rooftop_m2 * 0.20
  dailyGenerationKwh: number; // PV Capacity * peakSunHours
  annualGenerationKwh: number; // dailyGenerationKwh * 365
  batteryStorageKwh: number; // dailyGenerationKwh * autonomyDays
  pvCapex: number; // PV Capacity * pvCostPerKw
  batteryCapex: number; // Battery Storage * batteryCostPerKwh
  bosAndBalanceCapex: number; // inverters, switchgear, distribution (approx 15%)
  estimatedCapex: number; // pvCapex + batteryCapex + bos
  lcoePerKwh: number; // (CAPEX / (Daily Generation * 365 * 20)) + omCost
  dieselSavingsPerYearUsd: number; // compared to $0.55/kWh diesel genset
  co2MitigatedTonsYear: number; // approx 0.7 kg CO2/kWh
  householdsElectrified: number;
  feasibilityScore: 'High Viability' | 'Moderate Viability' | 'Requires Subsidy';
  summarySentence: string;
}

export interface LocationPreset {
  id: string;
  name: string;
  region: string;
  country: string;
  state?: string;
  lat: number;
  lng: number;
  zoom: number;
  description: string;
  ghi: number; // Global Horizontal Irradiance kWh/m2/day
}

export interface SavedAssessment {
  id: string;
  name: string;
  country: string;
  state: string;
  savedAt: string;
  aiResult: AISpatialResult;
  metrics: TechnoEconomicMetrics;
  params: SensitivityParams;
  isBaseline?: boolean;
}

export interface StateBoundary {
  name: string;
  country: string;
  capital: string;
  center: [number, number];
  coordinates: [number, number][]; // Polygon vertices
  color: string;
  solarPotential: string;
}

export interface ElevationPoint {
  lat: number;
  lng: number;
  elevation: number; // in meters
  distanceMeters: number; // cumulative distance from start of transect
}

export type TransectDirection = 'west-east' | 'north-south' | 'sw-ne';

export interface ElevationProfileData {
  points: ElevationPoint[];
  totalDistanceMeters: number;
  minElevation: number;
  maxElevation: number;
  elevationChange: number;
  avgSlopePercent: number;
  maxSlopePercent: number;
  feasibilityCategory: 'Ideal (Low Civil Cost)' | 'Moderate Incline' | 'Steep (High Civil Cost)';
  civilWorksAssessment: string;
  direction: TransectDirection;
  startCoord: { lat: number; lng: number };
  endCoord: { lat: number; lng: number };
  sampledAt: string;
}


