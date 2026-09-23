import { Livreur } from './livreur.model';
import { Vehicule } from './vehicule.model';
import { Entreprise } from './entreprise.model';
import { Client } from './client.model';

export type StatutDemande = 'EN_ATTENTE' | 'ACCEPTEE' | 'PROGRAMMEE' | 'EN_COURS' | 'LIVREE' | 'ANNULEE';

export interface Paiement {
  id: number;
  id_demande: number;
  montant: number;
  mode: 'EN_LIGNE' | 'CASH';
  statut: 'EN_ATTENTE' | 'CONFIRME' | 'ECHEC';
  date_transaction: string | null;
  provider?: string | null;
  lien_paiement?: string | null;
}

export interface Notation {
  id: number;
  id_demande: number;
  id_auteur: number;
  note: number;
  commentaire: string | null;
  date: string;
}

export interface DemandeLivraison {
  id: number;
  id_client: number;
  id_entreprise: number | null;
  id_type_service: number;
  adresse_depart: string;
  adresse_arrivee: string;
  latitude_arrivee: number | null;
  longitude_arrivee: number | null;
  distance: number | null;
  tarif_estime: number | null;
  code_livraison: string | null;
  statut: StatutDemande;
  date_creation: string;
  date_programmee: string | null;
  mission?: Mission;
  paiement?: Paiement;
  notation?: Notation;
  entreprise?: Entreprise;
  client?: Client;
}

export interface PointPosition {
  latitude: number;
  longitude: number;
  timestamp: string;
  evenement?: string | null;
}

export interface SuiviPosition {
  statut_demande: StatutDemande;
  statut_mission: 'EN_ATTENTE' | 'EN_COURS' | 'TERMINEE' | null;
  livreur_nom?: string | null;
  position: PointPosition | null;
  trajet: PointPosition[];
  // Présents uniquement côté suivi entreprise (cf. "Signaler une panne").
  en_panne?: boolean;
  panne_depuis?: string | null;
  panne_description?: string | null;
  position_panne?: PointPosition | null;
  duree_panne_minutes?: number | null;
}

export interface StatistiquesClient {
  total_demandes: number;
  demandes_par_statut: Record<string, number>;
  total_incidents: number;
  total_paiements: number;
}

export interface Mission {
  id: number;
  id_demande: number;
  id_livreur: number;
  id_vehicule: number | null;
  statut_prise_en_charge: 'EN_ATTENTE' | 'EN_COURS' | 'TERMINEE';
  en_panne: boolean;
  panne_depuis: string | null;
  panne_description: string | null;
  demande?: DemandeLivraison;
  livreur?: Livreur;
  vehicule?: Vehicule;
}
