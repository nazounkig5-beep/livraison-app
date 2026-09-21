import { Component, OnDestroy, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { Langue, LangueService } from './core/services/langue.service';

const INTERVALLE_NOTIFICATIONS_MS = 30000;
const INTERVALLE_HORLOGE_MS = 30000;

const LIBELLES_ROLE: Record<string, string> = {
  ADMIN: 'commun.role.ADMIN',
  CLIENT: 'commun.role.CLIENT',
  LIVREUR: 'commun.role.LIVREUR',
  ENTREPRISE: 'commun.role.ENTREPRISE',
  EMPLOYE: 'commun.role.EMPLOYE',
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit, OnDestroy {
  notificationsNonLues = 0;
  menuMobileOuvert = false;
  titrePage = '';
  maintenant = new Date();
  private minuteur: ReturnType<typeof setInterval> | null = null;
  private minuteurHorloge: ReturnType<typeof setInterval> | null = null;

  constructor(
    public auth: AuthService,
    public langueService: LangueService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.titrePage = this.lireTitrePage();
    // Referme le tiroir de navigation mobile et met à jour le titre après chaque changement de page.
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.menuMobileOuvert = false;
      this.titrePage = this.lireTitrePage();
    });

    // La langue préférée du compte (connue seulement après connexion) prime sur le choix local.
    effect(() => this.langueService.initialiser(this.auth.utilisateur()?.langue));
  }

  /** Descend jusqu'à la route active la plus profonde pour lire sa clé de traduction `data.title`. */
  private lireTitrePage(): string {
    let route = this.route.snapshot;
    while (route.firstChild) route = route.firstChild;
    return route.data['title'] ?? '';
  }

  toggleMenuMobile(): void {
    this.menuMobileOuvert = !this.menuMobileOuvert;
  }

  fermerMenuMobile(): void {
    this.menuMobileOuvert = false;
  }

  get libelleRole(): string {
    return LIBELLES_ROLE[this.auth.utilisateur()?.role ?? ''] ?? '';
  }

  get initiales(): string {
    const nom = this.auth.utilisateur()?.nom ?? '';
    return nom
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((mot) => mot[0]?.toUpperCase())
      .join('');
  }

  changerLangue(langue: Langue): void {
    this.langueService.changer(langue);
    if (this.auth.estConnecte()) {
      this.auth.changerLangue(langue).subscribe();
    }
  }

  ngOnInit(): void {
    this.rafraichirNotifications();
    this.minuteur = setInterval(() => this.rafraichirNotifications(), INTERVALLE_NOTIFICATIONS_MS);
    this.minuteurHorloge = setInterval(() => (this.maintenant = new Date()), INTERVALLE_HORLOGE_MS);
  }

  ngOnDestroy(): void {
    if (this.minuteur) clearInterval(this.minuteur);
    if (this.minuteurHorloge) clearInterval(this.minuteurHorloge);
  }

  private rafraichirNotifications(): void {
    if (!this.auth.estConnecte()) return;
    this.notificationService.liste().subscribe({
      next: (data) => (this.notificationsNonLues = data.filter((n) => !n.lu).length),
      error: () => (this.notificationsNonLues = 0),
    });
  }

  deconnexion(): void {
    this.auth.logout();
  }
}
