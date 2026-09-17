<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Intégration CinetPay (mobile money Orange/MTN/Moov/Wave) via son checkout hébergé.
 * Chaque entreprise a son propre compte marchand CinetPay : site_id/api_key sont donc passés
 * par appel (jamais une config globale), pour que chaque entreprise reçoive directement ses fonds.
 * Le statut d'un paiement ne doit jamais être déduit du webhook seul : verifierTransaction()
 * revérifie toujours auprès de CinetPay avant de considérer un paiement comme confirmé.
 */
class CinetPayService
{
    private string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = (string) config('services.cinetpay.base_url');
    }

    public function initierPaiement(
        string $siteId,
        string $apiKey,
        string $transactionId,
        float $montant,
        string $description,
        string $notifyUrl,
        string $returnUrl
    ): array {
        $reponse = Http::asJson()->post("{$this->baseUrl}/payment", [
            'apikey' => $apiKey,
            'site_id' => $siteId,
            'transaction_id' => $transactionId,
            'amount' => (int) round($montant),
            'currency' => 'XOF',
            'description' => $description,
            'notify_url' => $notifyUrl,
            'return_url' => $returnUrl,
            'channels' => 'MOBILE_MONEY',
        ]);

        $corps = $reponse->json() ?? [];

        if (($corps['code'] ?? null) !== '201') {
            Log::warning('CinetPay: échec initiation paiement', ['reponse' => $corps]);
            throw new RuntimeException($corps['message'] ?? 'Impossible d\'initier le paiement CinetPay.');
        }

        return [
            'payment_url' => $corps['data']['payment_url'],
            'payment_token' => $corps['data']['payment_token'],
        ];
    }

    public function verifierTransaction(string $siteId, string $apiKey, string $transactionId): array
    {
        $reponse = Http::asJson()->post("{$this->baseUrl}/payment/check", [
            'apikey' => $apiKey,
            'site_id' => $siteId,
            'transaction_id' => $transactionId,
        ]);

        return $reponse->json() ?? [];
    }
}
