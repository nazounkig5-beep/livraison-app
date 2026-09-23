import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { StaticTranslateLoader } from './core/i18n/static-translate-loader';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTranslateService({
      loader: { provide: TranslateLoader, useClass: StaticTranslateLoader },
      defaultLanguage: 'fr',
    }),
    // Le service worker n'a de sens que pour le build "web" (PWA hébergée) : sous Electron, le
    // frontend est chargé via file:// (pas un contexte sécurisé), où l'enregistrement échouerait
    // de toute façon silencieusement — cette garde évite juste la tentative et l'avertissement
    // console qui l'accompagnerait dans les outils de développement Electron.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode() && typeof window !== 'undefined' && window.location.protocol.startsWith('http'),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
