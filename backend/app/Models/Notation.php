<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notation extends Model
{
    protected $table = 'notations';
    public $timestamps = false;
    protected $fillable = ['id_demande', 'id_auteur', 'note', 'commentaire', 'date'];
    protected $casts = ['date' => 'datetime'];

    public function demande()
    {
        return $this->belongsTo(DemandeLivraison::class, 'id_demande');
    }

    public function auteur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_auteur');
    }
}
