import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Abonnement } from '../models/abonnement.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AbonnementService {
  private readonly apiUrl = `${environment.apiUrl}/abonnements`;

  constructor(private http: HttpClient) {}

  mesAbonnements(): Observable<Abonnement[]> {
    return this.http.get<Abonnement[]>(`${this.apiUrl}/mes-abonnements`);
  }

  souscrire(id_tarif: number, mode: 'EN_LIGNE' | 'CASH'): Observable<Abonnement> {
    return this.http.post<Abonnement>(`${this.apiUrl}/souscrire`, { id_tarif, mode });
  }
}
