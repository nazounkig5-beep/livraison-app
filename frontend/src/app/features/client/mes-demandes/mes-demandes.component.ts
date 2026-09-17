import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DemandeService } from '../../../core/services/demande.service';
import { DemandeLivraison, StatistiquesClient } from '../../../core/models/demande.model';

/** Cas d'utilisation Client : "Consulter mes demandes" + "Consulter mon tableau de bord" */
@Component({
  selector: 'app-mes-demandes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mes-demandes.component.html',
})
export class MesDemandesComponent implements OnInit {
  demandes: DemandeLivraison[] = [];
  stats: StatistiquesClient | null = null;

  constructor(private demandeService: DemandeService) {}

  ngOnInit(): void {
    this.charger();
    this.demandeService.mesStatistiques().subscribe((data) => (this.stats = data));
  }

  charger(): void {
    this.demandeService.mesDemandes().subscribe((data) => (this.demandes = data));
  }

  annuler(demande: DemandeLivraison): void {
    this.demandeService.annuler(demande.id).subscribe(() => this.charger());
  }
}
