import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MissionService } from '../../../core/services/mission.service';
import { Mission } from '../../../core/models/demande.model';

/** Cas d'utilisation Livreur : "Consulter missions" */
@Component({
  selector: 'app-missions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './missions.component.html',
})
export class MissionsComponent implements OnInit {
  missions: Mission[] = [];

  constructor(private missionService: MissionService) {}

  ngOnInit(): void {
    this.missionService.mesMissions().subscribe((data) => (this.missions = data));
  }
}
