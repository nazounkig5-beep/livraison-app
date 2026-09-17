<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Utilisateur extends Authenticatable
{
    use HasApiTokens;

    protected $table = 'utilisateurs';
    protected $fillable = [
        'nom', 'email', 'mot_de_passe', 'role', 'statut_compte', 'date_creation',
        'telephone', 'ville', 'adresse', 'photo',
    ];
    protected $hidden = ['mot_de_passe', 'remember_token', 'photo'];
    protected $casts = ['date_creation' => 'datetime'];
    protected $appends = ['photo_url'];

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo ? route('photos.show', ['nomFichier' => basename($this->photo)]) : null;
    }

    /**
     * Raison bloquant une suppression (compte admin unique, ou historique que la BD refuserait
     * de toute façon via ses contraintes RESTRICT), sinon null si la suppression peut procéder.
     * Utilisée à la fois par l'admin (suppression d'un autre compte) et par l'utilisateur
     * lui-même (zone dangereuse de son profil).
     */
    public function raisonBlocageSuppression(): ?string
    {
        if ($this->role === 'ADMIN' && self::where('role', 'ADMIN')->count() <= 1) {
            return 'Impossible de supprimer le dernier compte administrateur.';
        }

        if ($this->role === 'CLIENT' && $this->client?->demandes()->exists()) {
            return 'Ce compte a un historique de livraisons : suspendez-le plutôt que de le supprimer.';
        }

        if ($this->role === 'LIVREUR' && $this->livreur?->missions()->exists()) {
            return 'Ce compte a un historique de missions : suspendez-le plutôt que de le supprimer.';
        }

        if (
            $this->role === 'ENTREPRISE' &&
            $this->entreprise?->demandes()->whereNotIn('statut', ['LIVREE', 'ANNULEE'])->exists()
        ) {
            return 'Cette entreprise a des livraisons en cours : attendez leur clôture avant de la supprimer.';
        }

        return null;
    }

    // Laravel utilise "password" par défaut pour l'auth ; on mappe sur mot_de_passe
    public function getAuthPassword()
    {
        return $this->mot_de_passe;
    }

    public function client()
    {
        return $this->hasOne(Client::class, 'id');
    }

    public function livreur()
    {
        return $this->hasOne(Livreur::class, 'id');
    }

    public function entreprise()
    {
        return $this->hasOne(Entreprise::class, 'id');
    }

    public function notationsRedigees()
    {
        return $this->hasMany(Notation::class, 'id_auteur');
    }
}
