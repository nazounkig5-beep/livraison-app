import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import * as L from 'leaflet';
import { DemandeService } from '../../../core/services/demande.service';
import { ParametreService } from '../../../core/services/parametre.service';
import { TypeService } from '../../../core/models/parametre.model';
import { Entreprise } from '../../../core/models/entreprise.model';

const VUE_CARTE_PAR_DEFAUT: L.LatLngExpression = [5.3599, -4.0083]; // Abidjan, centre par défaut

/**
 * Cas d'utilisation Client : "Créer demande de livraison"
 * Reprend le flux MCT : choisir l'entreprise -> type de service -> adresses -> tarif calculé côté serveur
 * à partir de positions GPS réelles (plus de saisie manuelle de distance).
 * Pour "livraison", le départ est l'entreprise elle-même (rien à pointer) ; pour déménagement/transport
 * de matériel, le client place aussi son point de départ, en plus du point d'arrivée.
 */
@Component({
  selector: 'app-creer-demande',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './creer-demande.component.html',
})
export class CreerDemandeComponent implements OnInit, AfterViewInit {
  @ViewChild('carteConteneur') carteConteneur?: ElementRef<HTMLDivElement>;

  envoiEnCours = false;
  erreur = '';
  typesService: TypeService[] = [];
  entreprises: Entreprise[] = [];
  positionArriveeChoisie = false;
  positionDepartChoisie = false;
  pointActif: 'depart' | 'arrivee' = 'arrivee';
  recentrageEnCours = false;
  erreurRecentrage = '';

  private carte: L.Map | null = null;
  private marqueurArrivee: L.Marker | null = null;
  private marqueurDepart: L.Marker | null = null;

  form = this.fb.group({
    id_entreprise: [null as number | null, Validators.required],
    id_type_service: [null as number | null, Validators.required],
    adresse_depart: ['', Validators.required],
    adresse_arrivee: ['', Validators.required],
    latitude_depart: [null as number | null, Validators.required],
    longitude_depart: [null as number | null, Validators.required],
    latitude_arrivee: [null as number | null, Validators.required],
    longitude_arrivee: [null as number | null, Validators.required],
    date_programmee: [null as string | null],
  });

  constructor(
    private fb: FormBuilder,
    private demandeService: DemandeService,
    private parametreService: ParametreService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.form.get('id_type_service')!.valueChanges.subscribe(() => this.ajusterSelonTypeService());

    // Un <select> HTML sans option explicitement "selected" affiche visuellement le premier
    // élément non désactivé (ici, le premier type de service / la première entreprise chargée),
    // même si la valeur du formulaire Angular, elle, reste null tant que l'utilisateur n'a pas
    // cliqué dans le menu. Résultat : le formulaire semblait rempli à l'écran mais restait invalide
    // en interne — bloquant "Valider la demande" sans aucun message d'erreur visible. On fait donc
    // correspondre la valeur réelle du formulaire à ce qui est déjà affiché, dès le chargement.
    this.parametreService.typesService().subscribe((data) => {
      this.typesService = data;
      if (data.length && this.form.value.id_type_service === null) {
        this.form.patchValue({ id_type_service: data[0].id });
      }
    });
    this.parametreService.entreprisesActives().subscribe((data) => {
      this.entreprises = data;
      if (data.length && this.form.value.id_entreprise === null) {
        this.form.patchValue({ id_entreprise: data[0].id });
      }
    });
  }

  /**
   * Pour une simple "livraison", le point de départ est l'entreprise elle-même : les champs
   * adresse/position de départ sont masqués et non requis. Pour déménagement/transport de
   * matériel, le client doit préciser où récupérer les biens, puisque l'entreprise n'en est pas
   * le point de départ.
   */
  get typeServiceEstLivraison(): boolean {
    const id = this.form.value.id_type_service;
    return this.typesService.find((t) => t.id === id)?.nom === 'livraison';
  }

  private ajusterSelonTypeService(): void {
    const champAdresse = this.form.get('adresse_depart')!;
    const champLat = this.form.get('latitude_depart')!;
    const champLon = this.form.get('longitude_depart')!;

    if (this.typeServiceEstLivraison) {
      champAdresse.clearValidators();
      champAdresse.setValue('');
      champLat.clearValidators();
      champLon.clearValidators();
      champLat.setValue(null);
      champLon.setValue(null);
      this.positionDepartChoisie = false;
      this.pointActif = 'arrivee';
      this.marqueurDepart?.remove();
      this.marqueurDepart = null;
    } else {
      champAdresse.setValidators(Validators.required);
      champLat.setValidators(Validators.required);
      champLon.setValidators(Validators.required);
    }
    champAdresse.updateValueAndValidity();
    champLat.updateValueAndValidity();
    champLon.updateValueAndValidity();
  }

  choisirPointActif(point: 'depart' | 'arrivee'): void {
    this.pointActif = point;
  }

