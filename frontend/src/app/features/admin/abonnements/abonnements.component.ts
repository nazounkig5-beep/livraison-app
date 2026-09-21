import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../../../core/services/admin.service';
import { Abonnement } from '../../../core/models/abonnement.model';

/** Cas d'utilisation Admin : "Superviser les abonnements" */
@Component({
  selector: 'app-admin-abonnements',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './abonnements.component.html',
})
export class AdminAbonnementsComponent implements OnInit {
  abonnements: Abonnement[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.adminService.abonnements().subscribe((data) => (this.abonnements = data));
  }

  confirmerPaiement(abonnement: Abonnement): void {
    this.adminService.confirmerPaiementAbonnement(abonnement.id).subscribe(() => this.charger());
  }
}
