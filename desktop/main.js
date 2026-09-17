const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn, execFileSync } = require('child_process');

const BACKEND_PORT = 8000;
const FRONTEND_PORT = 4300;

let backendProcess = null;
let mainWindow = null;

// Empêche deux instances de se lancer en parallèle (double-clic, icône relancée alors que
// l'app tourne déjà en fond) : sans ça, la 2e instance plante sur les ports déjà occupés
// (EADDRINUSE) au lieu de simplement remettre au premier plan la fenêtre existante.
const verrouInstanceUnique = app.requestSingleInstanceLock();
if (!verrouInstanceUnique) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function resourcesRoot() {
  // En dev, resources/ n'existe pas encore : on remonte dans le repo. En version installée,
  // extraResources place backend/ et frontend/ à côté de l'exécutable (process.resourcesPath).
  return app.isPackaged ? process.resourcesPath : path.join(__dirname, '..');
}

function backendPath() {
  return path.join(resourcesRoot(), 'backend');
}

function composerPharPath() {
  return app.isPackaged ? path.join(resourcesRoot(), 'composer.phar') : path.join(__dirname, 'build', 'composer.phar');
}

function frontendPath() {
  return app.isPackaged
    ? path.join(resourcesRoot(), 'frontend')
    : path.join(resourcesRoot(), 'frontend', 'dist', 'livraison-app-frontend', 'browser');
}

/** Cherche un php.exe utilisable : d'abord le PATH système, sinon les installations WAMP courantes. */
function trouverPhp() {
  try {
    execFileSync('php', ['-v'], { stdio: 'ignore' });
    return 'php';
  } catch {
    // PHP absent du PATH : on retombe sur les emplacements WAMP habituels (voir guide d'installation).
  }

  // On vise la version la plus proche de 8.2 (celle testée par ce projet) : les versions
  // WAMP les plus récentes (8.4/8.5...) peuvent introduire des incompatibilités (constantes PDO
  // dépréciées, etc.) qui font planter Laravel/Sanctum sans que ce soit un vrai bug applicatif.
  const VERSION_CIBLE = { majeur: 8, mineur: 2 };
  const racinesWamp = ['C:\\wamp64\\bin\\php', 'C:\\wamp\\bin\\php'];
  for (const racine of racinesWamp) {
    if (!fs.existsSync(racine)) continue;

    const candidats = fs
      .readdirSync(racine)
      .filter((nom) => fs.existsSync(path.join(racine, nom, 'php.exe')))
      .map((nom) => {
        const match = nom.match(/php(\d+)\.(\d+)\.(\d+)/);
        return match
          ? { nom, majeur: Number(match[1]), mineur: Number(match[2]), patch: Number(match[3]) }
          : null;
      })
      .filter((v) => v && (v.majeur > VERSION_CIBLE.majeur || (v.majeur === VERSION_CIBLE.majeur && v.mineur >= VERSION_CIBLE.mineur)))
      .sort((a, b) => a.majeur - b.majeur || a.mineur - b.mineur || a.patch - b.patch); // la plus proche de la cible en premier

    if (candidats.length > 0) {
      return path.join(racine, candidats[0].nom, 'php.exe');
    }
  }

  return null;
}

function attendrePort(port, delaiMaxMs) {
  const debut = Date.now();
  return new Promise((resolve, reject) => {
    const essayer = () => {
      const requete = http.get({ host: '127.0.0.1', port, timeout: 1000 }, () => {
        requete.destroy();
        resolve();
      });
      requete.on('error', () => {
        if (Date.now() - debut > delaiMaxMs) {
          reject(new Error(`Le port ${port} ne répond pas après ${delaiMaxMs}ms`));
        } else {
          setTimeout(essayer, 300);
        }
      });
    };
    essayer();
  });
}

/**
 * À la première exécution après installation (détectée par l'absence de .env), on doit :
 * 1) régénérer l'autoloader Composer, car vendor/composer/autoload_*.php contient des chemins
 *    absolus figés au moment du `composer install` d'origine, invalides une fois le dossier
 *    copié dans le répertoire d'installation de l'utilisateur ;
 * 2) créer .env depuis .env.example et générer une APP_KEY propre à ce poste.
 * La configuration de la base de données (PostgreSQL) reste manuelle, voir GUIDE_INSTALLATION.md.
 */
function initialiserBackendSiNecessaire(php, cwd) {
  const envPath = path.join(cwd, '.env');
  if (fs.existsSync(envPath)) return;

  const envExamplePath = path.join(cwd, '.env.example');
  if (!fs.existsSync(envExamplePath)) return;

  try {
    execFileSync(php, [composerPharPath(), 'dump-autoload', '--optimize', '--no-interaction'], { cwd });
    fs.copyFileSync(envExamplePath, envPath);
    execFileSync(php, ['artisan', 'key:generate', '--force', '--ansi'], { cwd });
  } catch (err) {
    console.error('Initialisation du backend échouée :', err.message);
  }
}

