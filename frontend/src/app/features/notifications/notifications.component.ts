import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationApp } from '../../core/models/notification.model';

/** Cas d'utilisation : "Notifier le client" (et tout utilisateur) — consultation des notifications reçues */
@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
})
export class NotificationsComponent implements OnInit {
  notifications: NotificationApp[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.notificationService.liste().subscribe((data) => (this.notifications = data));
  }

  get nombreNonLues(): number {
    return this.notifications.filter((n) => !n.lu).length;
  }

  marquerLue(notification: NotificationApp): void {
    this.notificationService.marquerLue(notification.id).subscribe(() => this.charger());
  }

  toutMarquerLu(): void {
    this.notificationService.marquerToutesLues().subscribe(() => this.charger());
  }
}
