import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { DemandeService } from '../../../core/services/demande.service';
import { DemandeLivraison, SuiviPosition } from '../../../core/models/demande.model';

const INTERVALLE_SUIVI_MS = 5000;
const INTERVALLE_PAIEMENT_MS = 4000;

/** Cas d'utilisation Client : "Consulter demande", "Payer livraison", "Noter livreur", "Annuler demande", "Suivre en temps réel" */
@Component({
  selector: 'app-demande-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './demande-detail.component.html',
})
export class DemandeDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('carteConteneur') carteConteneur?: ElementRef<HTMLDivElement>;

  demande: DemandeLivraison | null = null;
  suivi: SuiviPosition | null = null;
  paiementEnLigneEnCours = false;
  erreurPaiement: string | null = null;
  private minuteurSuivi: ReturnType<typeof setInterval> | null = null;
  private minuteurPaiement: ReturnType<typeof setInterval> | null = null;
  private carte: L.Map | null = null;
  private marqueurLivreur: L.Marker | null = null;
  private traceParcours: L.Polyline | null = null;
  private vueInitialisee = false;

  formNote = this.fb.group({
    note: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    commentaire: [''],
  });

  constructor(
    private route: ActivatedRoute,
    private demandeService: DemandeService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.charger();
  }

  ngAfterViewInit(): void {
    this.vueInitialisee = true;
    this.mettreAJourCarte();
  }

  ngOnDestroy(): void {
    this.arreterSuivi();
    if (this.minuteurPaiement) clearInterval(this.minuteurPaiement);
    this.carte?.remove();
  }

  private get id(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  charger(): void {
    this.demandeService.detail(this.id).subscribe((data) => {
      this.demande = data;
      this.gererSuiviAutomatique();
      this.gererAttentePaiement();
    });
  }

  /** Tant que le webhook CinetPay n'a pas confirmé le paiement, on revérifie régulièrement le statut. */
  private gererAttentePaiement(): void {
    const enAttente = this.demande?.paiement?.mode === 'EN_LIGNE' && this.demande?.paiement?.statut === 'EN_ATTENTE';

    if (enAttente && !this.minuteurPaiement) {
      this.minuteurPaiement = setInterval(() => this.charger(), INTERVALLE_PAIEMENT_MS);
    } else if (!enAttente && this.minuteurPaiement) {
      clearInterval(this.minuteurPaiement);
      this.minuteurPaiement = null;
    }
  }

  /** Le suivi ne tourne que tant que la livraison est effectivement en cours. */
  private gererSuiviAutomatique(): void {
    if (this.demande?.statut === 'EN_COURS') {
      this.rafraichirSuivi();
      if (!this.minuteurSuivi) {
        this.minuteurSuivi = setInterval(() => this.rafraichirSuivi(), INTERVALLE_SUIVI_MS);
      }
    } else {
      this.arreterSuivi();
    }
  }

  private rafraichirSuivi(): void {
    this.demandeService.suivi(this.id).subscribe((data) => {
      this.suivi = data;
      this.mettreAJourCarte();
    });
  }

  private arreterSuivi(): void {
    if (this.minuteurSuivi) {
      clearInterval(this.minuteurSuivi);
      this.minuteurSuivi = null;
    }
  }

  /** Carte façon "Google Maps" : point du livreur en direct + trace du trajet parcouru. */
  private mettreAJourCarte(): void {
    if (!this.vueInitialisee || !this.suivi?.position || !this.carteConteneur) return;

    const { latitude, longitude } = this.suivi.position;

    if (!this.carte) {
      // Zoom rapproché (niveau rue) plutôt que le niveau ville par défaut de Leaflet, pour que
      // les rues et bâtiments réels apparaissent, pas juste une vue d'ensemble abstraite.
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
  }

  payer(mode: 'CASH'): void {
    this.demandeService.payer(this.id, mode).subscribe(() => this.charger());
  }

  /**
   * Redirige vers le checkout mobile money hébergé par CinetPay. Le paiement n'est jamais
   * confirmé depuis ce composant : seul le webhook serveur CinetPay confirme le statut réel.
   */
  payerEnLigne(): void {
    this.erreurPaiement = null;
    this.paiementEnLigneEnCours = true;
    this.demandeService.initierPaiementEnLigne(this.id).subscribe({
      next: ({ payment_url }) => (window.location.href = payment_url),
      error: () => {
        this.paiementEnLigneEnCours = false;
        this.erreurPaiement = "Impossible d'initier le paiement en ligne. Réessayez ou payez à la livraison.";
      },
    });
  }

  noter(): void {
    if (this.formNote.invalid) return;
    const { note, commentaire } = this.formNote.value;
    this.demandeService.noter(this.id, note!, commentaire ?? undefined).subscribe(() => this.charger());
  }

  annuler(): void {
    this.demandeService.annuler(this.id).subscribe(() => this.charger());
  }
}
