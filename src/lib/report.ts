import type { ExtractedReport, Lot } from '../domain/extraction.ts'
import type { MeetingMeta, Participant, Project, Report } from '../domain/types.ts'

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 11)

/** Rattache un nom libre (« Marie ») à l'intervenant du projet (« Marie Dufresne »). */
export function resolvePerson(name: string | null, participants: Participant[]): string | null {
  if (!name) return null
  const n = name.trim().toLowerCase()
  const match =
    participants.find((p) => p.name.toLowerCase() === n) ??
    participants.find((p) => p.name.split(' ')[0].toLowerCase() === n)
  return match?.name ?? name.trim()
}

export function buildReport(
  extracted: ExtractedReport,
  meta: MeetingMeta,
  project: Project,
): Report {
  const people = project.participants
  return {
    id: uid(),
    reference: `CR-${project.code}-${meta.date.replaceAll('-', '')}`,
    meta,
    summary: extracted.summary,
    decisions: extracted.decisions.map((d) => ({
      id: uid(),
      text: d.text,
      lot: d.lot,
      raisedBy: resolvePerson(d.raised_by, people),
      source: d.source_excerpt,
    })),
    actions: extracted.actions.map((a) => ({
      id: uid(),
      text: a.text,
      owner: resolvePerson(a.owner, people),
      dueDate: a.due_date && /^\d{4}-\d{2}-\d{2}$/.test(a.due_date) ? a.due_date : null,
      dueHint: a.due_hint,
      lot: a.lot,
      done: false,
      source: a.source_excerpt,
    })),
    checks: extracted.checks.map((c) => ({
      id: uid(),
      text: c.text,
      lot: c.lot,
      owner: resolvePerson(c.owner, people),
      source: c.source_excerpt,
    })),
    infos: extracted.key_infos.map((i) => ({ id: uid(), text: i.text, lot: i.lot, source: i.source_excerpt })),
    generatedAt: new Date().toISOString(),
  }
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

/** Clé CSS d'un lot : « Économie » → « economie ». */
export const lotKey = (lot: Lot) =>
  lot.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
