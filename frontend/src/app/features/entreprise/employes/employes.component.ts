import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EntrepriseService } from '../../../core/services/entreprise.service';
import { Livreur } from '../../../core/models/livreur.model';

/** Cas d'utilisation Entreprise : "Gérer mes livreurs employés" */
@Component({
  selector: 'app-entreprise-employes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './employes.component.html',
})
export class EmployesComponent implements OnInit {
  employes: Livreur[] = [];
  erreur = '';

  form = this.fb.group({
    nom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mot_de_passe: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private entrepriseService: EntrepriseService,
    private fb: FormBuilder,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.entrepriseService.employes().subscribe((data) => (this.employes = data));
  }

  ajouter(): void {
    if (this.form.invalid) return;

    this.erreur = '';
    const { nom, email, mot_de_passe } = this.form.value;
    this.entrepriseService.ajouterEmploye(nom!, email!, mot_de_passe!).subscribe({
      next: () => {
        this.form.reset();
        this.charger();
      },
      error: (err) =>
        (this.erreur = err?.error?.errors?.email?.[0] ?? this.translate.instant('entreprise.employes.erreurDefaut')),
    });
  }

  detacher(livreur: Livreur): void {
    this.entrepriseService.supprimerEmploye(livreur.id).subscribe(() => this.charger());
  }
}
