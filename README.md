# Système de Livraison — Architecture Laravel (API) + Angular (SPA)

Conçu à partir de : Diagramme de cas d'utilisation, MCD, MCT.

## 1. Acteurs et rôles (UTILISATEUR.role)
- **CLIENT** : crée des demandes, paie, note, suit sa livraison
- **LIVREUR** : consulte/accepte des missions, met à jour sa position GPS, marque livré
- **ENTREPRISE** : gère son parc véhicules/employés, accepte/programme les demandes qui lui sont adressées
- **ADMIN** : valide les entreprises, gère utilisateurs/abonnements/paramètres, supervise les incidents
- **EMPLOYE** : livreur salarié d'une entreprise (sous-type de LIVREUR.type)

## 2. Modèle de données (issu du MCD)
Table pivot d'héritage : `utilisateurs` (id, nom, email, mot_de_passe, role, statut_compte, date_creation)
puis tables filles à clé primaire = clé étrangère : `clients`, `livreurs`, `entreprises` (1,1 - 0,1 avec UTILISATEUR).

Entités métier : `type_vehicules`, `vehicules`, `type_services`, `demande_livraisons`, `missions`,
`suivi_livraisons`, `incidents`, `paiements`, `notations`, `tarif_abonnements`, `abonnements`.

Relations clés :
- CLIENT (1,1) — PASSER — (0,n) DEMANDE_LIVRAISON
- DEMANDE_LIVRAISON (0,1) — CONCERNER — (0,n) ENTREPRISE (entreprise ciblée, optionnelle = libre)
- DEMANDE_LIVRAISON (1,1) — CATEGORISER — (0,n) TYPE_SERVICE
- DEMANDE_LIVRAISON (1,1) — DECLENCHER — (0,1) MISSION
- MISSION (0,n) — REALISER — (1,1) LIVREUR ; MISSION (0,1) — UTILISER — VEHICULE
- MISSION (1,1) — GENERER — (0,n) SUIVI_LIVRAISON
- DEMANDE_LIVRAISON (1,1) — PAYER — (0,1) PAIEMENT
- DEMANDE_LIVRAISON (1,1) — NOTER — (0,1) NOTATION ; auteur = UTILISATEUR
- ENTREPRISE (1,1) — DISPOSER — (0,n) VEHICULE ; VEHICULE — AFFECTER — TYPE_VEHICULE
- ENTREPRISE / LIVREUR — SOUSCRIRE — ABONNEMENT — DEFINIR_TARIF — TARIF_ABONNEMENT
- DEMANDE_LIVRAISON (1,1) — DECLENCHER — (0,n) INCIDENT

## 3. Machine à états (issue du MCT, 19 opérations)
**DEMANDE_LIVRAISON.statut** :
`EN_ATTENTE → (Accepter) → ACCEPTEE|PROGRAMMEE → (Assigner véhicule & livreur) → EN_COURS → (Vérifier code) → LIVREE`
Branches : `Refuser → ANNULEE` à tout moment côté client/entreprise.

**MISSION.statut_prise_en_charge** : `EN_ATTENTE → EN_COURS → TERMINEE`
**LIVREUR (état logique, calculé)** : `DISPONIBLE ↔ OCCUPÉ` (dérivé de l'existence d'une mission EN_COURS)

Flux MCT résumé :
1. Client : Faire demande → choisir entreprise/libre → choisir type service/véhicule → calcul tarif/paiement → statut EN_ATTENTE
2. Entreprise (si ciblée) : Consulter demandes → Accepter/Programmer → Assigner véhicule & livreur → statut ACCEPTEE/PROGRAMMEE
3. Livreur : Consulter missions → Prendre en charge → statut OCCUPÉ / mission EN_COURS
4. Livreur : Mettre à jour GPS/Suivre → Vérifier code → Marquer livrée → statut LIVREE, livreur redevient DISPONIBLE
5. Admin (transverse) : Gérer entreprises, utilisateurs, abonnements & tarifs, paramètres (types), incidents/dashboard

## 4. Architecture technique
- **Backend** : Laravel 11, API REST stateless (Sanctum pour l'auth par token), MySQL.
  Structure MVC standard Laravel : `routes/api.php` → `Controllers/Api/*` → `Models/*` (Eloquent) → migrations.
  Un `CheckRole` middleware protège les routes par rôle (`role:admin`, `role:entreprise`, etc.).
- **Frontend** : Angular 18 (standalone-ready mais ici en NgModules classiques pour compat large),
  un module "feature" par rôle (`client`, `livreur`, `entreprise`, `admin`), un `core` (services HTTP,
  intercepteur JWT, guards de rôle), un `shared` (composants réutilisables : carte, badge de statut...).
  Communication via `HttpClient` + interfaces TypeScript miroir des ressources API.

## 5. Endpoints API principaux (routes/api.php)
```
POST   /api/register
POST   /api/login
POST   /api/logout
GET    /api/me

# Client
POST   /api/demandes                  (créer une demande)
GET    /api/demandes/mes-demandes
GET    /api/demandes/{id}
POST   /api/demandes/{id}/payer
POST   /api/demandes/{id}/noter
POST   /api/demandes/{id}/annuler

# Entreprise
GET    /api/entreprise/demandes
POST   /api/entreprise/demandes/{id}/accepter
POST   /api/entreprise/demandes/{id}/refuser
POST   /api/entreprise/demandes/{id}/assigner   {id_livreur, id_vehicule}
GET/POST/PUT/DELETE /api/entreprise/vehicules
GET/POST           /api/entreprise/employes

# Livreur
GET    /api/livreur/missions
POST   /api/livreur/missions/{id}/prendre-en-charge
POST   /api/livreur/missions/{id}/position       {latitude, longitude}
POST   /api/livreur/missions/{id}/verifier-code  {code}
POST   /api/livreur/missions/{id}/livrer

# Incidents
POST   /api/incidents
GET    /api/incidents

# Admin
GET/POST/PUT       /api/admin/entreprises/{id}/valider
GET/PUT/DELETE     /api/admin/utilisateurs
GET/POST/PUT       /api/admin/tarifs-abonnement
GET/POST/PUT       /api/admin/types-service
GET/POST/PUT       /api/admin/types-vehicule
GET                /api/admin/dashboard
```

## 6. Arborescence livrée
```
backend/
  database/migrations/*.php   (15 tables, dans l'ordre des dépendances FK)
  app/Models/*.php            (Eloquent + relations)
  app/Http/Controllers/Api/*.php
  app/Http/Middleware/CheckRole.php
  routes/api.php
frontend/
  src/app/core/...            (auth.service, guards, interceptor, interfaces)
  src/app/features/{auth,client,livreur,entreprise,admin}/...
  src/app/app-routing.module.ts
```

## 7. Ce qui est fourni vs. à compléter
Fourni, prêt à l'emploi : schéma BDD complet (migrations), tous les modèles + relations,
contrôleurs API pour les workflows critiques (auth, demandes, missions, incidents),
middleware de rôle, routes, et côté Angular : services HTTP + guards + interfaces TypeScript
+ un composant complet par rôle (à dupliquer pour les écrans restants).
À compléter (mécanique, guidée par les patterns fournis) : les autres composants d'écran
Angular (mêmes patterns que ceux livrés), les tests, le déploiement (.env, CORS, Sanctum SPA).
