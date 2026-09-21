import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DemandeService } from '../../../core/services/demande.service';
import { DemandeLivraison } from '../../../core/models/demande.model';

/** Cas d'utilisation Client : "Consulter mes demandes" */
@Component({
  selector: 'app-mes-demandes',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './mes-demandes.component.html',
})
export class MesDemandesComponent implements OnInit {
  demandes: DemandeLivraison[] = [];

  constructor(private demandeService: DemandeService) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.demandeService.mesDemandes().subscribe((data) => (this.demandes = data));
  }

  annuler(demande: DemandeLivraison): void {
    this.demandeService.annuler(demande.id).subscribe(() => this.charger());
  }
}
