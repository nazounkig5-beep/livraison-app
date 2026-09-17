import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TarifAbonnement, TypeService, TypeVehicule } from '../models/parametre.model';
import { Entreprise } from '../models/entreprise.model';
import { environment } from '../../../environments/environment';

/** Paramètres accessibles à tous les rôles authentifiés, pour peupler les formulaires (cf. routes/api.php lignes 81-84) */
@Injectable({ providedIn: 'root' })
export class ParametreService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  typesService(): Observable<TypeService[]> {
    return this.http.get<TypeService[]>(`${this.apiUrl}/types-service`);
  }

  typesVehicule(): Observable<TypeVehicule[]> {
    return this.http.get<TypeVehicule[]>(`${this.apiUrl}/types-vehicule`);
  }

  tarifsAbonnement(): Observable<TarifAbonnement[]> {
    return this.http.get<TarifAbonnement[]>(`${this.apiUrl}/tarifs-abonnement`);
  }

  entreprisesActives(): Observable<Entreprise[]> {
    return this.http.get<Entreprise[]>(`${this.apiUrl}/entreprises-actives`);
  }
}
