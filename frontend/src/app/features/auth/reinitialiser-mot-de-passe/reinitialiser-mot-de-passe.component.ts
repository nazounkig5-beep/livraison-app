import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/** Cas d'utilisation : "Réinitialiser le mot de passe" (à partir du lien reçu par email) */
@Component({
  selector: 'app-reinitialiser-mot-de-passe',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reinitialiser-mot-de-passe.component.html',
})
export class ReinitialiserMotDePasseComponent implements OnInit {
  erreur = '';
  succes = false;
  envoiEnCours = false;
  private email = '';
  private token = '';

  form = this.fb.group({
    mot_de_passe: ['', [Validators.required, Validators.minLength(6)]],
    mot_de_passe_confirmation: ['', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  soumettre(): void {
    if (this.form.invalid) return;

    this.erreur = '';
    const { mot_de_passe, mot_de_passe_confirmation } = this.form.value;

    if (mot_de_passe !== mot_de_passe_confirmation) {
      this.erreur = 'Les deux mots de passe ne correspondent pas.';
      return;
    }

    if (!this.email || !this.token) {
      this.erreur = 'Lien de réinitialisation invalide. Redemandez un nouveau lien.';
      return;
    }

    this.envoiEnCours = true;
    this.auth.reinitialiserMotDePasse(this.email, this.token, mot_de_passe!, mot_de_passe_confirmation!).subscribe({
      next: () => {
        this.envoiEnCours = false;
        this.succes = true;
        setTimeout(() => this.router.navigate(['/auth/login']), 2500);
      },
      error: (err) => {
        this.envoiEnCours = false;
        this.erreur = err?.error?.message ?? 'Ce lien est invalide ou a expiré.';
      },
    });
  }
}
