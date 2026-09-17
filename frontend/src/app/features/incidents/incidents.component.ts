import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IncidentService } from '../../core/services/incident.service';
import { AuthService } from '../../core/services/auth.service';
import { DemandeService } from '../../core/services/demande.service';
import { EntrepriseService } from '../../core/services/entreprise.service';
import { MissionService } from '../../core/services/mission.service';
import { Incident } from '../../core/models/incident.model';
import { DemandeLivraison } from '../../core/models/demande.model';

/** Cas d'utilisation : "Signaler incident" (tous rôles) + "Résoudre incident" (admin) */
@Component({
  selector: 'app-incidents',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './incidents.component.html',
})
export class IncidentsComponent implements OnInit {
  incidents: Incident[] = [];
  mesDemandes: DemandeLivraison[] = [];

  form = this.fb.group({
    id_demande: [null, Validators.required],
    description: ['', Validators.required],
  });

  constructor(
    private incidentService: IncidentService,
    public auth: AuthService,
    private fb: FormBuilder,
    private demandeService: DemandeService,
    private entrepriseService: EntrepriseService,
    private missionService: MissionService
  ) {}

  ngOnInit(): void {
    this.charger();
    this.chargerMesDemandes();
  }

  charger(): void {
    this.incidentService.liste().subscribe((data) => (this.incidents = data));
  }

  /** La liste des demandes proposables dépend du rôle : ce sont uniquement celles qui concernent l'utilisateur. */
  private chargerMesDemandes(): void {
    if (this.auth.aLeRole('CLIENT')) {
      this.demandeService.mesDemandes().subscribe((data) => (this.mesDemandes = data));
    } else if (this.auth.aLeRole('ENTREPRISE')) {
      this.entrepriseService.historique().subscribe((data) => (this.mesDemandes = data));
    } else if (this.auth.aLeRole('LIVREUR')) {
      this.missionService.mesMissions().subscribe((missions) => {
        this.mesDemandes = missions.filter((m) => m.demande).map((m) => m.demande!);
      });
    }
  }

  signaler(): void {
    if (this.form.invalid) return;
    const { id_demande, description } = this.form.value;
    this.incidentService.signaler(id_demande!, description!).subscribe(() => {
      this.form.reset();
      this.charger();
    });
  }

  resoudre(incident: Incident): void {
    this.incidentService.resoudre(incident.id).subscribe(() => this.charger());
  }
}