  /** @param silencieux ne pas afficher d'erreur si le client n'a pas encore réagi au clic (chargement initial). */
  recentrerSurMaPosition(silencieux = false): void {
    this.erreurRecentrage = '';
    if (!navigator.geolocation) {
      if (!silencieux) this.erreurRecentrage = 'client.creerDemande.erreurGeolocalisationIndisponible';
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
        if (!silencieux) this.erreurRecentrage = 'client.creerDemande.erreurGeolocalisationEchec';
      },
      { timeout: 8000 }
    );
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
    this.recentrerSurMaPosition(true);

    this.carte.on('click', (evenement: L.LeafletMouseEvent) => {
      if (this.pointActif === 'depart' && !this.typeServiceEstLivraison) {
        this.placerPoint(evenement.latlng, 'depart');
      } else {
        this.placerPoint(evenement.latlng, 'arrivee');
      }
    });

    // Le conteneur peut ne pas avoir sa taille finale au moment de l'initialisation (mise en page
    // encore en cours) : Leaflet resterait alors mal dimensionné tant qu'aucun redimensionnement
    // de fenêtre ne le corrige. On force une vérification une fois le rendu stabilisé.
    setTimeout(() => this.carte?.invalidateSize(), 200);
  }

  private placerPoint(latlng: L.LatLng, point: 'depart' | 'arrivee'): void {
    if (!this.carte) return;

    // Icône dessinée en CSS plutôt que l'icône Leaflet par défaut, dont les images ne se
    // chargent pas correctement dans ce build Angular (même piège déjà contourné ailleurs).
    // Bleu pour le départ, rouge pour l'arrivée — même convention que les cartes de suivi.
    const creerIcone = (classe: string) =>
      L.divIcon({ className: classe, html: `<span class="${classe}-point"></span>`, iconSize: [18, 18], iconAnchor: [9, 9] });

    if (point === 'depart') {
      if (!this.marqueurDepart) {
        this.marqueurDepart = L.marker(latlng, { icon: creerIcone('marqueur-livreur'), draggable: true }).addTo(this.carte);
        this.marqueurDepart.on('dragend', () => this.enregistrerPosition(this.marqueurDepart!.getLatLng(), 'depart'));
      } else {
        this.marqueurDepart.setLatLng(latlng);
      }
      this.enregistrerPosition(latlng, 'depart');
    } else {
      if (!this.marqueurArrivee) {
        this.marqueurArrivee = L.marker(latlng, { icon: creerIcone('marqueur-destination'), draggable: true }).addTo(this.carte);
        this.marqueurArrivee.on('dragend', () => this.enregistrerPosition(this.marqueurArrivee!.getLatLng(), 'arrivee'));
      } else {
        this.marqueurArrivee.setLatLng(latlng);
      }
      this.enregistrerPosition(latlng, 'arrivee');
    }
  }

  private enregistrerPosition(latlng: L.LatLng, point: 'depart' | 'arrivee'): void {
    if (point === 'depart') {
      this.positionDepartChoisie = true;
      this.form.patchValue({ latitude_depart: latlng.lat, longitude_depart: latlng.lng });
    } else {
      this.positionArriveeChoisie = true;
      this.form.patchValue({ latitude_arrivee: latlng.lat, longitude_arrivee: latlng.lng });
    }
  }

  /** Diagnostic affiché à l'écran quand le bouton est désactivé, pour voir immédiatement quel champ bloque. */
  get champsManquants(): string[] {
    const labels: Record<string, string> = {
      id_entreprise: 'Entreprise',
      id_type_service: 'Type de service',
      adresse_depart: 'Adresse de départ',
      adresse_arrivee: "Adresse d'arrivée",
      latitude_depart: 'Position de départ (carte)',
      longitude_depart: 'Position de départ (carte)',
      latitude_arrivee: "Position d'arrivée (carte)",
      longitude_arrivee: "Position d'arrivée (carte)",
    };
    const manquants: string[] = [];
    for (const nom of Object.keys(labels)) {
      const c = this.form.get(nom)!;
      if (c.invalid && labels[nom] && !manquants.includes(labels[nom])) manquants.push(labels[nom]);
    }
    return manquants;
  }

  /** Diagnostic temporaire pour trouver un bug precis : etat brut derriere le message ci-dessus. */
  get diagnosticBrut(): string {
    const idType = this.form.value.id_type_service;
    const type = this.typesService.find((t) => t.id === idType);
    return `id_type_service=${idType} (type trouve: ${type?.nom ?? 'AUCUN'}) | typeServiceEstLivraison=${this.typeServiceEstLivraison} | adresse_depart validators actifs=${!!this.form.get('adresse_depart')!.validator} | nb typesService charges=${this.typesService.length}`;
  }

  soumettre(): void {
    if (this.form.invalid) return;

    this.envoiEnCours = true;
    this.erreur = '';
    this.demandeService.creer(this.form.value as any).subscribe({
      next: (demande) => this.router.navigate(['/client/mes-demandes', demande.id]),
      error: (err) => {
        this.envoiEnCours = false;
        this.erreur = err?.error?.message ?? this.translate.instant('client.creerDemande.erreurCreationDefaut');
      },
    });
  }
}
