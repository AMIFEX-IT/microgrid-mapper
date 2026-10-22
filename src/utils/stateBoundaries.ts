import { StateBoundary } from '../types';

/**
 * State boundaries and administrative dividing lines.
 * Coordinates are formatted as [lat, lng].
 */
export const STATE_BOUNDARIES: StateBoundary[] = [
  {
    name: 'Lagos State',
    country: 'Nigeria',
    capital: 'Ikeja',
    center: [6.5244, 3.3792],
    color: '#06b6d4', // Cyan
    solarPotential: '4.8 kWh/m²/day',
    coordinates: [
      [6.40, 2.70],
      [6.50, 2.72],
      [6.60, 2.90],
      [6.70, 3.20],
      [6.72, 3.55],
      [6.65, 3.95],
      [6.50, 4.30],
      [6.38, 4.25],
      [6.42, 3.60],
      [6.43, 3.40],
      [6.40, 2.70],
    ],
  },
  {
    name: 'Ogun State',
    country: 'Nigeria',
    capital: 'Abeokuta',
    center: [7.1604, 3.3489],
    color: '#f59e0b', // Amber
    solarPotential: '4.9 kWh/m²/day',
    coordinates: [
      [6.70, 2.70],
      [7.40, 2.80],
      [7.60, 3.40],
      [7.40, 4.20],
      [6.80, 4.40],
      [6.65, 3.95],
      [6.72, 3.55],
      [6.70, 3.20],
      [6.60, 2.90],
      [6.70, 2.70],
    ],
  },
  {
    name: 'Plateau State',
    country: 'Nigeria',
    capital: 'Jos',
    center: [9.2182, 9.5179],
    color: '#10b981', // Emerald
    solarPotential: '5.5 kWh/m²/day',
    coordinates: [
      [8.50, 8.50],
      [9.50, 8.60],
      [10.20, 8.80],
      [10.10, 9.80],
      [9.30, 10.40],
      [8.60, 9.80],
      [8.40, 9.00],
      [8.50, 8.50],
    ],
  },
  {
    name: 'Kano State',
    country: 'Nigeria',
    capital: 'Kano',
    center: [11.9964, 8.5167],
    color: '#8b5cf6', // Violet
    solarPotential: '6.1 kWh/m²/day',
    coordinates: [
      [11.20, 7.80],
      [12.40, 8.00],
      [12.60, 8.80],
      [12.10, 9.40],
      [11.40, 9.20],
      [11.10, 8.40],
      [11.20, 7.80],
    ],
  },
  {
    name: 'Turkana County',
    country: 'Kenya',
    capital: 'Lodwar',
    center: [3.116, 35.596],
    color: '#ec4899', // Pink
    solarPotential: '6.3 kWh/m²/day',
    coordinates: [
      [1.50, 35.00],
      [4.50, 35.20],
      [4.60, 36.20],
      [2.50, 36.50],
      [1.80, 35.80],
      [1.50, 35.00],
    ],
  },
  {
    name: 'Shinyanga Region',
    country: 'Tanzania',
    capital: 'Shinyanga',
    center: [-3.663, 33.421],
    color: '#3b82f6', // Blue
    solarPotential: '5.2 kWh/m²/day',
    coordinates: [
      [-4.30, 32.50],
      [-3.20, 32.80],
      [-3.10, 34.00],
      [-4.10, 34.20],
      [-4.30, 32.50],
    ],
  },
];

/**
 * Determine country and state from coordinates
 */
export function getGeoLocationInfo(lat: number, lng: number): { country: string; state: string } {
  // Check if inside or near Nigeria
  if (lat >= 4.0 && lat <= 14.0 && lng >= 2.5 && lng <= 14.5) {
    // Check specific state zones in Nigeria
    if (lat >= 6.3 && lat <= 6.75 && lng >= 2.7 && lng <= 4.3) {
      return { country: 'Nigeria', state: 'Lagos State' };
    }
    if (lat >= 6.65 && lat <= 7.6 && lng >= 2.7 && lng <= 4.4) {
      return { country: 'Nigeria', state: 'Ogun State' };
    }
    if (lat >= 8.3 && lat <= 10.3 && lng >= 8.4 && lng <= 10.5) {
      return { country: 'Nigeria', state: 'Plateau State' };
    }
    if (lat >= 11.0 && lat <= 12.8 && lng >= 7.6 && lng <= 9.6) {
      return { country: 'Nigeria', state: 'Kano State' };
    }
    if (lat >= 7.0 && lat <= 8.5 && lng >= 3.0 && lng <= 4.5) {
      return { country: 'Nigeria', state: 'Oyo State' };
    }
    return { country: 'Nigeria', state: 'Federal Republic of Nigeria' };
  }

  // Kenya
  if (lat >= -4.7 && lat <= 5.5 && lng >= 33.9 && lng <= 41.9) {
    if (lat >= 1.5 && lng <= 36.5) {
      return { country: 'Kenya', state: 'Turkana County' };
    }
    return { country: 'Kenya', state: 'Kenya' };
  }

  // Tanzania
  if (lat >= -11.7 && lat <= -1.0 && lng >= 29.3 && lng <= 40.5) {
    if (lat >= -4.5 && lat <= -3.0 && lng >= 32.0 && lng <= 34.5) {
      return { country: 'Tanzania', state: 'Shinyanga Region' };
    }
    return { country: 'Tanzania', state: 'Tanzania' };
  }

  // Peru
  if (lat >= -18.4 && lat <= -0.03 && lng >= -81.3 && lng <= -68.6) {
    return { country: 'Peru', state: 'Cusco Department' };
  }

  // India
  if (lat >= 6.7 && lat <= 37.1 && lng >= 68.1 && lng <= 97.4) {
    return { country: 'India', state: 'Odisha State' };
  }

  return { country: 'International', state: 'Rural Area' };
}
