<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $table = 'notifications';
    protected $fillable = ['id_utilisateur', 'message', 'lu'];
    protected $casts = ['lu' => 'boolean'];

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
    }

    public static function envoyer(int $idUtilisateur, string $message): self
    {
        return self::create(['id_utilisateur' => $idUtilisateur, 'message' => $message]);
    }
}
