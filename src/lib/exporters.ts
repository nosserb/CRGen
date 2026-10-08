import type { Project, Report } from '../domain/types.ts'
import { formatLong, formatNumeric } from './dates.ts'

const owner = (o: string | null) => o ?? 'À attribuer'
const due = (d: string | null, hint: string | null) => (d ? formatNumeric(d) : hint ?? '—')

function attendees(report: Report, project: Project) {
  return project.participants
    .filter((p) => report.meta.participantIds.includes(p.id))
    .map((p) => `${p.name} (${p.role})`)
}

export function toPlainText(report: Report, project: Project): string {
  const lines: string[] = []
  const rule = '—'.repeat(48)
  lines.push(`COMPTE-RENDU DE RÉUNION — ${report.reference}`)
  lines.push(report.meta.title || 'Réunion')
  lines.push(`${project.name} · ${project.scope} · Phase ${project.phase}`)
  lines.push(`Date : ${formatLong(report.meta.date)}`)
  const people = attendees(report, project)
  if (people.length) lines.push(`Participants : ${people.join(', ')}`)
  lines.push(rule, '', 'RÉSUMÉ', report.summary, '')

  lines.push('DÉCISIONS')
  if (!report.decisions.length) lines.push('Aucune décision.')
  report.decisions.forEach((d, i) => lines.push(`D${i + 1}. ${d.text}`))
  lines.push('')

  lines.push('ACTIONS')
  if (!report.actions.length) lines.push('Aucune action.')
  report.actions.forEach((a, i) =>
    lines.push(`${a.done ? '[x]' : '[ ]'} A${i + 1}. ${a.text} — ${owner(a.owner)} — échéance : ${due(a.dueDate, a.dueHint)}`),
  )
  lines.push('')

  lines.push('POINTS À VÉRIFIER')
  if (!report.checks.length) lines.push('Aucun point en suspens.')
  report.checks.forEach((c) => lines.push(`• ${c.text}${c.owner ? ` (${c.owner})` : ''}`))
  lines.push('')

  lines.push('INFORMATIONS IMPORTANTES')
  if (!report.infos.length) lines.push('—')
  report.infos.forEach((n) => lines.push(`• ${n.text}`))
  lines.push('', rule, 'Document de travail — à relire avant diffusion. Données de démonstration fictives.')
  return lines.join('\n')
}

const esc = (s: string) => s.replace(/[|]/g, '\\|')

export function toMarkdown(report: Report, project: Project): string {
  const md: string[] = []
  md.push(`# ${report.meta.title || 'Compte-rendu de réunion'}`)
  md.push('')
  md.push(`**Référence** : ${report.reference}  `)
  md.push(`**Projet** : ${project.name} — ${project.scope} (phase ${project.phase})  `)
  md.push(`**Date** : ${formatLong(report.meta.date)}  `)
  const people = attendees(report, project)
  if (people.length) md.push(`**Participants** : ${people.join(', ')}`)
  md.push('', '## Résumé', '', report.summary, '', '## Décisions', '')
  report.decisions.forEach((d, i) => md.push(`${i + 1}. ${d.text}`))
  if (!report.decisions.length) md.push('_Aucune décision._')
  md.push('', '## Actions', '', '| | Action | Lot | Responsable | Échéance |', '|---|---|---|---|---|')
  report.actions.forEach((a) =>
    md.push(`| ${a.done ? '✓' : ''} | ${esc(a.text)} | ${a.lot} | ${owner(a.owner)} | ${due(a.dueDate, a.dueHint)} |`),
  )
  md.push('', '## Points à vérifier', '')
  report.checks.forEach((c) => md.push(`- ${c.text}`))
  if (!report.checks.length) md.push('_Aucun point en suspens._')
  md.push('', '## Informations importantes', '')
  report.infos.forEach((n) => md.push(`- ${n.text}`))
  md.push('', '---', '_Document de travail — données de démonstration fictives._')
  return md.join('\n')
}

const h = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** HTML sobre, pensé pour être collé dans un e-mail ou un traitement de texte. */
export function toHtml(report: Report, project: Project): string {
  const cell = 'padding:6px 10px;border-bottom:1px solid #e6e3de;text-align:left;vertical-align:top;'
  const head = `${cell}font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#6b6b6b;`
  const sec = (t: string) =>
    `<h3 style="font:700 12px Lato,Arial,sans-serif;text-transform:uppercase;letter-spacing:.12em;color:#79146a;margin:22px 0 8px">${t}</h3>`
  const list = (items: string[]) =>
    items.length ? `<ul style="margin:0;padding-left:18px">${items.map((i) => `<li>${h(i)}</li>`).join('')}</ul>` : '<p>—</p>'

  return `<div style="font:14px/1.55 Lato,Arial,sans-serif;color:#1e1e1e">
<p style="margin:0;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#79146a">Compte-rendu · ${h(report.reference)}</p>
<h2 style="margin:4px 0 2px;font:600 22px Georgia,serif">${h(report.meta.title || 'Réunion')}</h2>
<p style="margin:0;color:#444">${h(project.name)} — ${h(project.scope)} · Phase ${h(project.phase)} · ${h(formatLong(report.meta.date))}</p>
${sec('Résumé')}<p style="margin:0">${h(report.summary)}</p>
${sec('Décisions')}${report.decisions.length ? `<ol style="margin:0;padding-left:18px">${report.decisions.map((d) => `<li>${h(d.text)}</li>`).join('')}</ol>` : '<p>—</p>'}
${sec('Actions')}<table style="border-collapse:collapse;width:100%"><thead><tr><th style="${head}">Action</th><th style="${head}">Responsable</th><th style="${head}">Échéance</th><th style="${head}">Statut</th></tr></thead><tbody>
${report.actions.map((a) => `<tr><td style="${cell}">${h(a.text)}</td><td style="${cell}">${h(owner(a.owner))}</td><td style="${cell}">${h(due(a.dueDate, a.dueHint))}</td><td style="${cell}">${a.done ? 'Réalisée' : 'À faire'}</td></tr>`).join('')}
</tbody></table>
${sec('Points à vérifier')}${list(report.checks.map((c) => c.text))}
${sec('Informations importantes')}${list(report.infos.map((n) => n.text))}
</div>`
}

export function download(filename: string, content: string, type = 'text/markdown;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function copyRich(text: string, html: string) {
  if ('ClipboardItem' in window && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': new Blob([text], { type: 'text/plain' }),
        'text/html': new Blob([html], { type: 'text/html' }),
      }),
    ])
    return
  }
  await navigator.clipboard.writeText(text)
}
