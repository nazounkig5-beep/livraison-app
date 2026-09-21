import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import * as QRCode from 'qrcode';
import { AuthService } from '../../../core/services/auth.service';
import { EntrepriseService } from '../../../core/services/entreprise.service';
import { Entreprise } from '../../../core/models/entreprise.model';
import { genererApercuUssd } from '../../../core/utils/paiement-mobile.util';

/** Cas d'utilisation Entreprise : "Configurer mes numéros de paiement mobile money" */
@Component({
  selector: 'app-entreprise-paiement',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './paiement.component.html',
})
export class PaiementComponent implements OnInit {
  @ViewChild('qrCanvas') qrCanvas?: ElementRef<HTMLCanvasElement>;

  entreprise: Entreprise | null = null;
  enregistrementReussi = false;
  chargement = true;
  envoiMessage: string | null = null;
  envoiErreur: string | null = null;
  envoiEnCours = false;

  form = this.fb.group({
    numero_orange: [''],
    numero_moov: [''],
    cinetpay_site_id: [''],
    cinetpay_api_key: [''],
  });

  constructor(
    private auth: AuthService,
    private entrepriseService: EntrepriseService,
    private fb: FormBuilder,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.auth.moi().subscribe((utilisateur) => {
      this.entreprise = utilisateur.entreprise ?? null;
      this.form.patchValue({
        numero_orange: this.entreprise?.numero_orange ?? '',
        numero_moov: this.entreprise?.numero_moov ?? '',
      });
      this.chargement = false;
      setTimeout(() => this.genererQrCode(), 0);
    });
  }

  /** Aperçu du code USSD affiché sous chaque champ dès qu'un numéro est saisi (montant réel inconnu à ce stade). */
  apercuUssd(operateur: 'ORANGE' | 'MOOV'): string | null {
    const numero = operateur === 'ORANGE' ? this.form.value.numero_orange : this.form.value.numero_moov;
    return numero ? genererApercuUssd(operateur, numero) : null;
  }

  enregistrer(): void {
    this.enregistrementReussi = false;
    const { numero_orange, numero_moov, cinetpay_site_id, cinetpay_api_key } = this.form.value;
    this.entrepriseService
      .mettreAJourPaiement(numero_orange || null, numero_moov || null, cinetpay_site_id || null, cinetpay_api_key || null)
      .subscribe((entreprise) => {
        this.entreprise = entreprise;
        this.enregistrementReussi = true;
        // La clé API n'est jamais renvoyée par l'API : on vide le champ après enregistrement pour éviter toute confusion.
        this.form.patchValue({ cinetpay_site_id: '', cinetpay_api_key: '' });
        setTimeout(() => this.genererQrCode(), 0);
      });
  }

  envoyerAuxLivreurs(): void {
    this.envoiMessage = null;
    this.envoiErreur = null;
    this.envoiEnCours = true;
    this.entrepriseService.envoyerQrLivreurs().subscribe({
      next: (res) => {
        this.envoiEnCours = false;
        this.envoiMessage = this.translate.instant('entreprise.paiement.envoiSucces', { nombre: res.nombre_livreurs });
      },
      error: (err) => {
        this.envoiEnCours = false;
        this.envoiErreur = err.error?.message ?? this.translate.instant('entreprise.paiement.envoiErreurDefaut');
      },
    });
  }

  private genererQrCode(): void {
    if (!this.qrCanvas || !this.entreprise?.qr_code) return;
    const contenu = atob(this.entreprise.qr_code);
    QRCode.toCanvas(this.qrCanvas.nativeElement, contenu, {
      width: 180,
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
