import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbonnementService } from '../../core/services/abonnement.service';
import { ParametreService } from '../../core/services/parametre.service';
import { Abonnement } from '../../core/models/abonnement.model';
import { TarifAbonnement } from '../../core/models/parametre.model';

/** Cas d'utilisation Entreprise/Livreur : "Souscrire abonnement" + "Consulter mes abonnements" */
@Component({
  selector: 'app-abonnements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './abonnements.component.html',
})
export class AbonnementsComponent implements OnInit {
  mesAbonnements: Abonnement[] = [];
  tarifs: TarifAbonnement[] = [];
  erreur = '';
  tarifEnSouscription: number | null = null;

  constructor(private abonnementService: AbonnementService, private parametreService: ParametreService) {}

  ngOnInit(): void {
    this.charger();
    this.parametreService.tarifsAbonnement().subscribe((data) => (this.tarifs = data));
  }

  charger(): void {
    this.abonnementService.mesAbonnements().subscribe((data) => (this.mesAbonnements = data));
  }

  get abonnementActif(): Abonnement | undefined {
    return this.mesAbonnements.find((a) => a.statut === 'ACTIF');
  }

  choisir(tarif: TarifAbonnement): void {
    this.erreur = '';
    this.tarifEnSouscription = tarif.id;
  }

  annulerChoix(): void {
    this.tarifEnSouscription = null;
  }

  souscrire(tarif: TarifAbonnement, mode: 'EN_LIGNE' | 'CASH'): void {
    this.erreur = '';
    this.abonnementService.souscrire(tarif.id, mode).subscribe({
      next: () => {
        this.tarifEnSouscription = null;
        this.charger();
      },
      error: (err) => (this.erreur = err?.error?.message ?? 'Impossible de souscrire à cet abonnement.'),
    });
  }
}
