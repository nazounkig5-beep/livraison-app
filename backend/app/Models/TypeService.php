<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TypeService extends Model
{
    protected $table = 'type_services';
    protected $fillable = ['nom'];

    public function demandes()
    {
        return $this->hasMany(DemandeLivraison::class, 'id_type_service');
    }
}
