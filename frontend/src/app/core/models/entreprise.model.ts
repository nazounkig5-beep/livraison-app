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
  /** Position exacte de l'entreprise : sert de point de départ automatique pour les demandes "livraison". */
  latitude?: number | null;
  longitude?: number | null;
  frais_base?: number | null;
  prix_par_km?: number | null;
  utilisateur?: Utilisateur;
}
