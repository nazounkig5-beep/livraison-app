import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import * as QRCode from 'qrcode';
import { MissionService } from '../../../core/services/mission.service';
import { Mission } from '../../../core/models/demande.model';
import { genererCodeUssd, genererLienUssd, OperateurMobileMoney } from '../../../core/utils/paiement-mobile.util';

interface PositionConnue {
  latitude: number;
  longitude: number;
  horodatage: Date;
}

/**
 * Cas d'utilisation Livreur : "Consulter le détail d'une mission" + "Prendre en charge"
 * + "Mettre à jour ma position" (suivi GPS visible, plus seulement envoyé en silence)
 * + "Marquer livrée"
 */
@Component({
  selector: 'app-mission-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mission-detail.component.html',
})
export class MissionDetailComponent implements OnInit, OnDestroy {
  @ViewChild('carteConteneur') carteConteneur?: ElementRef<HTMLDivElement>;
  @ViewChild('qrCanvas') qrCanvas?: ElementRef<HTMLCanvasElement>;

  mission: Mission | null = null;
  chargement = true;

  operateurChoisi: OperateurMobileMoney | null = null;
  codeUssd = '';

  codeSaisi = '';
  erreurCode: string | null = null;

  suiviActif = false;
  erreurGps: string | null = null;
  dernierePosition: PositionConnue | null = null;
  distanceRestanteKm: number | null = null;

  private watchId: number | null = null;
  private carte: L.Map | null = null;
  private marqueur: L.Marker | null = null;
  private marqueurDestination: L.Marker | null = null;

  constructor(private route: ActivatedRoute, private missionService: MissionService) {}

  private get id(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.charger();
  }

  ngOnDestroy(): void {
    this.arreterSuiviGps();
    this.carte?.remove();
  }

  charger(): void {
    this.missionService.detail(this.id).subscribe((mission) => {
      this.mission = mission;
      this.chargement = false;
      if (mission.statut_prise_en_charge === 'EN_COURS') {
        this.demarrerSuiviGps();
      }
    });
  }

  prendreEnCharge(): void {
    if (!this.mission) return;
    const idMission = this.mission.id;

    const confirmer = (latitude?: number, longitude?: number) => {
      this.missionService.prendreEnCharge(idMission, latitude, longitude).subscribe(() => this.charger());
    };

    if (!navigator.geolocation) {
      confirmer();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => confirmer(pos.coords.latitude, pos.coords.longitude),
      () => confirmer(), // GPS refusé/indisponible : on prend quand même la mission en charge, sans position initiale.
      { timeout: 5000 }
    );
  }

  /** Suivi GPS en direct : envoie la position au serveur (pour le suivi du client) et l'affiche ici même. */
  private demarrerSuiviGps(): void {
    if (this.watchId !== null) return;

    if (!navigator.geolocation) {
      this.erreurGps = "La géolocalisation n'est pas disponible sur cet appareil.";
      return;
    }

    this.suiviActif = true;
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.erreurGps = null;
        this.dernierePosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          horodatage: new Date(),
        };
        this.missionService.mettreAJourPosition(this.id, pos.coords.latitude, pos.coords.longitude).subscribe();
        this.calculerDistanceRestante();
        setTimeout(() => this.mettreAJourCarte(), 0);
      },
      (err) => {
        this.erreurGps =
          err.code === err.PERMISSION_DENIED
            ? 'Autorisez la géolocalisation dans les paramètres de votre navigateur/appareil pour partager votre position avec le client.'
            : "Impossible d'obtenir votre position pour le moment. Nouvelle tentative automatique en cours…";
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  private arreterSuiviGps(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.suiviActif = false;
  }

  private mettreAJourCarte(): void {
    if (!this.carteConteneur || !this.dernierePosition) return;
    const { latitude, longitude } = this.dernierePosition;

    if (!this.carte) {
      this.carte = L.map(this.carteConteneur.nativeElement).setView([latitude, longitude], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(this.carte);

      const icone = L.divIcon({
        className: 'marqueur-livreur',
        html: '<span class="marqueur-livreur-point"></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      this.marqueur = L.marker([latitude, longitude], { icon: icone }).addTo(this.carte);

      // Position exacte du client (destination), placée une fois pour toutes lors de la création de la demande.
      const destination = this.mission?.demande;
      if (destination?.latitude_arrivee && destination?.longitude_arrivee) {
        const iconeDestination = L.divIcon({
          className: 'marqueur-destination',
          html: '<span class="marqueur-destination-point"></span>',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        this.marqueurDestination = L.marker([destination.latitude_arrivee, destination.longitude_arrivee], {
          icon: iconeDestination,
        }).addTo(this.carte);
        this.carte.fitBounds(
          L.latLngBounds([latitude, longitude], [destination.latitude_arrivee, destination.longitude_arrivee]),
          { padding: [40, 40] }
        );
      }
    } else {
      this.marqueur!.setLatLng([latitude, longitude]);
      this.carte.panTo([latitude, longitude]);
    }
  }

  /** Distance à vol d'oiseau (formule de Haversine) entre la position du livreur et celle du client. */
  private calculerDistanceRestante(): void {
    const destination = this.mission?.demande;
    if (!this.dernierePosition || !destination?.latitude_arrivee || !destination?.longitude_arrivee) return;

    const rayonTerreKm = 6371;
    const dLat = this.enRadians(destination.latitude_arrivee - this.dernierePosition.latitude);
    const dLon = this.enRadians(destination.longitude_arrivee - this.dernierePosition.longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.enRadians(this.dernierePosition.latitude)) *
        Math.cos(this.enRadians(destination.latitude_arrivee)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    this.distanceRestanteKm = rayonTerreKm * c;
  }

  private enRadians(degres: number): number {
    return (degres * Math.PI) / 180;
  }

  /** Affiche au client (via l'écran du livreur) le QR code de paiement mobile money de l'entreprise. */
  afficherQrPaiement(operateur: OperateurMobileMoney): void {
    const entreprise = this.mission?.demande?.entreprise;
    const numero = operateur === 'ORANGE' ? entreprise?.numero_orange : entreprise?.numero_moov;
    const montant = this.mission?.demande?.tarif_estime;
    if (!numero || !montant) return;

    this.operateurChoisi = operateur;
    this.codeUssd = genererCodeUssd(operateur, numero, montant);
    setTimeout(() => {
      if (this.qrCanvas) QRCode.toCanvas(this.qrCanvas.nativeElement, genererLienUssd(this.codeUssd), { width: 220 });
    }, 0);
  }

  fermerQrPaiement(): void {
    this.operateurChoisi = null;
    this.codeUssd = '';
  }

  confirmerLivraison(): void {
    if (!this.codeSaisi || !this.mission) return;
    this.erreurCode = null;
    const idMission = this.mission.id;

    this.missionService.verifierCode(idMission, this.codeSaisi).subscribe((res) => {
      if (res.valide) {
        this.missionService.livrer(idMission).subscribe(() => {
          this.arreterSuiviGps();
          this.charger();
        });
      } else {
        this.erreurCode = 'Code invalide.';
      }
    });
  }
}
