import { AISpatialResult, BuildingDensity, LocationPreset, RoofMaterial } from '../types';

export const LOCATION_PRESETS: LocationPreset[] = [
  {
    id: 'nigeria-lagos',
    name: 'Surulere Peri-Urban Solar Microgrid',
    region: 'South-West',
    country: 'Nigeria',
    state: 'Lagos State',
    lat: 6.4980,
    lng: 3.3580,
    zoom: 16,
    description: 'High-density commercial & residential rooftops around Surulere / Stadium transit corridor.',
    ghi: 4.9,
  },
  {
    id: 'nigeria-plateau',
    name: 'Central Plateau Rural Cluster',
    region: 'North-Central',
    country: 'Nigeria',
    state: 'Plateau State',
    lat: 9.082,
    lng: 8.6753,
    zoom: 16,
    description: 'Agricultural agrarian off-grid settlement with concentrated corrugated zinc roofing.',
    ghi: 5.4,
  },
  {
    id: 'kenya-turkana',
    name: 'Turkana Off-Grid Agro-Pastoral',
    region: 'Rift Valley',
    country: 'Kenya',
    lat: 3.116,
    lng: 35.596,
    zoom: 16,
    description: 'Arid pastoral community with high GHI solar irradiance and scattered village clusters.',
    ghi: 6.2,
  },
  {
    id: 'tanzania-shinyanga',
    name: 'Shinyanga Rural Farming Hamlet',
    region: 'Lake Victoria Basin',
    country: 'Tanzania',
    lat: -3.663,
    lng: 33.421,
    zoom: 16,
    description: 'Cotton and rice farming community with mixed thatch and metal roofing.',
    ghi: 5.1,
  },
  {
    id: 'mali-sikasso',
    name: 'Sikasso Commune Rurale',
    region: 'Sikasso',
    country: 'Mali',
    lat: 11.317,
    lng: -5.666,
    zoom: 16,
    description: 'Sahelian agricultural hub with intense solar insolation and remote grid access.',
    ghi: 5.8,
  },
  {
    id: 'india-odisha',
    name: 'Koraput Tribal Electrification Zone',
    region: 'Odisha',
    country: 'India',
    lat: 18.813,
    lng: 82.711,
    zoom: 16,
    description: 'Hilly forested off-grid tribal settlement with tiled and metal roofs.',
    ghi: 5.2,
  },
  {
    id: 'peru-sacred-valley',
    name: 'Urubamba Highland Community',
    region: 'Cusco',
    country: 'Peru',
    lat: -13.315,
    lng: -72.091,
    zoom: 16,
    description: 'High-altitude Andean farming hamlet with clear atmospheric insolation.',
    ghi: 5.9,
  },
];

/**
 * Simulates Gemini Vision API spatial analysis on the captured satellite tile viewport.
 * Uses pseudo-random seed based on coordinate and timestamp to generate authentic results.
 */
export async function simulateGeminiAnalysis(
  bounds?: { north: number; south: number; east: number; west: number },
  center?: { lat: number; lng: number }
): Promise<AISpatialResult> {
  // Artificial 1.4s delay to simulate cloud computer vision inference & satellite tile processing
  await new Promise((resolve) => setTimeout(resolve, 1400));

  const targetLat = center?.lat ?? 9.082;
  const targetLng = center?.lng ?? 8.6753;

  // Coordinate-influenced pseudo-random generation
  const seed = Math.abs(Math.sin(targetLat * 12.9898 + targetLng * 78.233)) * 43758.5453;
  const rand1 = (seed - Math.floor(seed));
  const rand2 = Math.random();

  // usable_rooftop_m2: Randomized between 500 and 5000
  const usable_rooftop_m2 = Math.round(500 + rand2 * 4500);

  // building_density: ("Sparse", "Medium", or "Dense")
  const densities: BuildingDensity[] = ['Sparse', 'Medium', 'Dense'];
  const densityIndex = Math.floor(rand1 * 3);
  const building_density = densities[densityIndex];

  // visible_infrastructure: (Boolean)
  const visible_infrastructure = rand2 > 0.45;

  // roof_material: ("Mostly Metal", "Thatch", "Mixed")
  const materials: RoofMaterial[] = ['Mostly Metal', 'Thatch', 'Mixed'];
  const materialIndex = Math.floor((rand1 * 7 + rand2 * 3) % 3);
  const roof_material = materials[materialIndex];

  // Derived geographical metrics
  const estimated_households = Math.max(18, Math.round(usable_rooftop_m2 / (building_density === 'Dense' ? 32 : 55)));
  const grid_distance_km = Math.round((14 + rand1 * 42) * 10) / 10;
  const avg_solar_ghi_kwh_m2 = Math.round((4.6 + (1 - Math.min(1, Math.abs(targetLat) / 45)) * 1.6) * 10) / 10;
  const slope_percentage = Math.round((2 + rand1 * 8) * 10) / 10;

  return {
    usable_rooftop_m2,
    building_density,
    visible_infrastructure,
    roof_material,
    estimated_households,
    grid_distance_km,
    avg_solar_ghi_kwh_m2,
    slope_percentage,
    analyzed_at: new Date().toISOString(),
    bounds: bounds ?? {
      north: targetLat + 0.005,
      south: targetLat - 0.005,
      east: targetLng + 0.005,
      west: targetLng - 0.005,
    },
    center: {
      lat: targetLat,
      lng: targetLng,
    },
  };
}
