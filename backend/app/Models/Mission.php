<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mission extends Model
{
    protected $table = 'missions';
    protected $fillable = [
        'id_demande', 'id_livreur', 'id_vehicule', 'date_acceptation', 'statut_prise_en_charge',
    ];
    protected $casts = ['date_acceptation' => 'datetime'];

    public function demande()
    {
        return $this->belongsTo(DemandeLivraison::class, 'id_demande');
    }

    public function livreur()
    {
        return $this->belongsTo(Livreur::class, 'id_livreur');
    }

    public function vehicule()
    {
        return $this->belongsTo(Vehicule::class, 'id_vehicule');
    }

    public function suivis()
    {
        return $this->hasMany(SuiviLivraison::class, 'id_mission')->orderBy('timestamp');
    }
}
