<?php

namespace App\Models;

use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\HasApiTokens;

class Utilisateur extends Authenticatable implements CanResetPasswordContract
{
    use HasApiTokens, CanResetPassword;

    protected $table = 'utilisateurs';
    protected $fillable = [
        'nom', 'email', 'mot_de_passe', 'role', 'statut_compte', 'date_creation',
        'telephone', 'ville', 'adresse', 'photo', 'langue',
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

    /**
     * Envoie le lien de réinitialisation par email plutôt que de dépendre d'une route web
     * "password.reset" (inexistante dans cette API) : on construit nous-mêmes l'URL vers le
     * frontend Angular. Utilise Mail::raw (pas de vue Blade) car ce backend est API-only.
     */
    public function sendPasswordResetNotification($token): void
    {
        $url = rtrim(config('services.frontend_url'), '/')
            . '/auth/reinitialiser-mot-de-passe?token=' . $token . '&email=' . urlencode($this->email);

        Mail::raw(
            "Bonjour {$this->nom},\n\n" .
            "Vous avez demandé la réinitialisation de votre mot de passe LivraisonApp.\n" .
            "Cliquez sur ce lien pour choisir un nouveau mot de passe (valable 60 minutes) :\n{$url}\n\n" .
            "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
            function ($message) {
                $message->to($this->email)->subject('Réinitialisation de votre mot de passe');
            }
        );
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
