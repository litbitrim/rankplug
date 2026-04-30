export const PLATFORMS: Record<string, string> = {
  euw:'euw1', na:'na1', kr:'kr', eune:'eun1', br:'br1',
  jp:'jp1', lan:'la1', las:'la2', oce:'oc1', tr:'tr1', ru:'ru'
}
export const REGIONS: Record<string, string> = {
  euw:'europe', eune:'europe', tr:'europe', ru:'europe',
  na:'americas', br:'americas', lan:'americas', las:'americas',
  kr:'asia', jp:'asia', oce:'sea'
}
export function normalizePlatform(p?: string|null): string {
  const k = (p||'euw').toLowerCase()
  return PLATFORMS[k] ? k : 'euw'
}
export function platformHost(p?: string|null) { return PLATFORMS[normalizePlatform(p)] }
export function regionHost(p?: string|null)   { return REGIONS[normalizePlatform(p)] || 'europe' }
