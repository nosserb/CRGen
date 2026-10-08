/**
 * Extraction des notes de réunion par règles linguistiques.
 *
 * Les règles couvrent les tournures courantes des notes de réunion de MOE :
 * « X doit… », « X transmettra… », « X attend… », « … doit être modifié(e) »,
 * « Il est décidé de… », « Il faut vérifier… », « X indique que… ».
 */
import type { ExtractedReport, ExtractionRequest, Lot } from '../domain/extraction.ts'
import { findDue, stripDue } from './dates.ts'

// ---------------------------------------------------------------------------
// Lots
// ---------------------------------------------------------------------------

/** Mot entier, accents compris (\b ne gère pas les lettres accentuées). */
const words = (pattern: string, flags = 'giu') =>
  new RegExp(String.raw`(?<![\p{L}\p{N}_])(?:${pattern})(?![\p{L}\p{N}_])`, flags)

const LOT_RULES: [Lot, RegExp[]][] = [
  // L'ordre départage les égalités : un chiffrage de CTA relève d'abord de l'économie.
  ['Économie', [words(String.raw`coûts?|prix|chiffr\p{L}*|estimations?|budget|enveloppe|dpgf|dqe|quantitatifs?|métrés?|surcoûts?|m€|k€|avenants?|devis|économi\p{L}*`)]],
  ['CVC', [words(String.raw`cta|cvc|ventilation|débits?|chauffage|climatisation|pac|chaufferie|vmc|soufflage|traitement d['’]air|groupe froid|géothermi\p{L}*|sondes?|fluides?`)]],
  ['Thermique', [words(String.raw`thermiques?|re ?2020|rt ?2012|bbio|cep|déperditions?|isolation|ite|iti|std|besoins de chauffage|confort d['’]été|laine de bois`)]],
  ['VRD', [words(String.raw`vrd|voiries?|réseaux?|assainissement|enrobés?|bassin|rétention|concessionnaires?|raccordements?|profil en long|parking|béton drainant|terrassements?`), words('EU|EP', 'gu')]],
  ['Électricité', [words(String.raw`électri\p{L}*|cfo|cfa|tgbt|groupe électrogène|éclairage|ssi|photovolta\p{L}*`)]],
  ['Architecture', [words(String.raw`plans? architecte|architecte|architecture|coupes?|façades?|cctp architecture`)]],
  ['Structure', [words(String.raw`structure|béton armé|charpente|fondations?|dalles?|forages?|foreurs?|étude de sol|g2|géotechni\p{L}*`)]],
]

export function detectLot(text: string, context: Lot | null = null): Lot {
  let best: Lot | null = null
  let bestScore = 0
  for (const [lot, patterns] of LOT_RULES) {
    let score = lot === context ? 0.5 : 0
    for (const re of patterns) score += text.match(re)?.length ?? 0
    if (score > bestScore) {
      best = lot
      bestScore = score
    }
  }
  return best ?? context ?? 'Général'
}

// ---------------------------------------------------------------------------
// Découpage des notes
// ---------------------------------------------------------------------------

interface Clause {
  text: string
  context: Lot | null
}

