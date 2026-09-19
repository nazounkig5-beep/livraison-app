import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DemandeService } from '../../../core/services/demande.service';
import { StatistiquesClient } from '../../../core/models/demande.model';

/** Cas d'utilisation Client : "Consulter mon tableau de bord" */
@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class ClientDashboardComponent implements OnInit {
  stats: StatistiquesClient | null = null;

  constructor(private demandeService: DemandeService) {}

  ngOnInit(): void {
    this.demandeService.mesStatistiques().subscribe((data) => (this.stats = data));
  }

  compteParStatut(statut: string): number {
    return this.stats?.demandes_par_statut?.[statut] ?? 0;
  }
}
