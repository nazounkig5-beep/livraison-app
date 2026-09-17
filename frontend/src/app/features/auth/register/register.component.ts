import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/** Cas d'utilisation : "S'inscrire" (CLIENT, LIVREUR ou ENTREPRISE) */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RouterLinkActive],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  erreurs: string[] = [];

  form = this.fb.group({
    nom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mot_de_passe: ['', [Validators.required, Validators.minLength(6)]],
    role: ['CLIENT', Validators.required],
    siret: [''],
    adresse_facturation: [''],
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  get estEntreprise(): boolean {
    return this.form.value.role === 'ENTREPRISE';
  }

  soumettre(): void {
    if (this.form.invalid) return;

    this.erreurs = [];
    this.auth.register(this.form.value).subscribe({
      next: (res) => {
        const routesParRole: Record<string, string> = {
          CLIENT: '/client/mes-demandes',
          LIVREUR: '/livreur/missions',
          ENTREPRISE: '/entreprise/demandes',
        };
        this.router.navigate([routesParRole[res.utilisateur.role] ?? '/']);
      },
      error: (err) => {
        const messages = err?.error?.errors;
        this.erreurs = messages ? Object.values(messages).flat() as string[] : ["Inscription impossible."];
      },
    });
  }
}
