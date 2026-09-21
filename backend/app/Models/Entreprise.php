<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Entreprise extends Model
{
    protected $table = 'entreprises';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $fillable = [
        'id', 'siret', 'nom', 'numero_orange', 'numero_moov', 'qr_code', 'statut_validation', 'date_validation',
        'cinetpay_site_id', 'cinetpay_api_key', 'latitude', 'longitude', 'frais_base', 'prix_par_km',
    ];
    protected $casts = ['date_validation' => 'datetime', 'cinetpay_api_key' => 'encrypted'];
    // Identifiants du compte marchand CinetPay de l'entreprise : jamais renvoyés au frontend.
    protected $hidden = ['cinetpay_site_id', 'cinetpay_api_key'];
    protected $appends = ['paiement_en_ligne_configure'];

    public function getPaiementEnLigneConfigureAttribute(): bool
    {
        return filled($this->cinetpay_site_id) && filled($this->cinetpay_api_key);
    }

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id');
    }

    public function vehicules()
    {
        return $this->hasMany(Vehicule::class, 'id_entreprise');
    }

    public function demandes()
    {
        return $this->hasMany(DemandeLivraison::class, 'id_entreprise');
    }

    public function abonnements()
    {
        return $this->hasMany(Abonnement::class, 'id_entreprise');
    }

    public function employes()
    {
        return $this->hasMany(Livreur::class, 'id_entreprise');
    }
}
