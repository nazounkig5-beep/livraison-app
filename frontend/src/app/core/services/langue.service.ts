import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Langue = 'fr' | 'en';
const CLE_STOCKAGE = 'langue';
const LANGUES_DISPONIBLES: Langue[] = ['fr', 'en'];

/**
 * Langue préférée du client : priorité à la valeur enregistrée sur son compte (persistée côté
 * serveur, disponible dès la connexion), puis à un choix déjà fait sur cet appareil avant
 * connexion (localStorage), puis au français par défaut.
 */
@Injectable({ providedIn: 'root' })
export class LangueService {
  constructor(private translate: TranslateService) {
    this.translate.addLangs(LANGUES_DISPONIBLES);
    this.translate.setDefaultLang('fr');
  }

  initialiser(langueCompte?: string | null): void {
    const langue = this.normaliser(langueCompte ?? localStorage.getItem(CLE_STOCKAGE));
    this.translate.use(langue);
  }

  changer(langue: Langue): void {
    this.translate.use(langue);
    localStorage.setItem(CLE_STOCKAGE, langue);
  }

  get langueActuelle(): Langue {
    return this.normaliser(this.translate.currentLang);
  }

  private normaliser(valeur: string | null | undefined): Langue {
    return LANGUES_DISPONIBLES.includes(valeur as Langue) ? (valeur as Langue) : 'fr';
  }
}
