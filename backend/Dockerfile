# Image de déploiement pour Render (ou tout hébergeur basé sur Docker).
# Utilise le serveur PHP intégré (php -S) plutôt que "php artisan serve" : ce dernier a un bug de
# crash connu dans ce projet (voir l'historique git — ServeCommand::getDateFromLine() plante sur
# certaines lignes de log et tue tout le processus). Même technique que le script main.js de
# l'appli desktop et que les tests manuels de ce projet.
FROM php:8.2-cli

RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev libzip-dev libpng-dev libjpeg-dev libfreetype6-dev unzip git \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_pgsql mbstring zip gd \
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
