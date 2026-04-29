export const PLATFORMS: Record<string, string> = { euw: "euw1", na: "na1", kr: "kr", eune: "eun1", br: "br1", jp: "jp1", lan: "la1", las: "la2", oce: "oc1", tr: "tr1", ru: "ru" };
export const REGIONS: Record<string, string> = { euw: "europe", eune: "europe", tr: "europe", ru: "europe", na: "americas", br: "americas", lan: "americas", las: "americas", kr: "asia", jp: "asia", oce: "sea" };
export function normalizePlatform(platform?: string | null): string { const key = (platform || "euw").toLowerCase(); return PLATFORMS[key] ? key : "euw"; }
export function platformHost(platform?: string | null): string { return PLATFORMS[normalizePlatform(platform)]; }
export function regionHost(platform?: string | null): string { return REGIONS[normalizePlatform(platform)] || "europe"; }
