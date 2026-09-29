/** Une note laissée par le client sur une livraison précise. */
export interface NoteParLivraison {
  id_demande: number;
  note: number;
  commentaire: string | null;
  date: string;
  trajet: string | null;
}

/** Moyenne et meilleure note obtenues sur un mois donné ("2026-09"). */
export interface NoteParMois {
  mois: string;
  note_moyenne: number;
  note_max: number;
  nombre: number;
}

export interface StatistiquesNotes {
  note_moyenne: number | null;
  nombre_notes: number;
  notes_par_mois: NoteParMois[];
  notes: NoteParLivraison[];
}

/** Vue entreprise : les mêmes statistiques, mais une par livreur. */
export interface StatistiquesNotesLivreur extends StatistiquesNotes {
  id_livreur: number;
  nom: string | null;
}
