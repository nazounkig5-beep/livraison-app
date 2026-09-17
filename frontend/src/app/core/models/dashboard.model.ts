export interface DashboardStats {
  total_utilisateurs: number;
  total_entreprises: number;
  entreprises_en_attente: number;
  demandes_par_statut: Record<string, number>;
  incidents_ouverts: number;
}
