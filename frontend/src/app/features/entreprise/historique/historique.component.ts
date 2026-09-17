import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntrepriseService } from '../../../core/services/entreprise.service';
import { DemandeLivraison } from '../../../core/models/demande.model';

/** Cas d'utilisation Entreprise : "Consulter historique" (toutes les demandes, tous statuts) */
@Component({
  selector: 'app-entreprise-historique',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historique.component.html',
})
export class HistoriqueComponent implements OnInit {
  demandes: DemandeLivraison[] = [];

  constructor(private entrepriseService: EntrepriseService) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.entrepriseService.historique().subscribe((data) => (this.demandes = data));
  }

  confirmerPaiement(demande: DemandeLivraison): void {
    this.entrepriseService.confirmerPaiement(demande.id).subscribe(() => this.charger());
  }
}
