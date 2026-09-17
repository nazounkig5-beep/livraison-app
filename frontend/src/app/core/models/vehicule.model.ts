export interface Vehicule {
  id: number;
  id_entreprise: number;
  id_type_vehicule: number;
  immatriculation: string;
  statut: 'DISPONIBLE' | 'EN_MAINTENANCE';
}
