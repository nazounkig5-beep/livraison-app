<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vehicule extends Model
{
    protected $table = 'vehicules';
    protected $fillable = ['id_entreprise', 'id_type_vehicule', 'immatriculation', 'statut'];

    public function entreprise()
    {
        return $this->belongsTo(Entreprise::class, 'id_entreprise');
    }

    public function typeVehicule()
    {
        return $this->belongsTo(TypeVehicule::class, 'id_type_vehicule');
    }

    public function missions()
    {
        return $this->hasMany(Mission::class, 'id_vehicule');
    }
}
