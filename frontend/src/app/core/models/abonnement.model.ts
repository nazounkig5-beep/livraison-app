import { TarifAbonnement } from './parametre.model';
import { Utilisateur } from './utilisateur.model';

export interface Abonnement {
  id: number;
  id_entreprise: number | null;
  id_livreur: number | null;
  id_tarif: number;
  montant: number;
  date_debut: string;
  date_fin: string;
  statut: 'ACTIF' | 'EXPIRE' | 'SUSPENDU';
  mode_paiement: 'EN_LIGNE' | 'CASH';
  statut_paiement: 'EN_ATTENTE' | 'CONFIRME';
  tarif?: TarifAbonnement;
  entreprise?: { utilisateur?: Utilisateur };
  livreur?: { utilisateur?: Utilisateur };
  abonne_nom?: string;
  abonne_type?: 'ENTREPRISE' | 'LIVREUR';
}
