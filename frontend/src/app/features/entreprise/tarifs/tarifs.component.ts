import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import * as L from 'leaflet';
import { AuthService } from '../../../core/services/auth.service';
import { EntrepriseService } from '../../../core/services/entreprise.service';
import { Entreprise } from '../../../core/models/entreprise.model';

const VUE_CARTE_PAR_DEFAUT: L.LatLngExpression = [5.3599, -4.0083]; // Abidjan, centre par défaut

/**
 * Cas d'utilisation Entreprise : "Configurer mes tarifs de livraison"
 * Le prix par km et les frais de base sont propres à chaque entreprise (remplacent le calcul
 * global figé) ; la position pointée sur la carte sert de point de départ automatique pour
 * les demandes de type "livraison" (le client n'a alors qu'à placer son point d'arrivée).
 */
@Component({
  selector: 'app-entreprise-tarifs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './tarifs.component.html',
})
export class TarifsComponent implements OnInit, AfterViewInit {
  @ViewChild('carteConteneur') carteConteneur?: ElementRef<HTMLDivElement>;

  entreprise: Entreprise | null = null;
  chargement = true;
  enregistrementReussi = false;
  positionChoisie = false;
  recentrageEnCours = false;
  erreurRecentrage = '';

  private carte: L.Map | null = null;
  private marqueur: L.Marker | null = null;

  form = this.fb.group({
    frais_base: [null as number | null, [Validators.required, Validators.min(0)]],
    prix_par_km: [null as number | null, [Validators.required, Validators.min(0)]],
    latitude: [null as number | null, Validators.required],
    longitude: [null as number | null, Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private entrepriseService: EntrepriseService
  ) {}

  ngOnInit(): void {
    this.auth.moi().subscribe((utilisateur) => {
      this.entreprise = utilisateur.entreprise ?? null;
      this.form.patchValue({
        frais_base: this.entreprise?.frais_base ?? 1000,
        prix_par_km: this.entreprise?.prix_par_km ?? 200,
        latitude: this.entreprise?.latitude ?? null,
        longitude: this.entreprise?.longitude ?? null,
      });
      this.positionChoisie = !!(this.entreprise?.latitude && this.entreprise?.longitude);
      this.chargement = false;
      setTimeout(() => this.initialiserCarte(), 0);
    });
  }

  ngAfterViewInit(): void {
    if (!this.chargement) setTimeout(() => this.initialiserCarte(), 0);
  }

  private initialiserCarte(): void {
    if (!this.carteConteneur || this.carte) return;

    const position = this.positionChoisie
      ? ([this.form.value.latitude!, this.form.value.longitude!] as L.LatLngExpression)
      : VUE_CARTE_PAR_DEFAUT;

    this.carte = L.map(this.carteConteneur.nativeElement).setView(position, this.positionChoisie ? 17 : 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.carte);

    if (this.positionChoisie) {
      this.placerMarqueur(L.latLng(this.form.value.latitude!, this.form.value.longitude!));
    }

    this.carte.on('click', (evenement: L.LeafletMouseEvent) => this.placerMarqueur(evenement.latlng));

    setTimeout(() => this.carte?.invalidateSize(), 200);
  }

  recentrerSurMaPosition(): void {
    this.erreurRecentrage = '';
    if (!navigator.geolocation) {
      this.erreurRecentrage = 'entreprise.tarifs.erreurGeolocalisationIndisponible';
      return;
    }

    this.recentrageEnCours = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.recentrageEnCours = false;
        this.carte?.setView([pos.coords.latitude, pos.coords.longitude], 17);
      },
      () => {
        this.recentrageEnCours = false;
        this.erreurRecentrage = 'entreprise.tarifs.erreurGeolocalisationEchec';
      },
      { timeout: 8000 }
    );
  }

  private placerMarqueur(latlng: L.LatLng): void {
    if (!this.carte) return;

    if (!this.marqueur) {
      const icone = L.divIcon({
        className: 'marqueur-destination',
        html: '<span class="marqueur-destination-point"></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      this.marqueur = L.marker(latlng, { icon: icone, draggable: true }).addTo(this.carte);
      this.marqueur.on('dragend', () => this.enregistrerPosition(this.marqueur!.getLatLng()));
    } else {
      this.marqueur.setLatLng(latlng);
    }

    this.enregistrerPosition(latlng);
  }

  private enregistrerPosition(latlng: L.LatLng): void {
    this.positionChoisie = true;
    this.form.patchValue({ latitude: latlng.lat, longitude: latlng.lng });
  }

  enregistrer(): void {
    if (this.form.invalid) return;

    this.enregistrementReussi = false;
    const { latitude, longitude, frais_base, prix_par_km } = this.form.value;
    this.entrepriseService
      .mettreAJourTarifs(latitude ?? null, longitude ?? null, frais_base ?? null, prix_par_km ?? null)
      .subscribe((entreprise) => {
      this.entreprise = entreprise;
      this.enregistrementReussi = true;
    });
  }
}
