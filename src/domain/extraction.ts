/**
 * Résultat brut de l'extraction des notes, avant mise en forme du document.
 */
export const LOTS = [
  'CVC',
  'Thermique',
  'VRD',
  'Économie',
  'Électricité',
  'Architecture',
  'Structure',
  'Général',
] as const

export type Lot = (typeof LOTS)[number]

export interface ExtractedReport {
  summary: string
  decisions: { text: string; lot: Lot; raised_by: string | null; source_excerpt: string }[]
  actions: {
    text: string
    owner: string | null
    /** Échéance résolue, format YYYY-MM-DD. */
    due_date: string | null
    /** Expression telle qu'écrite dans les notes (« vendredi matin »). */
    due_hint: string | null
    lot: Lot
    source_excerpt: string
  }[]
  checks: { text: string; lot: Lot; owner: string | null; source_excerpt: string }[]
  key_infos: { text: string; lot: Lot; source_excerpt: string }[]
}

/** Contexte de réunion transmis à l'extracteur. */
export interface ExtractionRequest {
  notes: string
  meeting: {
    title: string
    date: string
    participants: { name: string; role: string }[]
  }
}
