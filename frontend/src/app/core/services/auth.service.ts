import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { Utilisateur } from '../models/utilisateur.model';
import { environment } from '../../../environments/environment';

interface AuthResponse {
  utilisateur: Utilisateur;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  // signal Angular : accessible partout via authService.utilisateur()
  utilisateur = signal<Utilisateur | null>(this.lireUtilisateurStocke());

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, mot_de_passe: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, mot_de_passe }).pipe(
      tap((res) => this.enregistrerSession(res))
    );
  }

  register(payload: Record<string, unknown>): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload).pipe(
      tap((res) => this.enregistrerSession(res))
    );
  }

  mettreAJourProfil(
    nom: string,
    email: string,
    telephone?: string | null,
    ville?: string | null,
    adresse?: string | null
  ): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`${this.apiUrl}/profil`, { nom, email, telephone, ville, adresse }).pipe(
      tap((utilisateur) => {
        localStorage.setItem('utilisateur', JSON.stringify(utilisateur));
        this.utilisateur.set(utilisateur);
      })
    );
  }

  mettreAJourPhoto(fichier: File): Observable<Utilisateur> {
    const formData = new FormData();
    formData.append('photo', fichier);
    return this.http.post<Utilisateur>(`${this.apiUrl}/profil/photo`, formData).pipe(
      tap((utilisateur) => {
        localStorage.setItem('utilisateur', JSON.stringify(utilisateur));
        this.utilisateur.set(utilisateur);
      })
    );
  }

  supprimerMonCompte(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/profil`).pipe(tap(() => this.deconnexionLocale()));
  }

  moi(): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.apiUrl}/me`).pipe(
      tap((utilisateur) => {
        localStorage.setItem('utilisateur', JSON.stringify(utilisateur));
        this.utilisateur.set(utilisateur);
      })
    );
  }

  changerMotDePasse(ancien_mot_de_passe: string, nouveau_mot_de_passe: string) {
    return this.http.put(`${this.apiUrl}/profil/mot-de-passe`, { ancien_mot_de_passe, nouveau_mot_de_passe });
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      complete: () => this.deconnexionLocale(),
      error: () => this.deconnexionLocale(),
    });
  }

  private deconnexionLocale(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('utilisateur');
    this.utilisateur.set(null);
    this.router.navigate(['/auth/login']);
  }

  private enregistrerSession(res: AuthResponse): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('utilisateur', JSON.stringify(res.utilisateur));
    this.utilisateur.set(res.utilisateur);
  }

  private lireUtilisateurStocke(): Utilisateur | null {
    const raw = localStorage.getItem('utilisateur');
    return raw ? JSON.parse(raw) : null;
  }

  get token(): string | null {
    return localStorage.getItem('token');
  }

  estConnecte(): boolean {
    return !!this.token;
  }

  aLeRole(...roles: string[]): boolean {
    return !!this.utilisateur() && roles.includes(this.utilisateur()!.role);
  }
}
