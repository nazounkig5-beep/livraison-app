import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },

  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'auth/mot-de-passe-oublie',
    loadComponent: () =>
      import('./features/auth/mot-de-passe-oublie/mot-de-passe-oublie.component').then(
        (m) => m.MotDePasseOublieComponent
      ),
  },
  {
    path: 'auth/reinitialiser-mot-de-passe',
    loadComponent: () =>
      import('./features/auth/reinitialiser-mot-de-passe/reinitialiser-mot-de-passe.component').then(
        (m) => m.ReinitialiserMotDePasseComponent
      ),
  },

  // --- CLIENT ---
  {
    path: 'client/dashboard',
    canActivate: [authGuard, roleGuard(['CLIENT'])],
    data: { title: 'Tableau de bord' },
    loadComponent: () =>
      import('./features/client/dashboard/dashboard.component').then((m) => m.ClientDashboardComponent),
  },
  {
    path: 'client/creer-demande',
    canActivate: [authGuard, roleGuard(['CLIENT'])],
    data: { title: 'Nouvelle demande de livraison' },
    loadComponent: () =>
      import('./features/client/creer-demande/creer-demande.component').then((m) => m.CreerDemandeComponent),
  },
  {
    path: 'client/mes-demandes',
    canActivate: [authGuard, roleGuard(['CLIENT'])],
    data: { title: 'Mes demandes de livraison' },
    loadComponent: () =>
      import('./features/client/mes-demandes/mes-demandes.component').then((m) => m.MesDemandesComponent),
  },
  {
    path: 'client/mes-demandes/:id',
    canActivate: [authGuard, roleGuard(['CLIENT'])],
    data: { title: 'Détail de la demande' },
    loadComponent: () =>
      import('./features/client/mes-demandes/demande-detail.component').then((m) => m.DemandeDetailComponent),
  },

  // --- LIVREUR ---
  {
    path: 'livreur/missions',
    canActivate: [authGuard, roleGuard(['LIVREUR'])],
    data: { title: 'Mes missions' },
    loadComponent: () => import('./features/livreur/missions/missions.component').then((m) => m.MissionsComponent),
  },
  {
    path: 'livreur/missions/:id',
    canActivate: [authGuard, roleGuard(['LIVREUR'])],
    data: { title: 'Détail de la mission' },
    loadComponent: () =>
      import('./features/livreur/missions/mission-detail.component').then((m) => m.MissionDetailComponent),
  },
  {
    path: 'livreur/paiement',
    canActivate: [authGuard, roleGuard(['LIVREUR'])],
    data: { title: 'QR code de paiement' },
    loadComponent: () =>
      import('./features/livreur/paiement/paiement.component').then((m) => m.LivreurPaiementComponent),
  },

  // --- ENTREPRISE ---
  {
    path: 'entreprise/dashboard',
    canActivate: [authGuard, roleGuard(['ENTREPRISE'])],
    data: { title: 'Tableau de bord' },
    loadComponent: () =>
      import('./features/entreprise/dashboard/dashboard.component').then((m) => m.EntrepriseDashboardComponent),
  },
  {
    path: 'entreprise/demandes',
    canActivate: [authGuard, roleGuard(['ENTREPRISE'])],
    data: { title: 'Demandes reçues' },
    loadComponent: () =>
      import('./features/entreprise/demandes/demandes.component').then((m) => m.DemandesComponent),
  },
  {
    path: 'entreprise/vehicules',
    canActivate: [authGuard, roleGuard(['ENTREPRISE'])],
    data: { title: 'Mes véhicules' },
    loadComponent: () =>
      import('./features/entreprise/vehicules/vehicules.component').then((m) => m.VehiculesComponent),
  },
  {
    path: 'entreprise/employes',
    canActivate: [authGuard, roleGuard(['ENTREPRISE'])],
    data: { title: 'Mes livreurs employés' },
    loadComponent: () => import('./features/entreprise/employes/employes.component').then((m) => m.EmployesComponent),
  },
  {
    path: 'entreprise/historique',
    canActivate: [authGuard, roleGuard(['ENTREPRISE'])],
    data: { title: 'Historique des demandes' },
    loadComponent: () =>
      import('./features/entreprise/historique/historique.component').then((m) => m.HistoriqueComponent),
  },
  {
    path: 'entreprise/paiement',
    canActivate: [authGuard, roleGuard(['ENTREPRISE'])],
    data: { title: 'Numéros de paiement & QR Code' },
    loadComponent: () =>
      import('./features/entreprise/paiement/paiement.component').then((m) => m.PaiementComponent),
  },
  {
    path: 'entreprise/tarifs',
    canActivate: [authGuard, roleGuard(['ENTREPRISE'])],
    data: { title: 'Tarifs de livraison' },
    loadComponent: () => import('./features/entreprise/tarifs/tarifs.component').then((m) => m.TarifsComponent),
  },

  // --- ADMIN ---
  {
    path: 'admin/dashboard',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    data: { title: 'Administration' },
    loadComponent: () => import('./features/admin/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'admin/entreprises',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    data: { title: 'Entreprises' },
    loadComponent: () =>
      import('./features/admin/entreprises/entreprises.component').then((m) => m.EntreprisesComponent),
  },
  {
    path: 'admin/utilisateurs',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    data: { title: 'Utilisateurs' },
    loadComponent: () =>
      import('./features/admin/utilisateurs/utilisateurs.component').then((m) => m.UtilisateursComponent),
  },
  {
    path: 'admin/parametres',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    data: { title: 'Paramètres' },
    loadComponent: () =>
      import('./features/admin/parametres/parametres.component').then((m) => m.ParametresComponent),
  },
  {
    path: 'admin/abonnements',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    data: { title: 'Abonnements' },
    loadComponent: () =>
      import('./features/admin/abonnements/abonnements.component').then((m) => m.AdminAbonnementsComponent),
  },

  // --- Communes (tous rôles authentifiés) ---
  {
    path: 'compte',
    canActivate: [authGuard],
    data: { title: 'Mon compte' },
    loadComponent: () => import('./features/compte/compte.component').then((m) => m.CompteComponent),
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    data: { title: 'Notifications' },
    loadComponent: () =>
      import('./features/notifications/notifications.component').then((m) => m.NotificationsComponent),
  },
  {
    path: 'incidents',
    canActivate: [authGuard],
    data: { title: 'Incidents' },
    loadComponent: () => import('./features/incidents/incidents.component').then((m) => m.IncidentsComponent),
  },
  {
    path: 'abonnements',
    canActivate: [authGuard, roleGuard(['ENTREPRISE', 'LIVREUR'])],
    data: { title: 'Abonnements' },
    loadComponent: () =>
      import('./features/abonnements/abonnements.component').then((m) => m.AbonnementsComponent),
  },

  { path: '**', redirectTo: 'auth/login' },
];
