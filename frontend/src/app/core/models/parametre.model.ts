export interface TypeService {
  id: number;
  nom: 'livraison' | 'demenagement' | 'transport_materiel';
}

export interface TypeVehicule {
  id: number;
  nom: 'moto' | 'tricycle' | 'cargo' | 'camion';
}

export interface TarifAbonnement {
  id: number;
  nom: string;
  duree: number;
  prix: number;
  description: string | null;
}
