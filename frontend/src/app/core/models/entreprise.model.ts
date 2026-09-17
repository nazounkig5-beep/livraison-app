import { Utilisateur } from './utilisateur.model';

export interface Entreprise {
  id: number;
  siret: string;
  nom: string;
  statut_validation: 'EN_ATTENTE' | 'ACTIVE' | 'REJETEE';
  date_validation: string | null;
  numero_orange?: string | null;
  numero_moov?: string | null;
  qr_code?: string | null;
  /** true si l'entreprise a déjà renseigné ses identifiants CinetPay (jamais renvoyés en clair par l'API). */
  paiement_en_ligne_configure?: boolean;
  utilisateur?: Utilisateur;
}
