import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EntrepriseService } from '../../../core/services/entreprise.service';
import { DemandeLivraison } from '../../../core/models/demande.model';
import { Livreur } from '../../../core/models/livreur.model';
import { Vehicule } from '../../../core/models/vehicule.model';

/** Cas d'utilisation Entreprise : "Accepter / Refuser demande" + "Programmer la livraison" + "Assigner véhicule & livreur" */
@Component({
  selector: 'app-entreprise-demandes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './demandes.component.html',
})
export class DemandesComponent implements OnInit {
  demandes: DemandeLivraison[] = [];
  livreurs: Livreur[] = [];
  vehicules: Vehicule[] = [];
  demandeEnAssignation: number | null = null;
  demandeEnProgrammation: number | null = null;
  erreurProgrammation = '';

  formAssignation = this.fb.group({
    id_livreur: [null, Validators.required],
    id_vehicule: [null as number | null],
  });

  formProgrammation = this.fb.group({
    date_programmee: ['', Validators.required],
  });

  constructor(
    private entrepriseService: EntrepriseService,
    private fb: FormBuilder,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.charger();
    this.entrepriseService.livreurs().subscribe((data) => (this.livreurs = data));
    this.entrepriseService.vehicules().subscribe((data) => (this.vehicules = data));
  }

  charger(): void {
    this.entrepriseService.demandes().subscribe((data) => (this.demandes = data));
  }

  accepter(demande: DemandeLivraison): void {
    this.entrepriseService.accepter(demande.id).subscribe(() => this.charger());
  }

  refuser(demande: DemandeLivraison): void {
    this.entrepriseService.refuser(demande.id).subscribe(() => this.charger());
  }

  ouvrirProgrammation(demande: DemandeLivraison): void {
    this.erreurProgrammation = '';
    this.demandeEnProgrammation = demande.id;
    this.formProgrammation.reset({ date_programmee: demande.date_programmee ?? '' });
  }

  annulerProgrammation(): void {
    this.demandeEnProgrammation = null;
  }

  programmer(demande: DemandeLivraison): void {
    if (this.formProgrammation.invalid) return;

    this.erreurProgrammation = '';
    const { date_programmee } = this.formProgrammation.value;
    this.entrepriseService.programmer(demande.id, date_programmee!).subscribe({
      next: () => {
        this.demandeEnProgrammation = null;
        this.charger();
      },
      error: (err) =>
        (this.erreurProgrammation =
          err?.error?.message ?? this.translate.instant('entreprise.demandes.erreurProgrammationDefaut')),
    });
  }

  ouvrirAssignation(demande: DemandeLivraison): void {
    this.demandeEnAssignation = demande.id;
    this.formAssignation.reset();
  }

  annulerAssignation(): void {
    this.demandeEnAssignation = null;
  }

  assigner(demande: DemandeLivraison): void {
    if (this.formAssignation.invalid) return;

    const { id_livreur, id_vehicule } = this.formAssignation.value;
    this.entrepriseService.assigner(demande.id, id_livreur!, id_vehicule).subscribe(() => {
      this.demandeEnAssignation = null;
      this.charger();
    });
  }

  confirmerPaiement(demande: DemandeLivraison): void {
    this.entrepriseService.confirmerPaiement(demande.id).subscribe(() => this.charger());
  }
}
