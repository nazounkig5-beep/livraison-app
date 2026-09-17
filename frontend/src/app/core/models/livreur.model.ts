import { Utilisateur } from './utilisateur.model';

export interface Livreur {
  id: number;
  id_entreprise: number | null;
  latitude: number | null;
  longitude: number | null;
  note_moyenne: number;
  type: 'EMPLOYE' | 'INDEPENDANT';
  disponible?: boolean;
  utilisateur?: Utilisateur;
}
