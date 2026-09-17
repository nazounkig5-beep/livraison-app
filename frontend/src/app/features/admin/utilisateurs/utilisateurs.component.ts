import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { StatistiquesUtilisateurs, Utilisateur } from '../../../core/models/utilisateur.model';

const LIBELLES_ROLE: Record<string, string> = {
  ADMIN: 'Admin',
  CLIENT: 'Client',
  LIVREUR: 'Livreur',
  ENTREPRISE: 'Entreprise',
};

/** Cas d'utilisation Admin : "Gérer utilisateurs" */
@Component({
  selector: 'app-admin-utilisateurs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './utilisateurs.component.html',
})
export class UtilisateursComponent implements OnInit {
  utilisateurs: Utilisateur[] = [];
  stats: StatistiquesUtilisateurs | null = null;
  onglet: '' | 'CLIENT' | 'ENTREPRISE' | 'LIVREUR' | 'ADMIN' = '';
  recherche = '';
  erreurSuppression: string | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.adminService.utilisateurs(this.onglet || undefined, this.recherche || undefined).subscribe((data) => {
      this.utilisateurs = data.utilisateurs;
      this.stats = data.stats;
    });
  }

  changerOnglet(onglet: '' | 'CLIENT' | 'ENTREPRISE' | 'LIVREUR' | 'ADMIN'): void {
    this.onglet = onglet;
    this.charger();
  }

  suspendre(utilisateur: Utilisateur): void {
    this.adminService.suspendre(utilisateur.id).subscribe(() => this.charger());
  }

  reactiver(utilisateur: Utilisateur): void {
    this.adminService.reactiver(utilisateur.id).subscribe(() => this.charger());
  }

  supprimer(utilisateur: Utilisateur): void {
    this.erreurSuppression = null;
    const confirmation = window.confirm(
      `Supprimer définitivement le compte de ${utilisateur.nom} ? Cette action est irréversible.`
    );
    if (!confirmation) return;

    this.adminService.supprimerUtilisateur(utilisateur.id).subscribe({
      next: () => this.charger(),
      error: (err) => {
        this.erreurSuppression = err.error?.message ?? 'Impossible de supprimer ce compte pour le moment.';
      },
    });
  }

  libelleRole(role: string): string {
    return LIBELLES_ROLE[role] ?? role;
  }

  initiales(nom: string): string {
    return nom
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((mot) => mot[0]?.toUpperCase())
      .join('');
  }
}
