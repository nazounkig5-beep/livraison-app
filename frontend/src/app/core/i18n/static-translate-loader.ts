import { TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { FR } from './fr';
import { EN } from './en';

/**
 * Traductions embarquées directement dans le bundle (pas de fichier JSON chargé en HTTP) : plus
 * simple et fiable dans tous les contextes (dev, build, application de bureau Electron) puisqu'il
 * n'y a aucun chemin d'accès réseau/asset à faire fonctionner.
 */
export class StaticTranslateLoader extends TranslateLoader {
  override getTranslation(langue: string): Observable<Record<string, unknown>> {
    return of(langue === 'en' ? EN : FR);
  }
}
