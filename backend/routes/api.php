<?php

use App\Http\Controllers\Api\AbonnementController;
use App\Http\Controllers\Api\AdminAbonnementController;
use App\Http\Controllers\Api\AdminEntrepriseController;
use App\Http\Controllers\Api\AdminParametreController;
use App\Http\Controllers\Api\AdminUtilisateurController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DemandeLivraisonController;
use App\Http\Controllers\Api\EmployeController;
use App\Http\Controllers\Api\EntrepriseDashboardController;
use App\Http\Controllers\Api\EntrepriseDemandeController;
use App\Http\Controllers\Api\EntrepriseProfilController;
use App\Http\Controllers\Api\IncidentController;
use App\Http\Controllers\Api\LivreurProfilController;
use App\Http\Controllers\Api\MissionController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PaiementWebhookController;
use App\Http\Controllers\Api\PhotoController;
use App\Http\Controllers\Api\VehiculeController;
use Illuminate\Support\Facades\Route;

// --- Public ---
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/mot-de-passe-oublie', [AuthController::class, 'envoyerLienReinitialisation']);
Route::post('/reinitialiser-mot-de-passe', [AuthController::class, 'reinitialiserMotDePasse']);

// Webhook du fournisseur de paiement : appelé serveur-à-serveur par CinetPay, jamais par le client.
// Le statut du paiement est revérifié auprès de CinetPay dans le contrôleur, pas déduit de ce POST.
Route::post('/webhooks/cinetpay', [PaiementWebhookController::class, 'cinetpay'])->name('webhooks.cinetpay');

// Photos de profil : simple lecture de fichier, pas de donnée sensible à protéger derrière l'auth.
Route::get('/photos/{nomFichier}', [PhotoController::class, 'afficher'])->name('photos.show');

