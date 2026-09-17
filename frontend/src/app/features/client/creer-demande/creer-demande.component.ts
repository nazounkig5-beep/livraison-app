import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DemandeService } from '../../../core/services/demande.service';
import { ParametreService } from '../../../core/services/parametre.service';
import { TypeService } from '../../../core/models/parametre.model';
import { Entreprise } from '../../../core/models/entreprise.model';

/**
 * Cas d'utilisation Client : "Créer demande de livraison"
 * Reprend le flux MCT : choisir l'entreprise -> type de service -> adresses -> tarif calculé côté serveur.
 */
@Component({
  selector: 'app-creer-demande',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './creer-demande.component.html',
})
export class CreerDemandeComponent implements OnInit {
  envoiEnCours = false;
  erreur = '';
  typesService: TypeService[] = [];
  entreprises: Entreprise[] = [];

  form = this.fb.group({
    id_entreprise: [null, Validators.required],
    id_type_service: [null, Validators.required],
    adresse_depart: ['', Validators.required],
    adresse_arrivee: ['', Validators.required],
    distance: [null as number | null],
    date_programmee: [null as string | null],
  });

  constructor(
    private fb: FormBuilder,
    private demandeService: DemandeService,
    private parametreService: ParametreService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.parametreService.typesService().subscribe((data) => (this.typesService = data));
    this.parametreService.entreprisesActives().subscribe((data) => (this.entreprises = data));
  }

  soumettre(): void {
    if (this.form.invalid) return;

    this.envoiEnCours = true;
    this.erreur = '';
    this.demandeService.creer(this.form.value as any).subscribe({
      next: (demande) => this.router.navigate(['/client/mes-demandes', demande.id]),
      error: () => {
        this.envoiEnCours = false;
        this.erreur = "Impossible de créer la demande. Vérifiez les informations saisies.";
      },
    });
  }
}
