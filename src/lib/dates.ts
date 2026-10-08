/** Utilitaires de dates — chaînes ISO locales `YYYY-MM-DD`, sans fuseau. */

const pad = (n: number) => String(n).padStart(2, '0')

export function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12)
}

export function todayIso(): string {
  return toIso(new Date())
}

export function addDays(iso: string, days: number): string {
  const d = fromIso(iso)
  d.setDate(d.getDate() + days)
  return toIso(d)
}

export function daysBetween(fromIsoDate: string, toIsoDate: string): number {
  return Math.round((fromIso(toIsoDate).getTime() - fromIso(fromIsoDate).getTime()) / 86_400_000)
}

const longFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const shortFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
const numericFmt = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export const formatLong = (iso: string) => longFmt.format(fromIso(iso))
export const formatShort = (iso: string) => shortFmt.format(fromIso(iso)).replace(/\.$/, '')
export const formatNumeric = (iso: string) => numericFmt.format(fromIso(iso))

// ---------------------------------------------------------------------------
// Résolution des échéances exprimées en français dans des notes.
// ---------------------------------------------------------------------------

const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

export interface DueMatch {
  date: string
  hint: string
  /** Position et longueur de l'expression dans le texte source. */
  index: number
  length: number
}

/** Prochaine occurrence d'un jour de semaine, strictement après la date de référence. */
function nextWeekday(ref: string, weekday: number): string {
  const d = fromIso(ref)
  const delta = ((weekday - d.getDay() + 7) % 7) || 7
  return addDays(ref, delta)
}

function startOfNextWeek(ref: string): string {
  return nextWeekday(ref, 1)
}

/** Ancre une date jour/mois sur l'année de référence, ou la suivante si déjà passée. */
function dayMonth(ref: string, day: number, month: number, year?: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const refDate = fromIso(ref)
  let y = year ?? refDate.getFullYear()
  if (y < 100) y += 2000
  let candidate = new Date(y, month - 1, day, 12)
  if (!year && candidate < refDate && daysBetween(toIso(candidate), ref) > 31) {
    candidate = new Date(y + 1, month - 1, day, 12)
  }
  return toIso(candidate)
}

const DAYPART = String.raw`(?:\s+(?:matin|midi|après-midi|soir|en fin de journée|dans la journée))?`
const LEAD = String.raw`(?:(?:d'ici|d’ici|pour|avant|au plus tard|dès|jusqu'à|à partir de)\s+)?(?:(?:le|la|ce|cette)\s+)?`

type Rule = { re: RegExp; resolve: (m: RegExpExecArray, ref: string) => string | null }

const RULES: Rule[] = [
  {
    re: new RegExp(String.raw`\b${LEAD}(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?\b${DAYPART}`, 'i'),
    resolve: (m, ref) => dayMonth(ref, +m[1], +m[2], m[3] ? +m[3] : undefined),
  },
  {
    re: new RegExp(String.raw`\b${LEAD}(\d{1,2}|1er)\s+(${MONTHS.join('|')})(?:\s+(\d{4}))?${DAYPART}`, 'i'),
    resolve: (m, ref) =>
      dayMonth(ref, m[1] === '1er' ? 1 : +m[1], MONTHS.indexOf(m[2].toLowerCase()) + 1, m[3] ? +m[3] : undefined),
  },
  {
    re: new RegExp(String.raw`\b${LEAD}après-demain${DAYPART}`, 'i'),
    resolve: (_m, ref) => addDays(ref, 2),
  },
  {
    re: new RegExp(String.raw`\b${LEAD}demain${DAYPART}`, 'i'),
    resolve: (_m, ref) => addDays(ref, 1),
  },
  {
    re: /\bsous\s+huitaine\b/i,
    resolve: (_m, ref) => addDays(ref, 8),
  },
  {
    re: /\bsous\s+quinzaine\b/i,
    resolve: (_m, ref) => addDays(ref, 15),
  },
  {
    re: /\b(?:sous|dans|d'ici|d’ici)\s+(\d{1,2})\s+jours?\b/i,
    resolve: (m, ref) => addDays(ref, +m[1]),
  },
  {
    re: /\b(?:en\s+)?début\s+de\s+semaine\s+prochaine\b/i,
    resolve: (_m, ref) => startOfNextWeek(ref),
  },
  {
    re: /\b(?:en\s+|d'ici\s+(?:la\s+)?|d’ici\s+(?:la\s+)?|pour\s+la\s+)?fin\s+de\s+(?:la\s+)?semaine\s+prochaine\b/i,
    resolve: (_m, ref) => addDays(startOfNextWeek(ref), 4),
  },
  {
    re: /\b(?:dans\s+le\s+courant\s+de\s+|courant\s+)?(?:la\s+)?semaine\s+prochaine\b/i,
    resolve: (_m, ref) => addDays(startOfNextWeek(ref), 4),
  },
  {
    re: /\b(?:en\s+|d'ici\s+(?:la\s+)?|d’ici\s+(?:la\s+)?|pour\s+la\s+)?fin\s+de\s+(?:la\s+)?semaine\b/i,
    resolve: (_m, ref) => {
      const d = fromIso(ref).getDay()
      return d >= 5 || d === 0 ? addDays(startOfNextWeek(ref), 4) : nextWeekday(ref, 5)
    },
  },
  {
    re: /\b(?:en\s+|d'ici\s+(?:la\s+)?|d’ici\s+(?:la\s+)?|pour\s+la\s+)?fin\s+du\s+mois\b/i,
    resolve: (_m, ref) => {
      const d = fromIso(ref)
      return toIso(new Date(d.getFullYear(), d.getMonth() + 1, 0, 12))
    },
  },
  {
    re: new RegExp(String.raw`\b${LEAD}(${WEEKDAYS.join('|')})(?:\s+prochain)?${DAYPART}`, 'i'),
    resolve: (m, ref) => nextWeekday(ref, WEEKDAYS.indexOf(m[1].toLowerCase())),
  },
]

/** Cherche la première échéance identifiable dans un texte. */
export function findDue(text: string, refIso: string): DueMatch | null {
  let best: DueMatch | null = null
  for (const rule of RULES) {
    const m = rule.re.exec(text)
    if (!m) continue
    const date = rule.resolve(m, refIso)
    if (!date) continue
    if (!best || m.index < best.index) {
      best = { date, hint: m[0].trim(), index: m.index, length: m[0].length }
    }
  }
  return best
}

/** Retire l'expression d'échéance d'un libellé (« … pour vendredi » → « … »). */
export function stripDue(text: string, refIso: string): string {
  const due = findDue(text, refIso)
  if (!due) return text
  const out = text.slice(0, due.index) + text.slice(due.index + due.length)
  return out.replace(/\s{2,}/g, ' ').replace(/\s+([,.;])/g, '$1').trim()
}
