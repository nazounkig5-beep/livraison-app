import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as QRCode from 'qrcode';
import { MissionService } from '../../../core/services/mission.service';
import { Entreprise } from '../../../core/models/entreprise.model';

/** Cas d'utilisation Livreur : "Consulter le QR code de paiement de mon entreprise" (page à part, hors "Mes missions") */
@Component({
  selector: 'app-livreur-paiement',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paiement.component.html',
})
export class LivreurPaiementComponent implements OnInit {
  @ViewChild('qrCanvas') qrCanvas?: ElementRef<HTMLCanvasElement>;

  entreprise: Entreprise | null = null;
  chargement = true;

  constructor(private missionService: MissionService) {}

  ngOnInit(): void {
    // Un livreur indépendant (sans employeur) reçoit un 404 ici : traité comme "pas d'entreprise", pas une erreur.
    this.missionService.monEntreprise().subscribe({
      next: (entreprise) => {
        this.entreprise = entreprise;
        this.chargement = false;
        setTimeout(() => this.genererQrCode(), 0);
      },
      error: () => {
        this.entreprise = null;
        this.chargement = false;
      },
    });
  }

  private genererQrCode(): void {
    if (!this.qrCanvas || !this.entreprise?.qr_code) return;
    QRCode.toCanvas(this.qrCanvas.nativeElement, atob(this.entreprise.qr_code), {
      width: 220,
      color: { dark: '#1a3c5e', light: '#ffffff' },
    });
  }

  telechargerQr(): void {
    const canvas = this.qrCanvas?.nativeElement;
    if (!canvas) return;
    const lien = document.createElement('a');
    lien.href = canvas.toDataURL('image/png');
    lien.download = 'qrcode-paiement.png';
    lien.click();
  }

  imprimerQr(): void {
    const canvas = this.qrCanvas?.nativeElement;
    if (!canvas) return;
    const fenetre = window.open('');
    if (!fenetre) return;
    const nom = this.entreprise?.nom ?? '';
    fenetre.document.write(
      `<html><body style="text-align:center;padding:40px;"><h2>${nom}</h2><p>Scannez pour payer</p><img src="${canvas.toDataURL()}" style="width:250px;"/></body></html>`
    );
    fenetre.print();
  }
}
