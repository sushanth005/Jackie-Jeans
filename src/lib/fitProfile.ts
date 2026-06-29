// FitProfile — data model for collected quiz answers + storage helpers

export interface FitProfile {
  height: string;
  weight?: string; // Optional
  waist: string;
  hip: string;
  waistFit: string;
  rise: string;
  thighFit: string;
  brands: string[];
  brandSizes: Record<string, string>;
  frustration: string;
  completedVia: 'manual' | 'voice';
  completedAt: string;
}

const STORAGE_KEY = 'jackie_jeans_fit_profile';

export function saveFitProfile(profile: FitProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage errors
  }
}

export function getFitProfile(): FitProfile | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function clearFitProfile(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Encode the profile as URL search params so Jackie Jeans site can read it.
 * Keeps it simple — only string-serializable fields.
 */
export function encodeProfileForRedirect(profile: FitProfile): string {
  const params = new URLSearchParams();
  params.set('height', profile.height);
  if (profile.weight) params.set('weight', profile.weight);
  params.set('waist', profile.waist);
  params.set('hip', profile.hip);
  params.set('waistFit', profile.waistFit);
  params.set('rise', profile.rise);
  params.set('thighFit', profile.thighFit);
  params.set('brands', profile.brands.join(','));
  params.set('brandSizes', JSON.stringify(profile.brandSizes));
  params.set('frustration', profile.frustration);
  params.set('via', profile.completedVia);
  return params.toString();
}

export const JACKIE_JEANS_URL = 'https://jackie-jeans.vercel.app/';

export function buildRedirectUrl(profile: FitProfile): string {
  const encoded = encodeProfileForRedirect(profile);
  return `${JACKIE_JEANS_URL}?${encoded}`;
}

/**
 * Returns a readable label for a question's answer value.
 */
export function getAnswerLabel(questionId: string, value: unknown): string {
  if (questionId === 'brands' && Array.isArray(value)) {
    return value.join(', ');
  }
  if (questionId === 'brandSizes' && typeof value === 'object' && value !== null) {
    return Object.entries(value as Record<string, string>)
      .map(([brand, size]) => `${brand}: ${size}`)
      .join(' · ');
  }
  return String(value ?? '');
}
