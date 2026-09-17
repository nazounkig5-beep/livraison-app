<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

/** Cas d'utilisation : "Notifier le client" (et tout utilisateur) des évènements sur ses demandes */
class NotificationController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Notification::where('id_utilisateur', $request->user()->id)->orderByDesc('created_at')->get()
        );
    }

    public function marquerLue(Request $request, Notification $notification)
    {
        abort_unless($notification->id_utilisateur === $request->user()->id, 403);

        $notification->update(['lu' => true]);
        return response()->json($notification);
    }

    public function marquerToutesLues(Request $request)
    {
        Notification::where('id_utilisateur', $request->user()->id)->where('lu', false)->update(['lu' => true]);
        return response()->json(['message' => 'Toutes les notifications ont été marquées comme lues.']);
    }
}
