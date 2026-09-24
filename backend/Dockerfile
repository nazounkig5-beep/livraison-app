# Image de déploiement pour Render (ou tout hébergeur basé sur Docker).
# Utilise le serveur PHP intégré (php -S) plutôt que "php artisan serve" : ce dernier a un bug de
# crash connu dans ce projet (voir l'historique git — ServeCommand::getDateFromLine() plante sur
# certaines lignes de log et tue tout le processus). Même technique que le script main.js de
# l'appli desktop et que les tests manuels de ce projet.
FROM php:8.2-cli

# Pas de "gd" : aucune manipulation d'image côté PHP dans ce projet (les QR codes sont générés
# côté navigateur via la lib JS "qrcode", pas côté serveur) — inutile d'installer freetype/jpeg
# et de configurer l'extension gd (source d'un échec de build lié à pkg-config sur cette image).
# libonig-dev : requis pour compiler mbstring (sinon "Package requirements (oniguruma) were not
# met"), autre dépendance système que docker-php-ext-install ne vérifie pas lui-même.
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev libzip-dev libonig-dev unzip git \
    && docker-php-ext-install pdo_pgsql mbstring zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction

EXPOSE 8000

# "Pre-Deploy Command" (qui aurait été l'endroit idéal pour lancer les migrations une seule fois
# par déploiement réel) est verrouillé sur le plan gratuit de Render. À la place : la migration est
# lancée en ARRIÈRE-PLAN (le "&" final) puis le serveur démarre immédiatement au premier plan, sans
# l'attendre. Ça évite le vrai problème rencontré (le conteneur mettait trop de temps à écouter le
# port après un réveil de mise en veille, tant qu'il attendait la fin de la migration — le proxy
# Render abandonnait alors avec un 504 sur toutes les requêtes en attente). Les migrations restent
# idempotentes (ne réappliquent pas ce qui est déjà en base), donc les relancer à chaque réveil ne
# fait rien d'utile la plupart du temps, mais ne coûte que quelques secondes en arrière-plan sans
# bloquer le service. Disque de travail réglé sur public/ pour le serveur : obligatoire pour ce
# routeur (getcwd() doit valoir public/, pas la racine du projet).
CMD ["sh", "-c", "(php artisan migrate --force || true) & cd public && php -S 0.0.0.0:${PORT:-8000} ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php"]
