<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Livreur extends Model
{
    protected $table = 'livreurs';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $fillable = ['id', 'id_entreprise', 'latitude', 'longitude', 'note_moyenne', 'type'];

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id');
    }

    public function entreprise()
    {
        return $this->belongsTo(Entreprise::class, 'id_entreprise');
    }

    public function missions()
    {
        return $this->hasMany(Mission::class, 'id_livreur');
    }

    public function abonnements()
    {
        return $this->hasMany(Abonnement::class, 'id_livreur');
    }

    public function estDisponible(): bool
    {
        return !$this->missions()->where('statut_prise_en_charge', 'EN_COURS')->exists();
    }
}
