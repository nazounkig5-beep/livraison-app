import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { EntrepriseService } from '../../../core/services/entreprise.service';
import { StatistiquesNotesLivreur } from '../../../core/models/notation.model';

/**
 * Cas d'utilisation Entreprise : "Consulter les notes de mes livreurs"
 * Une carte par livreur ayant traité au moins une demande de cette entreprise, avec le détail par
 * livraison, la moyenne générale et la moyenne/meilleure note par mois.
 */
@Component({
  selector: 'app-entreprise-notes',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './notes.component.html',
})
export class EntrepriseNotesComponent implements OnInit {
  statsParLivreur: StatistiquesNotesLivreur[] = [];
  chargement = true;
  livreurDeplie: number | null = null;

  constructor(private entrepriseService: EntrepriseService) {}

  ngOnInit(): void {
    this.entrepriseService.notesLivreurs().subscribe((data) => {
      this.statsParLivreur = data;
      this.chargement = false;
    });
  }

  basculerDetail(idLivreur: number): void {
    this.livreurDeplie = this.livreurDeplie === idLivreur ? null : idLivreur;
  }
}
