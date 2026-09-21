import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';

/** Cas d'utilisation : "Mot de passe oublié" */
@Component({
  selector: 'app-mot-de-passe-oublie',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './mot-de-passe-oublie.component.html',
})
export class MotDePasseOublieComponent {
  messageEnvoye = false;
  erreur = '';
  envoiEnCours = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  soumettre(): void {
    if (this.form.invalid) return;

    this.messageEnvoye = false;
    this.erreur = '';
    this.envoiEnCours = true;
    const { email } = this.form.value;
    this.auth.demanderReinitialisation(email!).subscribe({
      next: () => {
        this.envoiEnCours = false;
        this.messageEnvoye = true;
      },
      error: () => {
        this.envoiEnCours = false;
        this.erreur = 'auth.motDePasseOublie.erreur';
      },
    });
  }
}
