import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Entreprise } from '../models/entreprise.model';
import { StatistiquesUtilisateurs, Utilisateur } from '../models/utilisateur.model';
import { TarifAbonnement, TypeService, TypeVehicule } from '../models/parametre.model';
import { Abonnement } from '../models/abonnement.model';
import { environment } from '../../../environments/environment';

/** Actions réservées au rôle ADMIN (cf. routes/api.php, groupe prefix('admin')) */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  entreprises(): Observable<Entreprise[]> {
    return this.http.get<Entreprise[]>(`${this.apiUrl}/entreprises`);
  }

  validerEntreprise(id: number, statut: 'ACTIVE' | 'REJETEE'): Observable<Entreprise> {
    return this.http.post<Entreprise>(`${this.apiUrl}/entreprises/${id}/valider`, { statut_validation: statut });
  }

  utilisateurs(
    role?: string,
    recherche?: string
  ): Observable<{ utilisateurs: Utilisateur[]; stats: StatistiquesUtilisateurs }> {
    const params: Record<string, string> = {};
    if (role) params['role'] = role;
    if (recherche) params['recherche'] = recherche;
    return this.http.get<{ utilisateurs: Utilisateur[]; stats: StatistiquesUtilisateurs }>(
      `${this.apiUrl}/utilisateurs`,
      { params }
    );
  }

  suspendre(id: number): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(`${this.apiUrl}/utilisateurs/${id}/suspendre`, {});
  }

  reactiver(id: number): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(`${this.apiUrl}/utilisateurs/${id}/reactiver`, {});
  }

  supprimerUtilisateur(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/utilisateurs/${id}`);
  }

  typesVehicule(): Observable<TypeVehicule[]> {
    return this.http.get<TypeVehicule[]>(`${this.apiUrl}/types-vehicule`);
  }

  creerTypeVehicule(nom: string): Observable<TypeVehicule> {
    return this.http.post<TypeVehicule>(`${this.apiUrl}/types-vehicule`, { nom });
  }

  typesService(): Observable<TypeService[]> {
    return this.http.get<TypeService[]>(`${this.apiUrl}/types-service`);
  }

  creerTypeService(nom: string): Observable<TypeService> {
    return this.http.post<TypeService>(`${this.apiUrl}/types-service`, { nom });
  }

  tarifsAbonnement(): Observable<TarifAbonnement[]> {
    return this.http.get<TarifAbonnement[]>(`${this.apiUrl}/tarifs-abonnement`);
  }

  creerTarifAbonnement(payload: Partial<TarifAbonnement>): Observable<TarifAbonnement> {
    return this.http.post<TarifAbonnement>(`${this.apiUrl}/tarifs-abonnement`, payload);
  }

  abonnements(): Observable<Abonnement[]> {
    return this.http.get<Abonnement[]>(`${this.apiUrl}/abonnements`);
  }

  confirmerPaiementAbonnement(id: number): Observable<Abonnement> {
    return this.http.post<Abonnement>(`${this.apiUrl}/abonnements/${id}/confirmer-paiement`, {});
  }
}
