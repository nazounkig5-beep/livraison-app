export type OperateurMobileMoney = 'ORANGE' | 'MOOV';

/** Génère le code USSD à composer pour payer via mobile money. */
export function genererCodeUssd(operateur: OperateurMobileMoney, numero: string, montant: number): string {
  return construireCodeUssd(operateur, numero, String(Math.round(montant)));
}

/** Aperçu du code USSD affiché à l'entreprise avant qu'un montant réel n'existe (placeholder [montant]). */
export function genererApercuUssd(operateur: OperateurMobileMoney, numero: string): string {
  return construireCodeUssd(operateur, numero, '[montant]');
}

function construireCodeUssd(operateur: OperateurMobileMoney, numero: string, montant: string): string {
  return operateur === 'ORANGE' ? `*144*10*${numero}*${montant}#` : `*555*10*${numero}*${montant}#`;
}

/** Convertit un code USSD en URI `tel:` (le # doit être encodé en %23 pour un lien cliquable/scannable). */
export function genererLienUssd(codeUssd: string): string {
  return `tel:${codeUssd.replace(/#/g, '%23')}`;
}
