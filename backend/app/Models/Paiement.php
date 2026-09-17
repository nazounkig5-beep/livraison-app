<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    protected $table = 'paiements';
    protected $fillable = [
        'id_demande', 'montant', 'mode', 'statut', 'date_transaction',
        'provider', 'reference_externe', 'lien_paiement',
    ];
    protected $casts = ['date_transaction' => 'datetime'];

    public function demande()
    {
        return $this->belongsTo(DemandeLivraison::class, 'id_demande');
    }
}
