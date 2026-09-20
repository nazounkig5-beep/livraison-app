import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { DemandeService } from '../../../core/services/demande.service';
import { ParametreService } from '../../../core/services/parametre.service';
import { TypeService } from '../../../core/models/parametre.model';
import { Entreprise } from '../../../core/models/entreprise.model';

const VUE_CARTE_PAR_DEFAUT: L.LatLngExpression = [5.3599, -4.0083]; // Abidjan, centre par défaut

/**
 * Cas d'utilisation Client : "Créer demande de livraison"
 * Reprend le flux MCT : choisir l'entreprise -> type de service -> adresses -> tarif calculé côté serveur.
 * Le point de livraison (position exacte du client) est placé sur une carte, pour que le livreur
 * puisse ensuite s'y repérer précisément plutôt que sur la seule adresse texte.
 */
@Component({
  selector: 'app-creer-demande',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './creer-demande.component.html',
})
export class CreerDemandeComponent implements OnInit, AfterViewInit {
  @ViewChild('carteConteneur') carteConteneur?: ElementRef<HTMLDivElement>;

  envoiEnCours = false;
  erreur = '';
  typesService: TypeService[] = [];
  entreprises: Entreprise[] = [];
  positionArriveeChoisie = false;

  private carte: L.Map | null = null;
  private marqueurArrivee: L.Marker | null = null;

  form = this.fb.group({
    id_entreprise: [null, Validators.required],
    id_type_service: [null, Validators.required],
    adresse_depart: ['', Validators.required],
    adresse_arrivee: ['', Validators.required],
    latitude_arrivee: [null as number | null, Validators.required],
    longitude_arrivee: [null as number | null, Validators.required],
    distance: [null as number | null],
    date_programmee: [null as string | null],
  });

  constructor(
    private fb: FormBuilder,
    private demandeService: DemandeService,
    private parametreService: ParametreService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.parametreService.typesService().subscribe((data) => (this.typesService = data));
    this.parametreService.entreprisesActives().subscribe((data) => (this.entreprises = data));
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initialiserCarte(), 0);
  }

  private initialiserCarte(): void {
    if (!this.carteConteneur || this.carte) return;

    // Zoom rapproché par défaut : au niveau ville (13) les rues et lieux publics (écoles,
    // marchés...) déjà cartographiés dans OpenStreetMap ne sont pas visibles, ce qui rend le
    // pointage imprécis.
    this.carte = L.map(this.carteConteneur.nativeElement).setView(VUE_CARTE_PAR_DEFAUT, 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.carte);

    // Recentre sur la position actuelle du client si disponible, pour faciliter le pointage.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => this.carte?.setView([pos.coords.latitude, pos.coords.longitude], 17),
        () => {} // silencieux : la carte reste centrée sur la valeur par défaut
      );
    }

    this.carte.on('click', (evenement: L.LeafletMouseEvent) => this.placerPointArrivee(evenement.latlng));

    // Le conteneur peut ne pas avoir sa taille finale au moment de l'initialisation (mise en page
    // encore en cours) : Leaflet resterait alors mal dimensionné tant qu'aucun redimensionnement
    // de fenêtre ne le corrige. On force une vérification une fois le rendu stabilisé.
    setTimeout(() => this.carte?.invalidateSize(), 200);
  }

  private placerPointArrivee(latlng: L.LatLng): void {
    if (!this.carte) return;

    if (!this.marqueurArrivee) {
      // Icône dessinée en CSS plutôt que l'icône Leaflet par défaut, dont les images ne se
      // chargent pas correctement dans ce build Angular (même piège déjà contourné ailleurs).
      const icone = L.divIcon({
        className: 'marqueur-destination',
        html: '<span class="marqueur-destination-point"></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      this.marqueurArrivee = L.marker(latlng, { icon: icone, draggable: true }).addTo(this.carte);
      this.marqueurArrivee.on('dragend', () => {
        const position = this.marqueurArrivee!.getLatLng();
        this.enregistrerPosition(position);
      });
    } else {
      this.marqueurArrivee.setLatLng(latlng);
    }

    this.enregistrerPosition(latlng);
  }

  private enregistrerPosition(latlng: L.LatLng): void {
    this.positionArriveeChoisie = true;
    this.form.patchValue({ latitude_arrivee: latlng.lat, longitude_arrivee: latlng.lng });
  }

  soumettre(): void {
    if (this.form.invalid) return;

    this.envoiEnCours = true;
    this.erreur = '';
    this.demandeService.creer(this.form.value as any).subscribe({
      next: (demande) => this.router.navigate(['/client/mes-demandes', demande.id]),
      error: () => {
        this.envoiEnCours = false;
        this.erreur = "Impossible de créer la demande. Vérifiez les informations saisies.";
      },
    });
  }
}
