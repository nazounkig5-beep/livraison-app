import { Component, OnInit } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { EntrepriseService } from '../../../core/services/entreprise.service';
import { EntrepriseDashboardStats } from '../../../core/models/dashboard.model';
import { DemandeLivraison } from '../../../core/models/demande.model';

/** Cas d'utilisation Entreprise : "Consulter dashboard" */
@Component({
  selector: 'app-entreprise-dashboard',
  standalone: true,
  imports: [CommonModule, KeyValuePipe, RouterLink, TranslateModule],
  templateUrl: './dashboard.component.html',
})
export class EntrepriseDashboardComponent implements OnInit {
  stats: EntrepriseDashboardStats | null = null;

  constructor(private entrepriseService: EntrepriseService) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.entrepriseService.dashboard().subscribe((data) => (this.stats = data));
  }

  accepter(demande: DemandeLivraison): void {
    this.entrepriseService.accepter(demande.id).subscribe(() => this.charger());
  }

  refuser(demande: DemandeLivraison): void {
    this.entrepriseService.refuser(demande.id).subscribe(() => this.charger());
  }
}
