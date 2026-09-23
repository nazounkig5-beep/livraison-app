import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import * as L from 'leaflet';
import { EntrepriseService } from '../../../core/services/entreprise.service';
import { SuiviPosition } from '../../../core/models/demande.model';

const INTERVALLE_SUIVI_MS = 5000;

/**
 * Cas d'utilisation Entreprise : "Suivre une livraison en temps réel"
 * En cas de panne signalée par le livreur, l'entreprise voit ici la position exacte de l'arrêt
 * ainsi que la durée du dépannage (en direct tant que la panne dure, ou celle de la dernière
 * panne résolue) — pour pouvoir organiser une assistance en connaissant le lieu précis.
 */
@Component({
  selector: 'app-entreprise-suivi',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './suivi.component.html',
})
export class EntrepriseSuiviComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('carteConteneur') carteConteneur?: ElementRef<HTMLDivElement>;

  suivi: SuiviPosition | null = null;
  chargement = true;

  private minuteur: ReturnType<typeof setInterval> | null = null;
  private carte: L.Map | null = null;
  private marqueurLivreur: L.Marker | null = null;
  private marqueurPanne: L.Marker | null = null;
  private traceParcours: L.Polyline | null = null;
  private vueInitialisee = false;

  constructor(private route: ActivatedRoute, private entrepriseService: EntrepriseService) {}

  private get id(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.rafraichir();
    this.minuteur = setInterval(() => this.rafraichir(), INTERVALLE_SUIVI_MS);
  }

  ngAfterViewInit(): void {
    this.vueInitialisee = true;
    this.mettreAJourCarte();
  }

  ngOnDestroy(): void {
    if (this.minuteur) clearInterval(this.minuteur);
    this.carte?.remove();
  }

  private rafraichir(): void {
    this.entrepriseService.suivi(this.id).subscribe((data) => {
      this.suivi = data;
      this.chargement = false;
      this.mettreAJourCarte();
    });
  }

  private mettreAJourCarte(): void {
    if (!this.vueInitialisee || !this.suivi?.position || !this.carteConteneur) return;

    const { latitude, longitude } = this.suivi.position;

    if (!this.carte) {
      this.carte = L.map(this.carteConteneur.nativeElement).setView([latitude, longitude], 17);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(this.carte);

      const iconeLivreur = L.divIcon({
        className: 'marqueur-livreur',
        html: '<span class="marqueur-livreur-point"></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      this.marqueurLivreur = L.marker([latitude, longitude], { icon: iconeLivreur }).addTo(this.carte);
      this.traceParcours = L.polyline([], { color: '#2563eb', weight: 4, opacity: 0.7 }).addTo(this.carte);
      setTimeout(() => this.carte?.invalidateSize(), 200);
    } else {
      this.marqueurLivreur!.setLatLng([latitude, longitude]);
      this.carte.panTo([latitude, longitude]);
    }

    const points: L.LatLngExpression[] = this.suivi.trajet.map((p) => [p.latitude, p.longitude]);
    this.traceParcours!.setLatLngs(points);

    this.mettreAJourMarqueurPanne();
  }

  /** Marqueur distinct (orange) à l'emplacement exact où le livreur s'est arrêté en panne. */
  private mettreAJourMarqueurPanne(): void {
    if (!this.carte) return;
    const positionPanne = this.suivi?.position_panne;

    if (this.suivi?.en_panne && positionPanne) {
      if (!this.marqueurPanne) {
        const icone = L.divIcon({
          className: 'marqueur-panne',
          html: '<span class="marqueur-panne-point"></span>',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        this.marqueurPanne = L.marker([positionPanne.latitude, positionPanne.longitude], { icon: icone }).addTo(this.carte);
      } else {
        this.marqueurPanne.setLatLng([positionPanne.latitude, positionPanne.longitude]);
      }
    } else if (this.marqueurPanne) {
      this.marqueurPanne.remove();
      this.marqueurPanne = null;
    }
  }
}