const HEADING = /^([\p{L}][\p{L}' ’/-]{1,40}?)\s*:\s*(.*)$/u

function splitNotes(notes: string): Clause[] {
  const out: Clause[] = []
  let carried: Lot | null = null

  for (const raw of notes.split(/\n+/)) {
    let line = raw.replace(/^\s*(?:[-•*–—]|\d+[.)])\s*/, '').trim()
    if (!line) continue

    let context: Lot | null = null
    const heading = HEADING.exec(line)
    if (heading && heading[1].split(' ').length <= 4) {
      const lot = detectLot(heading[1])
      context = lot === 'Général' ? null : lot
      line = heading[2].trim()
      if (!line) {
        carried = context
        continue
      }
    }

    for (const sentence of line.split(/(?<=[.!?])\s+(?=[\p{Lu}«"])/u)) {
      const text = sentence.trim()
      if (text.length > 2) out.push({ text, context: context ?? carried })
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Grammaire
// ---------------------------------------------------------------------------

const NAME = String.raw`([\p{Lu}][\p{Ll}’'-]+(?:\s[\p{Lu}][\p{Ll}-]+)?)`
const NOT_NAMES = new Set([
  'Il', 'Elle', 'Ils', 'Elles', 'On', 'Le', 'La', 'Les', 'Un', 'Une', 'Ce', 'Cet', 'Cette',
  'Ces', 'Nous', 'Pour', 'Point', 'Une', 'Des', 'Du', 'Au', 'En', 'Sur', 'Dans', 'Reste',
])

const REPORTING = String.raw`indique|précise|signale|rappelle|confirme|informe|note|souligne|explique|annonce|estime|remarque|constate|ajoute|propose|mentionne`

const PARTICIPLES: Record<string, string> = {
  modifié: 'Modification',
  remplacé: 'Remplacement',
  déplacé: 'Déplacement',
  supprimé: 'Suppression',
  repris: 'Reprise',
  revu: 'Révision',
  redimensionné: 'Redimensionnement',
  validé: 'Validation',
  abandonné: 'Abandon',
  conservé: 'Maintien',
  maintenu: 'Maintien',
  ajouté: 'Ajout',
  augmenté: 'Augmentation',
  réduit: 'Réduction',
  décalé: 'Décalage',
  intégré: 'Intégration',
  retenu: 'Choix',
  renforcé: 'Renforcement',
  agrandi: 'Agrandissement',
}
const FEMININE = new Set(['Modification', 'Suppression', 'Reprise', 'Révision', 'Validation', 'Augmentation', 'Réduction', 'Intégration'])
const PARTICIPLE = `(${Object.keys(PARTICIPLES).join('|')})(?:e|s|es)?`

const IRREGULAR_FUTURE: Record<string, string> = {
  enverra: 'envoyer',
  fera: 'faire',
  transmettra: 'transmettre',
  remettra: 'remettre',
  mettra: 'mettre',
  reprendra: 'reprendre',
  prendra: 'prendre',
  verra: 'voir',
  pourra: 'pouvoir',
  devra: 'devoir',
  produira: 'produire',
  rendra: 'rendre',
  diffusera: 'diffuser',
  ira: 'aller',
  sera: 'être',
  aura: 'avoir',
}

function futureToInfinitive(verb: string): string | null {
  const v = verb.toLowerCase()
  if (IRREGULAR_FUTURE[v]) return v === 'sera' || v === 'aura' ? null : IRREGULAR_FUTURE[v]
  if (/[^r]era$/.test(v)) return v.replace(/era$/, 'er')
  if (/ira$/.test(v) && v.length > 4) return v.replace(/ira$/, 'ir')
  return null
}

const cap = (s: string) => (s ? s[0].toLocaleUpperCase('fr') + s.slice(1) : s)
const lowerArticle = (s: string) =>
  s.replace(/^(Le|La|Les|L['’]|Un|Une|Des|Ce|Cet|Cette|Ces)(?=[\s\p{L}])/u, (a) => a.toLowerCase())

function finish(s: string): string {
  const t = s.trim().replace(/\s+/g, ' ').replace(/[\s,;:]+$/, '')
  if (!t) return t
  return /[.!?]$/.test(t) ? t : `${t}.`
}

function stripTrailingPeriod(s: string) {
  return s.trim().replace(/[.\s]+$/, '')
}

/** « la CTA » → « de la CTA », « le raccordement » → « du raccordement »… */
function deForm(np: string): string {
  const s = lowerArticle(np.trim())
  if (/^le\s/.test(s)) return s.replace(/^le\s/, 'du ')
  if (/^les\s/.test(s)) return s.replace(/^les\s/, 'des ')
  if (/^des\s/.test(s)) return s.replace(/^des\s/, 'de ')
  if (/^l['’]/.test(s)) return `de ${s}`
  if (/^[aeiouyéèêàâh]/i.test(s)) return `d’${s}`
  return `de ${s}`
}

/** Coupe les incises qui ne font pas partie de l'action (« … et pense avoir le prix vendredi »). */
function trimActionTail(s: string) {
  return s
    .replace(/,?\s+et\s+(?:pense|espère|estime|prévoit|compte|devrait|indique|précise|souhaite)\b.*$/iu, '')
    .replace(/,?\s+(?:car|parce que|puisque)\s.*$/iu, '')
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

type Item =
  | { kind: 'decision'; text: string; raisedBy: string | null; topic?: string }
  | { kind: 'action'; text: string; owner: string | null; dueFrom: string; pending?: string }
  | { kind: 'check'; text: string; owner: string | null }
  | { kind: 'info'; text: string }

const RE = {
  reported: new RegExp(String.raw`^${NAME}\s+(?:nous\s+)?(?:${REPORTING})\s+(?:que\s+|qu['’]|:\s*)?(.+)$`, 'u'),
  ownerModal: new RegExp(String.raw`^${NAME}\s+(?:(?:doit|devra|va)\s+|se charge d(?:e\s+|['’])|s['’]engage à|est chargée? d(?:e\s+|['’])|propose d(?:e\s+|['’]))(?!être\b)(.+)$`, 'u'),
  ownerTakes: new RegExp(String.raw`^${NAME}\s+prend en charge\s+(.+)$`, 'u'),
  ownerFuture: new RegExp(String.raw`^${NAME}\s+(\p{Ll}+(?:era|ira|ra))\s+(.+)$`, 'u'),
  waiting: new RegExp(String.raw`^${NAME}\s+(?:attend|est en attente d(?:e\s+|u\s+|es\s+|['’]))\s*(?:toujours\s+|encore\s+)?(.+)$`, 'u'),
  ownerValidates: new RegExp(String.raw`^${NAME}\s+(valide|acte|entérine|retient|approuve)\s+(.+)$`, 'u'),
  decided: /^(?:il\s+(?:est|a été)|c['’]est)\s+(?:décidé|convenu|acté|retenu|validé|arbitré)\s+(?:de\s+|d['’]|que\s+|qu['’])(.+)$/iu,
  passive: new RegExp(String.raw`^(.+?)\s+(?:doit|doivent|devra|devront|va|vont)\s+être\s+${PARTICIPLE}(?![\p{L}])\s*(.*)$|^(.+?)\s+(?:sera|seront|est|sont)\s+${PARTICIPLE}(?![\p{L}])\s*(.*)$`, 'iu'),
  check: /^(?:il\s+(?:faut|faudra|faudrait|convient\s+de|reste\s+à)|reste\s+à|à)\s+(?:également\s+|aussi\s+|encore\s+|d['’]abord\s+)?((?:vérifier|confirmer|contrôler|s['’]assurer|étudier|analyser|clarifier|valider|préciser)(?![\p{L}]).*)$/iu,
  checkLoose: /(?:à vérifier|à confirmer|à valider|à préciser|à clarifier|reste en suspens|point ouvert|non tranché)/iu,
  must: /^(?:il\s+(?:faut|faudra|faudrait|convient\s+de)|reste\s+à)\s+(?:également\s+|aussi\s+)?(.+)$/iu,
}

function isName(candidate: string, roster: Map<string, string>) {
  const first = candidate.split(' ')[0]
  return roster.has(first.toLowerCase()) || !NOT_NAMES.has(first)
}

function classify(clause: string, roster: Map<string, string>, speaker: string | null = null): Item {
  const text = stripTrailingPeriod(clause)
  let m: RegExpExecArray | null

  if ((m = RE.reported.exec(text)) && isName(m[1], roster)) {
    const inner = classify(cap(m[2]), roster, m[1])
    // Une affirmation rapportée qui commence par un prénom (« Jean confirme que Marie doit… ») reste une action.
    return inner
  }

  if ((m = RE.ownerModal.exec(text)) && isName(m[1], roster)) {
    return { kind: 'action', owner: m[1], text: trimActionTail(m[2]), dueFrom: text }
  }
  if ((m = RE.ownerTakes.exec(text)) && isName(m[1], roster)) {
    return { kind: 'action', owner: m[1], text: `prendre en charge ${trimActionTail(m[2])}`, dueFrom: text }
  }
  if ((m = RE.waiting.exec(text)) && isName(m[1], roster)) {
    const object = m[2].split(/,?\s+(?:qui|dont|lesquel\p{L}*|car|mais|afin)\b/u)[0]
    return { kind: 'action', owner: m[1], text: `suivre la réception ${deForm(object)}`, dueFrom: text, pending: object }
  }
  if ((m = RE.ownerValidates.exec(text)) && isName(m[1], roster)) {
    return { kind: 'decision', text: `Validation ${deForm(m[3])}`, raisedBy: m[1] }
  }
  if ((m = RE.ownerFuture.exec(text)) && isName(m[1], roster)) {
    const infinitive = futureToInfinitive(m[2])
    if (infinitive) {
      return { kind: 'action', owner: m[1], text: `${infinitive} ${trimActionTail(m[3])}`, dueFrom: text }
    }
  }

  if ((m = RE.decided.exec(text))) {
    return { kind: 'decision', text: cap(m[1]), raisedBy: speaker }
  }

  if ((m = RE.passive.exec(text))) {
    const subject = (m[1] ?? m[4]).trim()
    const participle = (m[2] ?? m[5]).toLowerCase()
    const rest = (m[3] ?? m[6] ?? '').trim()
    const noun = PARTICIPLES[participle]
    if (noun && subject.split(' ').length <= 10) {
      const topic = `${noun} ${deForm(subject)}`
      const article = FEMININE.has(noun) ? 'la ' : /^[AEIOUÉ]/.test(noun) ? 'l’' : 'le '
      const reason = /^(?:car|parce que|puisque|en raison)\b/iu.test(rest)
      const tail = !rest ? '' : reason ? ` — ${rest.replace(/^(?:car|parce que|puisque)\s+/iu, '')}` : ` ${rest}`
      return { kind: 'decision', text: `${topic}${tail}`, raisedBy: speaker, topic: `${article}${noun.toLowerCase()} ${deForm(subject)}` }
    }
  }

  if ((m = RE.check.exec(text))) {
    return { kind: 'check', text: cap(m[1]), owner: null }
  }
  if (RE.checkLoose.test(text)) {
    return { kind: 'check', text: cap(text), owner: null }
  }
  if ((m = RE.must.exec(text))) {
    return { kind: 'action', owner: null, text: trimActionTail(m[1]), dueFrom: text }
  }

  return { kind: 'info', text: cap(lowerArticle(text)) }
}

// ---------------------------------------------------------------------------
// Synthèse
// ---------------------------------------------------------------------------

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`

function joinFr(items: string[]) {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} et ${items.at(-1)}`
}

function buildSummary(report: Omit<ExtractedReport, 'summary'>): string {
  const lotCount = new Map<Lot, number>()
  for (const item of [...report.decisions, ...report.actions, ...report.checks, ...report.key_infos]) {
    if (item.lot !== 'Général') lotCount.set(item.lot, (lotCount.get(item.lot) ?? 0) + 1)
  }
  const lots = [...lotCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([l]) => l)
  const topics = lots.length ? `Les échanges ont porté principalement sur les lots ${joinFr(lots)}.` : ''

  const dated = report.actions.filter((a) => a.due_date).length
  const parts = [
    plural(report.decisions.length, 'décision actée', 'décisions actées'),
    plural(report.actions.length, 'action engagée', 'actions engagées') +
      (dated ? ` (dont ${dated} avec échéance)` : ''),
    plural(report.checks.length, 'point restant à vérifier', 'points restant à vérifier'),
  ]
  const first = report.decisions[0]
  const highlight = first ? ` Point marquant : ${first.text.charAt(0).toLowerCase()}${first.text.slice(1)}` : ''

  return `${topics} La réunion se conclut sur ${joinFr(parts)}.${highlight}`.trim()
}

// ---------------------------------------------------------------------------
// Point d'entrée
// ---------------------------------------------------------------------------

export function extractReport(req: ExtractionRequest): ExtractedReport {
  const refDate = req.meeting.date
  const roster = new Map<string, string>()
  for (const p of req.meeting.participants) roster.set(p.name.split(' ')[0].toLowerCase(), p.name)

  const decisions: ExtractedReport['decisions'] = []
  const actions: ExtractedReport['actions'] = []
  const checks: ExtractedReport['checks'] = []
  const infos: ExtractedReport['key_infos'] = []
  let lastTopic: string | null = null

  for (const clause of splitNotes(req.notes)) {
    const item = classify(clause.text, roster)
    const source = clause.text

    switch (item.kind) {
      case 'decision': {
        const text = finish(item.text)
        decisions.push({ text, lot: detectLot(source, clause.context), raised_by: item.raisedBy, source_excerpt: source })
        if (item.topic) lastTopic = item.topic
        break
      }
      case 'action': {
        const due = findDue(item.dueFrom, refDate)
        const label = cap(stripTrailingPeriod(stripDue(item.text, refDate)).replace(/^(?:toujours|aussi|également)\s+/iu, ''))
        actions.push({
          text: cap(label),
          owner: item.owner,
          due_date: due?.date ?? null,
          due_hint: due?.hint ?? null,
          lot: detectLot(source, clause.context),
          source_excerpt: source,
        })
        // Une attente de livrable est aussi une information utile au lecteur.
        if (item.pending) {
          infos.push({
            text: finish(`${cap(lowerArticle(item.pending))} : toujours en attente${due ? `, arrivée annoncée ${due.hint}` : ''}`),
            lot: detectLot(source, clause.context),
            source_excerpt: source,
          })
        }
        break
      }
      case 'check': {
        // Résolution simple de la coréférence « cette modification » → dernière décision.
        const text = lastTopic
          ? item.text.replace(/\bcette (?:modification|évolution|variante|décision)\b/iu, lastTopic)
          : item.text
        checks.push({ text: finish(text), lot: detectLot(source, clause.context), owner: item.owner, source_excerpt: source })
        break
      }
      case 'info':
        if (item.text.length >= 12) {
          infos.push({ text: finish(item.text), lot: detectLot(source, clause.context), source_excerpt: source })
        }
        break
    }
  }

  const partial = { decisions, actions, checks, key_infos: infos }
  return { summary: buildSummary(partial), ...partial }
}
