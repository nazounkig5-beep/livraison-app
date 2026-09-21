import { Entreprise } from './entreprise.model';

export type Role = 'ADMIN' | 'CLIENT' | 'LIVREUR' | 'ENTREPRISE' | 'EMPLOYE';

export interface Utilisateur {
  id: number;
  nom: string;
  email: string;
  role: Role;
  statut_compte: 'ACTIF' | 'SUSPENDU';
  date_creation: string;
  telephone?: string | null;
  ville?: string | null;
  adresse?: string | null;
  photo_url?: string | null;
  langue?: 'fr' | 'en';
  /** Résumé d'activité selon le rôle (ex: "3 demande(s)"), fourni par GET /admin/utilisateurs. */
  activite?: string | null;
  entreprise?: Entreprise;
}

export interface StatistiquesUtilisateurs {
  total: number;
  clients: number;
  entreprises: number;
  livreurs: number;
  admins: number;
}
