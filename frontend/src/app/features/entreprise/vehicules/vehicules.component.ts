import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EntrepriseService } from '../../../core/services/entreprise.service';
import { ParametreService } from '../../../core/services/parametre.service';
import { Vehicule } from '../../../core/models/vehicule.model';
import { TypeVehicule } from '../../../core/models/parametre.model';

/** Cas d'utilisation Entreprise : "Gérer véhicules" (ajout, mise à jour statut, suppression) */
@Component({
  selector: 'app-entreprise-vehicules',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vehicules.component.html',
})
export class VehiculesComponent implements OnInit {
  vehicules: Vehicule[] = [];
  typesVehicule: TypeVehicule[] = [];

  form = this.fb.group({
    id_type_vehicule: [null, Validators.required],
    immatriculation: ['', Validators.required],
  });

  constructor(
    private entrepriseService: EntrepriseService,
    private parametreService: ParametreService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.charger();
    this.parametreService.typesVehicule().subscribe((data) => (this.typesVehicule = data));
  }

  charger(): void {
    this.entrepriseService.vehicules().subscribe((data) => (this.vehicules = data));
  }

  ajouter(): void {
    if (this.form.invalid) return;
    this.entrepriseService.ajouterVehicule(this.form.value as Partial<Vehicule>).subscribe(() => {
      this.form.reset();
      this.charger();
    });
  }

  basculerStatut(vehicule: Vehicule): void {
    const statut = vehicule.statut === 'DISPONIBLE' ? 'EN_MAINTENANCE' : 'DISPONIBLE';
    this.entrepriseService.modifierVehicule(vehicule.id, { statut }).subscribe(() => this.charger());
  }

  supprimer(vehicule: Vehicule): void {
    this.entrepriseService.supprimerVehicule(vehicule.id).subscribe(() => this.charger());
  }
}