// --- Authentifié (tous rôles) ---
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profil', [AuthController::class, 'mettreAJourProfil']);
    Route::post('/profil/photo', [AuthController::class, 'mettreAJourPhoto']);
    Route::put('/profil/mot-de-passe', [AuthController::class, 'changerMotDePasse']);
    Route::delete('/profil', [AuthController::class, 'supprimerMonCompte']);

    Route::apiResource('incidents', IncidentController::class)->only(['index', 'store']);
    Route::post('/abonnements/souscrire', [AbonnementController::class, 'souscrire']);
    Route::get('/abonnements/mes-abonnements', [AbonnementController::class, 'mesAbonnements']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/tout-lire', [NotificationController::class, 'marquerToutesLues']);
    Route::post('/notifications/{notification}/lue', [NotificationController::class, 'marquerLue']);

    // --- CLIENT ---
    Route::middleware('role:CLIENT')->prefix('demandes')->group(function () {
        Route::post('/', [DemandeLivraisonController::class, 'store']);
        Route::get('/mes-demandes', [DemandeLivraisonController::class, 'mesDemandes']);
        Route::get('/mes-statistiques', [DemandeLivraisonController::class, 'mesStatistiques']);
        Route::get('/{demande}', [DemandeLivraisonController::class, 'show']);
        Route::get('/{demande}/suivi', [DemandeLivraisonController::class, 'suivi']);
        Route::post('/{demande}/payer', [DemandeLivraisonController::class, 'payer']);
        Route::post('/{demande}/paiement/initier', [DemandeLivraisonController::class, 'initierPaiementEnLigne']);
        Route::post('/{demande}/noter', [DemandeLivraisonController::class, 'noter']);
        Route::post('/{demande}/annuler', [DemandeLivraisonController::class, 'annuler']);
    });

    // --- ENTREPRISE ---
    Route::middleware('role:ENTREPRISE')->prefix('entreprise')->group(function () {
        Route::get('/dashboard', [EntrepriseDashboardController::class, 'index']);
        Route::get('/demandes', [EntrepriseDemandeController::class, 'index']);
        Route::get('/demandes/historique', [EntrepriseDemandeController::class, 'historique']);
        Route::post('/demandes/{demande}/accepter', [EntrepriseDemandeController::class, 'accepter']);
        Route::post('/demandes/{demande}/refuser', [EntrepriseDemandeController::class, 'refuser']);
        Route::post('/demandes/{demande}/programmer', [EntrepriseDemandeController::class, 'programmer']);
        Route::post('/demandes/{demande}/assigner', [EntrepriseDemandeController::class, 'assigner']);
        Route::post('/demandes/{demande}/confirmer-paiement', [EntrepriseDemandeController::class, 'confirmerPaiement']);
        Route::get('/livreurs', [EntrepriseDemandeController::class, 'livreurs']);

        Route::get('/vehicules', [VehiculeController::class, 'index']);
        Route::post('/vehicules', [VehiculeController::class, 'store']);
        Route::put('/vehicules/{vehicule}', [VehiculeController::class, 'update']);
        Route::delete('/vehicules/{vehicule}', [VehiculeController::class, 'destroy']);

        Route::get('/employes', [EmployeController::class, 'index']);
        Route::post('/employes', [EmployeController::class, 'store']);
        Route::delete('/employes/{livreur}', [EmployeController::class, 'destroy']);

        Route::put('/paiement', [EntrepriseProfilController::class, 'mettreAJourPaiement']);
        Route::post('/paiement/envoyer', [EntrepriseProfilController::class, 'envoyerQrLivreurs']);
    });

    // --- LIVREUR ---
    Route::middleware('role:LIVREUR')->prefix('livreur')->group(function () {
        Route::get('/mon-entreprise', [LivreurProfilController::class, 'monEntreprise']);
        Route::get('/missions', [MissionController::class, 'index']);
        Route::get('/missions/{mission}', [MissionController::class, 'show']);
        Route::post('/missions/{mission}/prendre-en-charge', [MissionController::class, 'prendreEnCharge']);
        Route::post('/missions/{mission}/position', [MissionController::class, 'mettreAJourPosition']);
        Route::post('/missions/{mission}/verifier-code', [MissionController::class, 'verifierCode']);
        Route::post('/missions/{mission}/livrer', [MissionController::class, 'livrer']);
    });

    // --- ADMIN ---
    Route::middleware('role:ADMIN')->prefix('admin')->group(function () {
        Route::get('/entreprises', [AdminEntrepriseController::class, 'index']);
        Route::post('/entreprises/{entreprise}/valider', [AdminEntrepriseController::class, 'valider']);

        Route::get('/utilisateurs', [AdminUtilisateurController::class, 'index']);
        Route::post('/utilisateurs/{utilisateur}/suspendre', [AdminUtilisateurController::class, 'suspendre']);
        Route::post('/utilisateurs/{utilisateur}/reactiver', [AdminUtilisateurController::class, 'reactiver']);
        Route::delete('/utilisateurs/{utilisateur}', [AdminUtilisateurController::class, 'destroy']);

        Route::get('/types-vehicule', [AdminParametreController::class, 'typesVehicule']);
        Route::post('/types-vehicule', [AdminParametreController::class, 'storeTypeVehicule']);
        Route::get('/types-service', [AdminParametreController::class, 'typesService']);
        Route::post('/types-service', [AdminParametreController::class, 'storeTypeService']);
        Route::get('/tarifs-abonnement', [AdminParametreController::class, 'tarifsAbonnement']);
        Route::post('/tarifs-abonnement', [AdminParametreController::class, 'storeTarifAbonnement']);

        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::post('/incidents/{incident}/resoudre', [IncidentController::class, 'resoudre']);
        Route::get('/abonnements', [AdminAbonnementController::class, 'index']);
        Route::post('/abonnements/{abonnement}/confirmer-paiement', [AdminAbonnementController::class, 'confirmerPaiement']);
    });

    // Types accessibles en lecture par tous les rôles authentifiés (pour remplir les formulaires)
    Route::get('/types-service', [AdminParametreController::class, 'typesService']);
    Route::get('/types-vehicule', [AdminParametreController::class, 'typesVehicule']);
    Route::get('/tarifs-abonnement', [AdminParametreController::class, 'tarifsAbonnement']);
    Route::get('/entreprises-actives', [AdminParametreController::class, 'entreprisesActives']);
});
