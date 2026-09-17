<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TypeVehicule extends Model
{
    protected $table = 'type_vehicules';
    protected $fillable = ['nom'];

    public function vehicules()
    {
        return $this->hasMany(Vehicule::class, 'id_type_vehicule');
    }
}
