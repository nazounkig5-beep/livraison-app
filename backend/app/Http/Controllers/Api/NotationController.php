<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notation;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * Cas d'utilisation : "Consulter mes notes" (livreur) / "Consulter les notes de mes livreurs" (entreprise).
 * Une Notation est créée par le client sur une demande (DemandeLivraisonController::noter) ; pour
 * remonter jusqu'au livreur concerné, on passe par demande -> mission -> livreur (une notation ne
 * pointe pas directement vers un livreur, seulement vers la demande notée).
 */
class NotationController extends Controller
{
    /** Cas d'utilisation Livreur : mes notes reçues, par livraison, avec moyenne et max par mois. */
    public function mesNotes(Request $request)
    {
        $idLivreur = $request->user()->id;

        $notations = Notation::whereHas('demande.mission', fn ($q) => $q->where('id_livreur', $idLivreur))
            ->with('demande')
            ->orderByDesc('date')
            ->get();

        return response()->json($this->construireStatistiques($notations));
    }

    /**
     * Cas d'utilisation Entreprise : notes de chaque livreur ayant traité une de ses demandes.
     * Volontairement limité aux demandes DE CETTE entreprise : un livreur indépendant peut
     * travailler pour plusieurs entreprises, chacune ne doit voir que la part qui la concerne, pas
     * la réputation globale du livreur ailleurs.
     */
    public function notesLivreurs(Request $request)
    {
        $idEntreprise = $request->user()->id;

        $notations = Notation::whereHas('demande', fn ($q) => $q->where('id_entreprise', $idEntreprise))
            ->whereHas('demande.mission')
            ->with('demande.mission.livreur.utilisateur')
            ->orderByDesc('date')
            ->get()
            ->filter(fn (Notation $n) => $n->demande?->mission?->id_livreur !== null);

        $parLivreur = $notations->groupBy(fn (Notation $n) => $n->demande->mission->id_livreur);

        $resultat = $parLivreur
            ->map(function (Collection $notes, $idLivreur) {
                $livreur = $notes->first()->demande->mission->livreur;

                return array_merge(
                    [
                        'id_livreur' => (int) $idLivreur,
                        'nom' => $livreur?->utilisateur?->nom,
                    ],
                    $this->construireStatistiques($notes)
                );
            })
            ->values();

        return response()->json($resultat);
    }

    /** Moyenne générale, détail par livraison, et moyenne/max regroupés par mois. */
    private function construireStatistiques(Collection $notations): array
    {
        $notesParMois = $notations
            ->groupBy(fn (Notation $n) => $n->date->format('Y-m'))
            ->map(fn (Collection $groupe, $mois) => [
                'mois' => $mois,
                'note_moyenne' => round($groupe->avg('note'), 2),
                'note_max' => $groupe->max('note'),
                'nombre' => $groupe->count(),
            ])
            ->sortByDesc('mois')
            ->values();

        return [
            'note_moyenne' => $notations->count() ? round($notations->avg('note'), 2) : null,
            'nombre_notes' => $notations->count(),
            'notes_par_mois' => $notesParMois,
            'notes' => $notations->map(fn (Notation $n) => [
                'id_demande' => $n->id_demande,
                'note' => $n->note,
                'commentaire' => $n->commentaire,
                'date' => $n->date,
                'trajet' => $n->demande ? "{$n->demande->adresse_depart} → {$n->demande->adresse_arrivee}" : null,
            ])->values(),
        ];
    }
}
