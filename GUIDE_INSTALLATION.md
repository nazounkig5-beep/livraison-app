# Guide d'installation — LivraisonApp

## Architecture du projet

```
livraison-app/
├── backend/    API Laravel 11 (PHP + PostgreSQL, auth par token Sanctum)
├── frontend/   SPA Angular 18 (consomme l'API du backend)
└── desktop/    Application de bureau Electron (encapsule le frontend et pilote le backend)
```

Le backend et le frontend fonctionnent aussi de façon totalement indépendante (mode web classique).
`desktop/` ajoute une couche par-dessus pour obtenir une vraie application Windows avec icône Bureau.

---

## Prérequis

Pour **développer ou construire l'installateur** :

| Outil | Version | Rôle |
|---|---|---|
| PHP | 8.2 ou supérieur (avec `pdo_pgsql`, `pgsql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`) | Backend Laravel |
| Composer | 2.x | Dépendances PHP |
| Node.js | 18+ (avec npm) | Frontend Angular + application Electron |
| PostgreSQL | 14 ou supérieur, service démarré | Base de données |

Sur Windows, WAMP fournit PHP (`C:\wamp64\bin\php\phpX.Y.Z\php.exe`) — pensez à ajouter le
dossier de la version voulue au PATH, ou utilisez le chemin complet dans les commandes ci-dessous.

