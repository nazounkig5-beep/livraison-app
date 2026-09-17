<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Incident extends Model
{
    protected $table = 'incidents';
    protected $fillable = ['id_demande', 'description', 'statut', 'date_ouverture'];
    protected $casts = ['date_ouverture' => 'datetime'];

    public function demande()
    {
        return $this->belongsTo(DemandeLivraison::class, 'id_demande');
    }
}
