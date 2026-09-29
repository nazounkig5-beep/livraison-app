import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MissionService } from '../../../core/services/mission.service';
import { StatistiquesNotes } from '../../../core/models/notation.model';

/** Cas d'utilisation Livreur : "Consulter mes notes" (par livraison, moyenne, meilleure note par mois) */
@Component({
  selector: 'app-livreur-notes',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './notes.component.html',
})
export class LivreurNotesComponent implements OnInit {
  stats: StatistiquesNotes | null = null;

  constructor(private missionService: MissionService) {}

  ngOnInit(): void {
    this.missionService.mesNotes().subscribe((data) => (this.stats = data));
  }
}
