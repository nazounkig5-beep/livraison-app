import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DemandeLivraison } from '../models/demande.model';
import { Vehicule } from '../models/vehicule.model';
import { Livreur } from '../models/livreur.model';
import { Entreprise } from '../models/entreprise.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EntrepriseService {
  private readonly apiUrl = `${environment.apiUrl}/entreprise`;

  constructor(private http: HttpClient) {}

  demandes(): Observable<DemandeLivraison[]> {
    return this.http.get<DemandeLivraison[]>(`${this.apiUrl}/demandes`);
  }

  historique(): Observable<DemandeLivraison[]> {
    return this.http.get<DemandeLivraison[]>(`${this.apiUrl}/demandes/historique`);
  }

  accepter(id: number) {
    return this.http.post(`${this.apiUrl}/demandes/${id}/accepter`, {});
  }

  refuser(id: number) {
    return this.http.post(`${this.apiUrl}/demandes/${id}/refuser`, {});
  }

  programmer(id: number, date_programmee: string) {
    return this.http.post(`${this.apiUrl}/demandes/${id}/programmer`, { date_programmee });
  }

  assigner(id: number, id_livreur: number, id_vehicule?: number | null) {
    return this.http.post(`${this.apiUrl}/demandes/${id}/assigner`, { id_livreur, id_vehicule });
  }

  confirmerPaiement(id: number) {
    return this.http.post(`${this.apiUrl}/demandes/${id}/confirmer-paiement`, {});
  }

  livreurs(): Observable<Livreur[]> {
    return this.http.get<Livreur[]>(`${this.apiUrl}/livreurs`);
  }

  vehicules(): Observable<Vehicule[]> {
    return this.http.get<Vehicule[]>(`${this.apiUrl}/vehicules`);
  }

  ajouterVehicule(payload: Partial<Vehicule>) {
    return this.http.post<Vehicule>(`${this.apiUrl}/vehicules`, payload);
  }

  modifierVehicule(id: number, payload: Partial<Vehicule>) {
    return this.http.put<Vehicule>(`${this.apiUrl}/vehicules/${id}`, payload);
  }

  supprimerVehicule(id: number) {
    return this.http.delete(`${this.apiUrl}/vehicules/${id}`);
  }

  employes(): Observable<Livreur[]> {
    return this.http.get<Livreur[]>(`${this.apiUrl}/employes`);
  }

  ajouterEmploye(nom: string, email: string, mot_de_passe: string): Observable<Livreur> {
    return this.http.post<Livreur>(`${this.apiUrl}/employes`, { nom, email, mot_de_passe });
  }

  supprimerEmploye(id: number) {
    return this.http.delete(`${this.apiUrl}/employes/${id}`);
  }

  mettreAJourPaiement(
    numero_orange: string | null,
    numero_moov: string | null,
    cinetpay_site_id?: string | null,
    cinetpay_api_key?: string | null
  ): Observable<Entreprise> {
    return this.http.put<Entreprise>(`${this.apiUrl}/paiement`, {
      numero_orange,
      numero_moov,
      cinetpay_site_id,
      cinetpay_api_key,
    });
  }

  envoyerQrLivreurs(): Observable<{ message: string; nombre_livreurs: number }> {
    return this.http.post<{ message: string; nombre_livreurs: number }>(`${this.apiUrl}/paiement/envoyer`, {});
  }
}
