import { Utilisateur } from './utilisateur.model';

export interface Client {
  id: number;
  adresse_facturation: string | null;
  utilisateur?: Utilisateur;
}
