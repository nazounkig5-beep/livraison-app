import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../../../core/services/admin.service';
import { Entreprise } from '../../../core/models/entreprise.model';

/** Cas d'utilisation Admin : "Valider dossier entreprise" / "Gérer entreprises" */
@Component({
  selector: 'app-admin-entreprises',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './entreprises.component.html',
})
export class EntreprisesComponent implements OnInit {
  entreprises: Entreprise[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.adminService.entreprises().subscribe((data) => (this.entreprises = data));
  }

  valider(entreprise: Entreprise, statut: 'ACTIVE' | 'REJETEE'): void {
    this.adminService.validerEntreprise(entreprise.id, statut).subscribe(() => this.charger());
  }
}
