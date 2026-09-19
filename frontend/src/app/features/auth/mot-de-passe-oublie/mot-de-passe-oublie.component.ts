import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/** Cas d'utilisation : "Mot de passe oublié" */
@Component({
  selector: 'app-mot-de-passe-oublie',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './mot-de-passe-oublie.component.html',
})
export class MotDePasseOublieComponent {
  message = '';
  erreur = '';
  envoiEnCours = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  soumettre(): void {
    if (this.form.invalid) return;

    this.message = '';
    this.erreur = '';
    this.envoiEnCours = true;
    const { email } = this.form.value;
    this.auth.demanderReinitialisation(email!).subscribe({
      next: (res) => {
        this.envoiEnCours = false;
        this.message = res.message;
      },
      error: () => {
        this.envoiEnCours = false;
        this.erreur = "Impossible d'envoyer le lien pour le moment. Réessayez plus tard.";
      },
    });
  }
}
