<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Livreur;
use App\Models\Notification;
use Illuminate\Http\Request;

/** Cas d'utilisation Entreprise : "Configurer mes numéros de paiement mobile money" */
class EntrepriseProfilController extends Controller
{
    public function mettreAJourPaiement(Request $request)
    {
        $data = $request->validate([
            'numero_orange' => 'nullable|string|max:20',
            'numero_moov' => 'nullable|string|max:20',
            // Identifiants du compte marchand CinetPay de CETTE entreprise : chaque entreprise reçoit
            // directement ses propres paiements en ligne, la plateforme ne centralise aucun fonds.
            'cinetpay_site_id' => 'nullable|string|max:100',
            'cinetpay_api_key' => 'nullable|string|max:255',
        ]);

        $entreprise = $request->user()->entreprise;

        // Le QR code encode les numéros de l'entreprise : les clients le scannent pour payer directement.
        $qrData = json_encode([
            'orange' => $data['numero_orange'],
            'moov' => $data['numero_moov'],
            'entreprise_id' => $entreprise->id,
        ]);

        $miseAJour = [
            'numero_orange' => $data['numero_orange'] ?? null,
            'numero_moov' => $data['numero_moov'] ?? null,
            'qr_code' => base64_encode($qrData),
        ];

        // On ne touche aux identifiants CinetPay que s'ils sont explicitement renvoyés : la clé API n'est
        // jamais renvoyée au frontend (champ caché), donc un champ vide ne doit pas effacer la valeur existante.
        if (!empty($data['cinetpay_site_id'])) {
            $miseAJour['cinetpay_site_id'] = $data['cinetpay_site_id'];
        }
        if (!empty($data['cinetpay_api_key'])) {
            $miseAJour['cinetpay_api_key'] = $data['cinetpay_api_key'];
        }

        $entreprise->update($miseAJour);

        return response()->json($entreprise);
    }

    /**
     * Cas d'utilisation Entreprise : "Configurer mes tarifs de livraison".
     * Chaque entreprise fixe son propre prix/km (et frais de base) ainsi que sa position exacte,
     * utilisée comme point de départ pour le calcul automatique de la distance sur les demandes
     * de type "livraison" (voir DemandeLivraisonController::store).
     */
    public function mettreAJourTarifs(Request $request)
    {
        $data = $request->validate([
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'frais_base' => 'nullable|numeric|min:0',
            'prix_par_km' => 'nullable|numeric|min:0',
        ]);

        $entreprise = $request->user()->entreprise;
        $entreprise->update($data);

        return response()->json($entreprise);
    }

    /** Cas d'utilisation Entreprise : "Envoyer mon QR code de paiement à mes livreurs employés" */
    public function envoyerQrLivreurs(Request $request)
    {
        $entreprise = $request->user()->entreprise;

        abort_unless($entreprise->qr_code, 422, "Enregistrez d'abord vos numéros de paiement.");

        $livreurs = Livreur::where('id_entreprise', $entreprise->id)->get();

        abort_if($livreurs->isEmpty(), 422, "Vous n'avez aucun livreur employé pour le moment.");

        foreach ($livreurs as $livreur) {
            Notification::envoyer(
                $livreur->id,
                "L'entreprise {$entreprise->nom} vous a envoyé son QR code de paiement. Consultez-le dans « Mes missions »."
            );
        }

        return response()->json(['message' => 'QR code envoyé.', 'nombre_livreurs' => $livreurs->count()]);
    }
}
