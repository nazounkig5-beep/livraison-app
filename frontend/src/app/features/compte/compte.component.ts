import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

const LIBELLES_ROLE: Record<string, string> = {
  ADMIN: 'Administrateur',
  CLIENT: 'Client',
  LIVREUR: 'Livreur',
  ENTREPRISE: 'Entreprise',
  EMPLOYE: 'Livreur employé',
};

/** Cas d'utilisation : "Gérer mon compte" (infos/photo) + "Changer mon mot de passe" + "Supprimer mon compte" */
@Component({
  selector: 'app-compte',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './compte.component.html',
})
export class CompteComponent {
  @ViewChild('inputPhoto') inputPhoto?: ElementRef<HTMLInputElement>;

  messageProfil = '';
  messagePhoto = '';
  photoEnCours = false;
  messageMotDePasse = '';
  erreurSuppression = '';
  suppressionEnCours = false;

  formProfil = this.fb.group({
    nom: [this.auth.utilisateur()?.nom ?? '', Validators.required],
    email: [this.auth.utilisateur()?.email ?? '', [Validators.required, Validators.email]],
    telephone: [this.auth.utilisateur()?.telephone ?? ''],
    ville: [this.auth.utilisateur()?.ville ?? ''],
    adresse: [this.auth.utilisateur()?.adresse ?? ''],
  });

  formMotDePasse = this.fb.group({
    ancien_mot_de_passe: ['', Validators.required],
    nouveau_mot_de_passe: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(private fb: FormBuilder, public auth: AuthService, private router: Router) {}

  get libelleRole(): string {
    return LIBELLES_ROLE[this.auth.utilisateur()?.role ?? ''] ?? '';
  }

  get initiales(): string {
    const nom = this.auth.utilisateur()?.nom ?? '';
    return nom
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((mot) => mot[0]?.toUpperCase())
      .join('');
  }

  enregistrerProfil(): void {
    if (this.formProfil.invalid) return;

    this.messageProfil = '';
    const { nom, email, telephone, ville, adresse } = this.formProfil.value;
    this.auth.mettreAJourProfil(nom!, email!, telephone, ville, adresse).subscribe({
      next: () => (this.messageProfil = 'Profil mis à jour.'),
      error: (err) => (this.messageProfil = err?.error?.errors?.email?.[0] ?? 'Impossible de mettre à jour le profil.'),
    });
  }

  declencherChoixPhoto(): void {
    this.inputPhoto?.nativeElement.click();
  }

  changerPhoto(evenement: Event): void {
    const fichier = (evenement.target as HTMLInputElement).files?.[0];
    if (!fichier) return;

    this.messagePhoto = '';
    this.photoEnCours = true;
    this.auth.mettreAJourPhoto(fichier).subscribe({
      next: () => {
        this.photoEnCours = false;
        this.messagePhoto = 'Photo mise à jour.';
      },
      error: (err) => {
        this.photoEnCours = false;
        this.messagePhoto = err?.error?.errors?.photo?.[0] ?? 'Impossible de mettre à jour la photo.';
      },
    });
  }

  changerMotDePasse(): void {
    if (this.formMotDePasse.invalid) return;

    this.messageMotDePasse = '';
    const { ancien_mot_de_passe, nouveau_mot_de_passe } = this.formMotDePasse.value;
    this.auth.changerMotDePasse(ancien_mot_de_passe!, nouveau_mot_de_passe!).subscribe({
      next: () => {
        this.messageMotDePasse = 'Mot de passe mis à jour.';
        this.formMotDePasse.reset();
      },
      error: (err) => (this.messageMotDePasse = err?.error?.message ?? 'Impossible de changer le mot de passe.'),
    });
  }

  supprimerMonCompte(): void {
    this.erreurSuppression = '';
    const confirmation = window.confirm('Supprimer définitivement votre compte ? Cette action est irréversible.');
    if (!confirmation) return;

    this.suppressionEnCours = true;
    this.auth.supprimerMonCompte().subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: (err) => {
        this.suppressionEnCours = false;
        this.erreurSuppression = err?.error?.message ?? 'Impossible de supprimer ce compte pour le moment.';
      },
    });
  }
}
