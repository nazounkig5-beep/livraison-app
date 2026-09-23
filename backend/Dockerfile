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

# Migre la base (idempotent — ne réapplique pas les migrations déjà passées) puis démarre le
# serveur avec le disque de travail réglé sur public/ (obligatoire pour ce routeur, cf. commentaire
# ci-dessus : getcwd() doit valoir public/, pas la racine du projet).
CMD ["sh", "-c", "php artisan migrate --force && cd public && php -S 0.0.0.0:${PORT:-8000} ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php"]
