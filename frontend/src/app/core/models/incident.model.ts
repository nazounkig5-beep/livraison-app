import { DemandeLivraison } from './demande.model';

export interface Incident {
  id: number;
  id_demande: number;
  description: string;
  statut: 'OUVERT' | 'RESOLU';
  date_ouverture: string;
  demande?: DemandeLivraison;
}
