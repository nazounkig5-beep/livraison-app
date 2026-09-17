<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SuiviLivraison extends Model
{
    protected $table = 'suivi_livraisons';
    public $timestamps = false;
    protected $fillable = ['id_mission', 'latitude', 'longitude', 'timestamp', 'evenement'];
    protected $casts = ['timestamp' => 'datetime'];

    public function mission()
    {
        return $this->belongsTo(Mission::class, 'id_mission');
    }
}
