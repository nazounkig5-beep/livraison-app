<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Services\CinetPayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaiementWebhookController extends Controller
{
    /**
     * Notification CinetPay (notify_url). Le contenu du POST n'est jamais une preuve suffisante :
     * on revérifie toujours le statut réel via l'API CinetPay avant de confirmer un paiement.
     */
    public function cinetpay(Request $request, CinetPayService $cinetPay)
    {
        $transactionId = $request->input('cpm_trans_id') ?? $request->input('transaction_id');

        if (!$transactionId) {
            return response()->json(['message' => 'transaction_id manquant'], 400);
        }

        $paiement = Paiement::with('demande.entreprise')->where('reference_externe', $transactionId)->first();

        if (!$paiement) {
            Log::warning('Webhook CinetPay: paiement introuvable', ['transaction_id' => $transactionId]);
            return response()->json(['message' => 'paiement introuvable'], 404);
        }

        if ($paiement->statut === 'CONFIRME') {
            return response()->json(['message' => 'déjà confirmé']);
        }

        $entreprise = $paiement->demande?->entreprise;
        if (!$entreprise?->paiement_en_ligne_configure) {
            Log::error('Webhook CinetPay: identifiants entreprise manquants', ['transaction_id' => $transactionId]);
            return response()->json(['message' => 'configuration entreprise manquante'], 422);
        }

        $verification = $cinetPay->verifierTransaction($entreprise->cinetpay_site_id, $entreprise->cinetpay_api_key, $transactionId);
        $statutCinetpay = $verification['data']['status'] ?? null;

        if ($statutCinetpay === 'ACCEPTED') {
            $paiement->update(['statut' => 'CONFIRME', 'date_transaction' => now()]);
        } elseif ($statutCinetpay === 'REFUSED') {
            $paiement->update(['statut' => 'ECHEC']);
        } else {
            Log::info('Webhook CinetPay: statut non final', ['transaction_id' => $transactionId, 'verification' => $verification]);
        }

        return response()->json(['message' => 'ok']);
    }
}
