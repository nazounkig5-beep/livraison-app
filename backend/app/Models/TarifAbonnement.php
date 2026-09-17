<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TarifAbonnement extends Model
{
    protected $table = 'tarif_abonnements';
    protected $fillable = ['nom', 'duree', 'prix', 'description'];

    public function abonnements()
    {
        return $this->hasMany(Abonnement::class, 'id_tarif');
    }
}
