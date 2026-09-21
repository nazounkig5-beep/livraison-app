import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { Langue, LangueService } from '../../core/services/langue.service';

/** Cas d'utilisation : "Gérer mon compte" (infos/photo/langue) + "Changer mon mot de passe" + "Supprimer mon compte" */
@Component({
  selector: 'app-compte',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
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
    langue: [this.auth.utilisateur()?.langue ?? this.langueService.langueActuelle],
  });

  formMotDePasse = this.fb.group({
    ancien_mot_de_passe: ['', Validators.required],
    nouveau_mot_de_passe: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private fb: FormBuilder,
    public auth: AuthService,
    private router: Router,
    private translate: TranslateService,
    public langueService: LangueService
  ) {}

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
    const { nom, email, telephone, ville, adresse, langue } = this.formProfil.value;
    this.auth.mettreAJourProfil(nom!, email!, telephone, ville, adresse, langue).subscribe({
      next: () => {
        this.messageProfil = this.translate.instant('partage.compte.profilMisAJour');
        this.langueService.changer((langue as Langue) ?? 'fr');
      },
      error: (err) =>
        (this.messageProfil =
          err?.error?.errors?.email?.[0] ?? this.translate.instant('partage.compte.erreurProfil')),
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
        this.messagePhoto = this.translate.instant('partage.compte.photoMiseAJour');
      },
      error: (err) => {
        this.photoEnCours = false;
        this.messagePhoto = err?.error?.errors?.photo?.[0] ?? this.translate.instant('partage.compte.erreurPhoto');
      },
    });
  }

  changerMotDePasse(): void {
    if (this.formMotDePasse.invalid) return;

    this.messageMotDePasse = '';
    const { ancien_mot_de_passe, nouveau_mot_de_passe } = this.formMotDePasse.value;
    this.auth.changerMotDePasse(ancien_mot_de_passe!, nouveau_mot_de_passe!).subscribe({
      next: () => {
        this.messageMotDePasse = this.translate.instant('partage.compte.motDePasseMisAJour');
        this.formMotDePasse.reset();
      },
      error: (err) =>
        (this.messageMotDePasse = err?.error?.message ?? this.translate.instant('partage.compte.erreurMotDePasse')),
    });
  }

  supprimerMonCompte(): void {
    this.erreurSuppression = '';
    const confirmation = window.confirm(this.translate.instant('partage.compte.confirmerSuppression'));
    if (!confirmation) return;

    this.suppressionEnCours = true;
    this.auth.supprimerMonCompte().subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: (err) => {
        this.suppressionEnCours = false;
        this.erreurSuppression = err?.error?.message ?? this.translate.instant('partage.compte.erreurSuppression');
      },
    });
  }
}
