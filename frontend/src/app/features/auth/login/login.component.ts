import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RouterLinkActive],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  erreur = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    mot_de_passe: ['', Validators.required],
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  soumettre(): void {
    if (this.form.invalid) return;

    const { email, mot_de_passe } = this.form.value;
    this.auth.login(email!, mot_de_passe!).subscribe({
      next: (res) => {
        // Redirection selon le rôle (cf. cas d'utilisation "Vérifier rôle")
        const routesParRole: Record<string, string> = {
          CLIENT: '/client/mes-demandes',
          LIVREUR: '/livreur/missions',
          ENTREPRISE: '/entreprise/demandes',
          ADMIN: '/admin/dashboard',
        };
        this.router.navigate([routesParRole[res.utilisateur.role] ?? '/']);
      },
      error: () => (this.erreur = 'Identifiants invalides.'),
    });
  }
}
