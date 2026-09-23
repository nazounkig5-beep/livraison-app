<?php

/**
 * Aucun fichier cors.php n'existait jusqu'ici : ça ne posait pas de problème tant que seule
 * l'appli Electron (localhost) appelait l'API. Une fois le frontend Angular hébergé sur un
 * domaine public différent de celui de l'API, le navigateur bloque les appels sans en-têtes CORS
 * explicites — ce fichier les active pour les routes /api/*.
 *
 * CORS_ALLOWED_ORIGINS (variable d'environnement) : liste de domaines séparés par des virgules
 * (ex. "https://mon-app.netlify.app,https://mon-app.vercel.app"). "*" par défaut pour ne rien
 * bloquer en développement local ; à restreindre en production une fois le domaine du frontend
 * connu.
 */
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', '*'))),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    // false : l'authentification se fait par jeton Bearer (Sanctum token), pas par cookie de
    // session — pas besoin de "credentials" cross-origin, et ça reste compatible avec
    // allowed_origins: ['*'] (les deux sont incompatibles si supports_credentials est true).
    'supports_credentials' => false,
];
