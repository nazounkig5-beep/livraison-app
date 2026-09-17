import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { TarifAbonnement, TypeService, TypeVehicule } from '../../../core/models/parametre.model';

/** Cas d'utilisation Admin : "Configurer paramètres" + "Gérer abonnements & tarifs" */
@Component({
  selector: 'app-admin-parametres',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './parametres.component.html',
})
export class ParametresComponent implements OnInit {
  typesVehicule: TypeVehicule[] = [];
  typesService: TypeService[] = [];
  tarifsAbonnement: TarifAbonnement[] = [];

  formTypeVehicule = this.fb.group({ nom: ['moto', Validators.required] });
  formTypeService = this.fb.group({ nom: ['livraison', Validators.required] });
  formTarif = this.fb.group({
    nom: ['', Validators.required],
    duree: [1, [Validators.required, Validators.min(1)]],
    prix: [0, [Validators.required, Validators.min(0)]],
    description: [''],
  });

  constructor(private adminService: AdminService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.adminService.typesVehicule().subscribe((data) => (this.typesVehicule = data));
    this.adminService.typesService().subscribe((data) => (this.typesService = data));
    this.adminService.tarifsAbonnement().subscribe((data) => (this.tarifsAbonnement = data));
  }

  ajouterTypeVehicule(): void {
    if (this.formTypeVehicule.invalid) return;
    this.adminService.creerTypeVehicule(this.formTypeVehicule.value.nom!).subscribe(() => this.charger());
  }

  ajouterTypeService(): void {
    if (this.formTypeService.invalid) return;
    this.adminService.creerTypeService(this.formTypeService.value.nom!).subscribe(() => this.charger());
  }

  ajouterTarif(): void {
    if (this.formTarif.invalid) return;
    this.adminService.creerTarifAbonnement(this.formTarif.value as any).subscribe(() => {
      this.formTarif.reset({ nom: '', duree: 1, prix: 0, description: '' });
      this.charger();
    });
  }
}
