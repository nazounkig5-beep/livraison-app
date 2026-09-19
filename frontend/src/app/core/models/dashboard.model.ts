import { DemandeLivraison } from './demande.model';

export interface DashboardStats {
  total_utilisateurs: number;
  total_entreprises: number;
  entreprises_en_attente: number;
  demandes_par_statut: Record<string, number>;
  incidents_ouverts: number;
}

export interface EntrepriseDashboardStats {
  total_demandes: number;
  demandes_par_statut: Record<string, number>;
  demandes_en_attente: number;
  total_vehicules: number;
  total_employes: number;
  demandes_recentes: DemandeLivraison[];
}
