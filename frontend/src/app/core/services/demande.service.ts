import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DemandeLivraison, StatistiquesClient, SuiviPosition } from '../models/demande.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DemandeService {
  private readonly apiUrl = `${environment.apiUrl}/demandes`;

  constructor(private http: HttpClient) {}

  creer(payload: Partial<DemandeLivraison>): Observable<DemandeLivraison> {
    return this.http.post<DemandeLivraison>(this.apiUrl, payload);
  }

  mesDemandes(): Observable<DemandeLivraison[]> {
    return this.http.get<DemandeLivraison[]>(`${this.apiUrl}/mes-demandes`);
  }

  mesStatistiques(): Observable<StatistiquesClient> {
    return this.http.get<StatistiquesClient>(`${this.apiUrl}/mes-statistiques`);
  }

  detail(id: number): Observable<DemandeLivraison> {
    return this.http.get<DemandeLivraison>(`${this.apiUrl}/${id}`);
  }

  suivi(id: number): Observable<SuiviPosition> {
    return this.http.get<SuiviPosition>(`${this.apiUrl}/${id}/suivi`);
  }

  payer(id: number, mode: 'CASH') {
    return this.http.post(`${this.apiUrl}/${id}/payer`, { mode });
  }

  /** Initie un paiement mobile money via CinetPay et renvoie l'URL du checkout hébergé vers laquelle rediriger le client. */
  initierPaiementEnLigne(id: number): Observable<{ payment_url: string }> {
    return this.http.post<{ payment_url: string }>(`${this.apiUrl}/${id}/paiement/initier`, {});
  }

  noter(id: number, note: number, commentaire?: string) {
    return this.http.post(`${this.apiUrl}/${id}/noter`, { note, commentaire });
  }

  annuler(id: number) {
    return this.http.post(`${this.apiUrl}/${id}/annuler`, {});
  }
}
