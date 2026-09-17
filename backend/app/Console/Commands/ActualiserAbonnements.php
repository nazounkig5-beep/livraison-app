<?php

namespace App\Console\Commands;

use App\Models\Abonnement;
use Illuminate\Console\Command;

/**
 * Bascule en EXPIRE tout abonnement ACTIF dont la date de fin est dépassée.
 * Prévu pour tourner quotidiennement via le planificateur (routes/console.php).
 * Note : cette appli étant un backend de bureau (ne tourne que quand l'utilisateur l'ouvre),
 * le planificateur Laravel n'est pas garanti de s'exécuter — AbonnementController applique donc
 * la même règle à la volée à chaque lecture, qui reste la vraie garantie de cohérence.
 */
class ActualiserAbonnements extends Command
{
    protected $signature = 'abonnements:actualiser';
    protected $description = "Bascule en EXPIRE les abonnements dont la date de fin est dépassée";

    public function handle(): int
    {
        $nombre = Abonnement::where('statut', 'ACTIF')->whereDate('date_fin', '<', now())->update(['statut' => 'EXPIRE']);
        $this->info("{$nombre} abonnement(s) marqué(s) comme expiré(s).");

        return self::SUCCESS;
    }
}
