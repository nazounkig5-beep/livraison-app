import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mission } from '../models/demande.model';
import { Entreprise } from '../models/entreprise.model';
import { StatistiquesNotes } from '../models/notation.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MissionService {
  private readonly apiUrl = `${environment.apiUrl}/livreur/missions`;

  constructor(private http: HttpClient) {}

  mesMissions(): Observable<Mission[]> {
    return this.http.get<Mission[]>(this.apiUrl);
  }

  detail(id: number): Observable<Mission> {
    return this.http.get<Mission>(`${this.apiUrl}/${id}`);
  }

  /** L'entreprise employeuse (livreur EMPLOYE uniquement) et son QR code de paiement. */
  monEntreprise(): Observable<Entreprise> {
    return this.http.get<Entreprise>(`${environment.apiUrl}/livreur/mon-entreprise`);
  }

  /** Cas d'utilisation : "Consulter mes notes" (par livraison, moyenne, meilleure note par mois). */
  mesNotes(): Observable<StatistiquesNotes> {
    return this.http.get<StatistiquesNotes>(`${environment.apiUrl}/livreur/mes-notes`);
  }

  prendreEnCharge(id: number, latitude?: number, longitude?: number) {
    return this.http.post(`${this.apiUrl}/${id}/prendre-en-charge`, { latitude, longitude });
  }

  mettreAJourPosition(id: number, latitude: number, longitude: number) {
    return this.http.post(`${this.apiUrl}/${id}/position`, { latitude, longitude });
  }

  /**
   * Fige la position exacte de l'arrêt et prévient l'entreprise, pour qu'elle organise le
   * dépannage. La photo est optionnelle ; envoi en FormData (pas en JSON) dès qu'un fichier est
   * fourni, seul format que le serveur accepte pour un upload de fichier.
   */
  signalerPanne(id: number, latitude: number, longitude: number, description?: string, photo?: File): Observable<Mission> {
    if (!photo) {
      return this.http.post<Mission>(`${this.apiUrl}/${id}/panne`, { latitude, longitude, description });
    }

    const donnees = new FormData();
    donnees.append('latitude', String(latitude));
    donnees.append('longitude', String(longitude));
    if (description) donnees.append('description', description);
    donnees.append('photo', photo);
    return this.http.post<Mission>(`${this.apiUrl}/${id}/panne`, donnees);
  }

  resoudrePanne(id: number, latitude: number, longitude: number): Observable<Mission> {
    return this.http.post<Mission>(`${this.apiUrl}/${id}/panne/resoudre`, { latitude, longitude });
  }

  verifierCode(id: number, code: string) {
    return this.http.post<{ valide: boolean }>(`${this.apiUrl}/${id}/verifier-code`, { code });
  }

  livrer(id: number, latitude?: number, longitude?: number) {
    return this.http.post(`${this.apiUrl}/${id}/livrer`, { latitude, longitude });
  }
}