Pour **installer l'application déjà construite** sur un poste utilisateur, seuls **PHP** et
**PostgreSQL** sont nécessaires sur ce poste (Composer/Node ne servent qu'à la construction).

---

## 1. Backend (Laravel)

```powershell
cd backend
composer install
copy .env.example .env
```

Éditez `backend\.env` et renseignez votre connexion PostgreSQL :

```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=livraison_app
DB_USERNAME=postgres
DB_PASSWORD=votre_mot_de_passe
```

Créez la base (via pgAdmin, ou en ligne de commande) :

```sql
CREATE DATABASE livraison_app;
```

Puis initialisez l'application :

```powershell
php artisan key:generate
php artisan vendor:publish --tag=sanctum-migrations
php artisan migrate
php artisan db:seed
```

`db:seed` crée le compte administrateur initial (voir section 8) — c'est le **seul** moyen d'obtenir
un compte ADMIN, l'inscription publique ne le permet pas.

Lancez le serveur :

```powershell
php artisan serve
```

L'API est disponible sur `http://127.0.0.1:8000/api`.

---

## 2. Frontend (Angular) — mode développement web classique

```powershell
cd frontend
npm install
ng serve
```

Ouvrez `http://localhost:4200`. Vérifiez que `src/environments/environment.ts` pointe bien vers
`http://localhost:8000/api` (valeur par défaut).

---

## 3. Application de bureau (Electron) — lancer en développement

L'appli Electron charge la **version compilée** du frontend (pas `ng serve`) :

```powershell
cd frontend
npm run build          # génère frontend/dist/livraison-app-frontend/browser

cd ..\desktop
npm install
npm start               # lance Electron : démarre le backend PHP + affiche l'interface
```

À chaque modification du code Angular, relancez `npm run build` dans `frontend/` avant de relancer
`npm start` dans `desktop/` (Electron sert toujours le dernier build présent sur disque).

---

## 4. Construire le paquet de l'application (icône Bureau)

Une fois `frontend/dist/...` et `backend/vendor/` présents :

```powershell
cd desktop
npm run dist
```

Génère `desktop/release/` contenant :
- `win-unpacked/` — l'application complète (frontend compilé **et** backend Laravel avec `vendor/`)
- `Installer.bat` / `Installer.ps1` — installe l'application pour l'utilisateur courant et crée
  les raccourcis Bureau + menu Démarrer avec icône (aucun droit administrateur requis)

C'est le mode recommandé : il fonctionne sur tous les postes, y compris ceux sans droits
administrateur ni « mode développeur » Windows activé.

> **Variante NSIS (optionnelle)** : `npm run dist:nsis` produit un installeur classique
> `LivraisonApp Setup <version>.exe` en un seul fichier. Cela nécessite que le poste de
> *construction* (pas le poste cible) ait soit les droits administrateur, soit le mode
> développeur Windows activé (Paramètres → Confidentialité et sécurité → Pour les développeurs) —
> l'outil de packaging a besoin de créer des liens symboliques temporaires. Si `npm run dist:nsis`
> échoue avec des erreurs de type « privilège nécessaire » lors de l'extraction de `winCodeSign`,
> utilisez `npm run dist` (méthode `Installer.bat`) à la place.

---

## 5. Installer l'application sur un poste

1. Copiez tout le dossier `desktop/release/` (au minimum `win-unpacked/`, `Installer.bat` et
   `Installer.ps1`) sur le poste cible.
2. Double-cliquez sur **`Installer.bat`**. Le script copie l'application dans
   `%LOCALAPPDATA%\Programs\LivraisonApp\` et crée les raccourcis.
3. Un raccourci **LivraisonApp** apparaît sur le Bureau et dans le menu Démarrer, avec l'icône
   de l'application.
4. Assurez-vous que **PHP 8.2+** et **PostgreSQL** sont installés et accessibles sur ce poste
   (PHP dans le PATH, ou une installation WAMP standard — l'application sait la détecter).

---

## 6. Première installation sur un nouveau poste (à faire une seule fois)

Après l'installation, ouvrez le dossier d'installation (clic droit sur le raccourci Bureau →
« Ouvrir l'emplacement du fichier », généralement
`%LOCALAPPDATA%\Programs\LivraisonApp\resources\`) :

1. Copiez `backend\.env.example` vers `backend\.env`.
2. Éditez `backend\.env` avec les identifiants PostgreSQL **de ce poste**.
3. Créez la base PostgreSQL (`CREATE DATABASE livraison_app;`).
4. Double-cliquez sur **`premiere-installation.bat`** (à la racine du dossier `resources`) :
   il régénère l'autoloader Composer pour ce poste, génère une clé d'application, exécute les
   migrations et crée le compte admin initial.
5. Lancez LivraisonApp depuis l'icône du Bureau.

Cette étape n'est à refaire que si vous réinstallez l'application sur un **autre poste** ou
repartez d'une base vide.

---

## 7. Utilisation au quotidien

Double-clic sur l'icône Bureau **LivraisonApp**. L'application démarre automatiquement le
serveur Laravel (port 8000) en arrière-plan et affiche l'interface. Fermer la fenêtre arrête
aussi le serveur backend proprement.

---

## 8. Identifiants par défaut

| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | `admin@livraison-app.local` | `admin123` |

Changez ce mot de passe dès la première connexion via **Mon compte**. Les comptes CLIENT,
LIVREUR et ENTREPRISE se créent depuis la page d'inscription publique.

---

## 9. Dépannage

| Symptôme | Cause probable / solution |
|---|---|
| « PHP introuvable » au lancement | PHP n'est ni dans le PATH ni détecté sous `C:\wamp64\bin\php\...`. Installez PHP/WAMP ou ajoutez `php.exe` au PATH. |
| « Backend indisponible » au lancement | PostgreSQL n'est probablement pas démarré. Démarrez le service (`services.msc` → `postgresql-x64-XX`), ou `pg_ctl -D "<data_dir>" start` si vous n'avez pas les droits administrateur pour gérer le service. |
| « Configuration manquante » (`.env` introuvable) | Suivez la section 6 (première installation sur ce poste). |
| Erreur `ECONNRESET` pendant `npm install` / `composer install` | Coupure réseau transitoire, fréquente sur certains réseaux. Relancez simplement la commande — le cache local conserve ce qui a déjà été téléchargé. |
| `npm run dist:nsis` échoue sur `winCodeSign` (« privilège nécessaire », liens symboliques) | Le poste de construction n'a ni droits administrateur ni mode développeur Windows activé. Utilisez `npm run dist` (méthode `Installer.bat`) à la place — voir section 4. |
| Désinstaller l'application | Supprimez `%LOCALAPPDATA%\Programs\LivraisonApp\`, puis les raccourcis `LivraisonApp.lnk` sur le Bureau et dans le menu Démarrer. |
| Port 8000 déjà utilisé | Un autre `php artisan serve` tourne déjà. Fermez-le via le Gestionnaire des tâches avant de relancer LivraisonApp. |
| Les modifications de code n'apparaissent pas dans l'appli de bureau | Il faut reconstruire : `npm run build` dans `frontend/`, puis relancer l'appli (`npm start` en dev, ou refaire `npm run dist` pour un nouvel installeur). |

---

## 10. Notes techniques

- L'application Electron (`desktop/main.js`) ne contient **aucune logique métier** : elle
  démarre `php artisan serve` en sous-processus, sert le build Angular via un petit serveur HTTP
  interne (port 4300, avec repli vers `index.html` pour les routes Angular), puis affiche le tout
  dans une fenêtre.
- Le dossier `backend/` (avec `vendor/`) est copié tel quel dans l'installeur : le poste cible n'a
  besoin que de **PHP**, pas de Composer.
- `vendor/composer/autoload_*.php` contient des chemins absolus figés au moment du `composer
  install` d'origine — invalides une fois copiés ailleurs. `premiere-installation.bat` les
  régénère via un `composer.phar` embarqué (`php composer.phar dump-autoload`), et l'application
  le refait aussi automatiquement à la toute première exécution après installation.
- La base de données (PostgreSQL) n'est jamais gérée automatiquement par l'application : sa
  création et sa configuration restent une étape manuelle explicite (section 6), par prudence.