function demarrerBackend() {
  const php = trouverPhp();
  if (!php) {
    dialog.showErrorBox(
      'PHP introuvable',
      "Impossible de trouver php.exe. Installez PHP 8.2+ (voir le GUIDE_INSTALLATION.md) et assurez-vous qu'il est dans le PATH, ou installé via WAMP."
    );
    app.quit();
    return null;
  }

  const cwd = backendPath();
  if (!fs.existsSync(path.join(cwd, 'artisan'))) {
    dialog.showErrorBox(
      'Backend introuvable',
      `Le dossier backend Laravel est introuvable ou incomplet (${cwd}). Réinstallez l'application ou consultez le guide d'installation.`
    );
    app.quit();
    return null;
  }

  initialiserBackendSiNecessaire(php, cwd);

  if (!fs.existsSync(path.join(cwd, '.env'))) {
    dialog.showErrorBox(
      'Configuration manquante',
      `backend\\.env est introuvable dans ${cwd}. Suivez la section « Première installation » du GUIDE_INSTALLATION.md avant de relancer l'application.`
    );
    app.quit();
    return null;
  }

  // `php -S` directement plutôt que `artisan serve` : ce dernier n'est qu'un habillage autour du
  // serveur intégré de PHP qui ajoute un joli log de requêtes dans la console — mais le parseur de
  // ce log (ServeCommand::getDateFromLine) peut planter sur une ligne inhabituelle et Laravel
  // remonte ça en erreur fatale, tuant tout le process backend (vu plusieurs fois en test : l'appli
  // reste ouverte mais toutes les pages deviennent vides puisque l'API ne répond plus). Le serveur
  // intégré brut ne fait tourner que la vraie logique HTTP, sans cet habillage fragile.
  // Le script routeur de Laravel (le même qu'utilise `artisan serve` en interne, cf. la trace de
  // crash) traduit les URLs façon .htaccess (routes sans extension -> index.php) pour le serveur
  // intégré de PHP, qui sinon ne servirait que des fichiers statiques existants tels quels.
  const routeur = path.join(cwd, 'vendor', 'laravel', 'framework', 'src', 'Illuminate', 'Foundation', 'resources', 'server.php');
  // Le script routeur résout son propre dossier via getcwd(), donc le process doit être lancé avec
  // public/ comme répertoire de travail (exactement ce que fait ServeCommand::serverCommand() en
  // interne) — pas de flag -t, sans quoi getcwd() renvoie encore la racine du backend.
  const proc = spawn(php, ['-S', `127.0.0.1:${BACKEND_PORT}`, routeur], { cwd: path.join(cwd, 'public'), windowsHide: true });
  proc.stdout.on('data', (d) => console.log(`[backend] ${d}`.trim()));
  proc.stderr.on('data', (d) => console.error(`[backend] ${d}`.trim()));
  proc.on('exit', (code) => console.log(`[backend] arrêté (code ${code})`));
  return proc;
}

/** Petit serveur statique maison (pas de dépendance externe) avec fallback SPA vers index.html. */
function demarrerServeurFrontend() {
  const racine = frontendPath();
  const typesMime = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.png': 'image/png',
  };

  const serveur = http.createServer((req, res) => {
    let chemin = decodeURIComponent(req.url.split('?')[0]);
    let cheminFichier = path.join(racine, chemin);

    if (!cheminFichier.startsWith(racine) || !fs.existsSync(cheminFichier) || fs.statSync(cheminFichier).isDirectory()) {
      cheminFichier = path.join(racine, 'index.html'); // fallback SPA (routes Angular)
    }

    fs.readFile(cheminFichier, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': typesMime[path.extname(cheminFichier)] ?? 'application/octet-stream' });
      res.end(data);
    });
  });

  return new Promise((resolve, reject) => {
    serveur.on('error', reject);
    serveur.listen(FRONTEND_PORT, '127.0.0.1', () => resolve(serveur));
  });
}

async function creerFenetre() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true },
  });

  await mainWindow.loadURL(`http://127.0.0.1:${FRONTEND_PORT}/`);
}

if (verrouInstanceUnique) {
  app.whenReady().then(async () => {
    backendProcess = demarrerBackend();
    if (!backendProcess) return;

    try {
      await attendrePort(BACKEND_PORT, 15000);
    } catch (err) {
      dialog.showErrorBox(
        'Backend indisponible',
        "Le serveur Laravel n'a pas démarré à temps. Vérifiez que PostgreSQL tourne bien (voir GUIDE_INSTALLATION.md) et relancez l'application."
      );
    }

    try {
      await demarrerServeurFrontend();
    } catch (err) {
      const message =
        err.code === 'EADDRINUSE'
          ? `Le port ${FRONTEND_PORT} est déjà utilisé par un autre programme. Fermez-le (Gestionnaire des tâches) puis relancez LivraisonApp.`
          : `Impossible de démarrer le serveur d'interface : ${err.message}`;
      dialog.showErrorBox('Démarrage impossible', message);
      app.quit();
      return;
    }

    await creerFenetre();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) creerFenetre();
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess && backendProcess.pid) {
    // `taskkill /T` pour tuer aussi les sous-processus que `artisan serve` peut engendrer sous Windows.
    try {
      execFileSync('taskkill', ['/pid', String(backendProcess.pid), '/T', '/F']);
    } catch {
      backendProcess.kill();
    }
  }
});
