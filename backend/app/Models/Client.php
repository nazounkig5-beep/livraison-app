<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $table = 'clients';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $fillable = ['id', 'adresse_facturation'];

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id');
    }

    public function demandes()
    {
        return $this->hasMany(DemandeLivraison::class, 'id_client');
    }
}
