<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DemandeLivraison extends Model
{
    protected $table = 'demande_livraisons';
    protected $fillable = [
        'id_client', 'id_entreprise', 'id_type_service', 'adresse_depart', 'adresse_arrivee',
        'distance', 'tarif_estime', 'code_livraison', 'statut', 'date_creation', 'date_programmee',
    ];
    protected $casts = ['date_creation' => 'datetime', 'date_programmee' => 'datetime'];

    public function client()
    {
        return $this->belongsTo(Client::class, 'id_client');
    }

    public function entreprise()
    {
        return $this->belongsTo(Entreprise::class, 'id_entreprise');
    }

    public function typeService()
    {
        return $this->belongsTo(TypeService::class, 'id_type_service');
    }

    public function mission()
    {
        return $this->hasOne(Mission::class, 'id_demande');
    }

    public function paiement()
    {
        return $this->hasOne(Paiement::class, 'id_demande');
    }

    public function notation()
    {
        return $this->hasOne(Notation::class, 'id_demande');
    }

    public function incidents()
    {
        return $this->hasMany(Incident::class, 'id_demande');
    }
}
