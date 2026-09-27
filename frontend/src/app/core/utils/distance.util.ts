/** Distance à vol d'oiseau (formule de Haversine) entre deux points GPS, en kilomètres. */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rayonTerreKm = 6371;
  const enRadians = (degres: number) => (degres * Math.PI) / 180;

  const dLat = enRadians(lat2 - lat1);
  const dLon = enRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(enRadians(lat1)) * Math.cos(enRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return rayonTerreKm * c;
}
