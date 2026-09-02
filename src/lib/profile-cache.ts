/**
 * Modulweiter In-Memory-Cache für `profile_data`.
 * Als Objekt exportiert, damit andere API-Routes denselben Slot invalidieren können
 * (`profileCache.cachedCvText = null`) – ein `export let` wäre von außen nicht zuweisbar.
 */
export const profileCache: { cachedCvText: string | null } = {
  cachedCvText: null,
};
