import { Component, OnInit } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardStats } from '../../../core/models/dashboard.model';

/** Cas d'utilisation Admin : "Consulter dashboard" */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, KeyValuePipe],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.stats().subscribe((data) => (this.stats = data));
  }
}
