<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Abonnement extends Model
{
    protected $table = 'abonnements';
    protected $fillable = [
        'id_entreprise', 'id_livreur', 'id_tarif', 'montant', 'date_debut', 'date_fin',
        'statut', 'mode_paiement', 'statut_paiement',
    ];
    protected $casts = ['date_debut' => 'date', 'date_fin' => 'date'];

    public function entreprise()
    {
        return $this->belongsTo(Entreprise::class, 'id_entreprise');
    }

    public function livreur()
    {
        return $this->belongsTo(Livreur::class, 'id_livreur');
    }

    public function tarif()
    {
        return $this->belongsTo(TarifAbonnement::class, 'id_tarif');
    }
}
