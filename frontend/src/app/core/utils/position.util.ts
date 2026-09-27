/**
 * (0, 0) — "Null Island", au large du golfe de Guinée — n'est jamais une position GPS réelle pour
 * cette application (toute son activité se situe en Afrique de l'Ouest). D'anciens enregistrements
 * ont pu y retomber par défaut quand le livreur n'avait pas transmis de position réelle (avant
 * correction côté serveur) ; ce filtre évite qu'un tel point fantôme ne fasse partir un tracé de
 * trajet depuis l'océan au lieu du parcours réel.
 */
export function estPositionValide(latitude: number | null | undefined, longitude: number | null | undefined): boolean {
  if (latitude == null || longitude == null) return false;
  return Math.abs(latitude) > 0.01 || Math.abs(longitude) > 0.01;
}
