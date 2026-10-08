import type { ActionItem, CheckPoint, Decision, KeyInfo, Report } from '../domain/types.ts'
import { uid } from '../lib/report.ts'

export type ReportEvent =
  | { type: 'load'; report: Report | null }
  | { type: 'summary'; text: string }
  | { type: 'title'; text: string }
  | { type: 'action.update'; id: string; patch: Partial<ActionItem> }
  | { type: 'action.add' }
  | { type: 'action.remove'; id: string }
  | { type: 'decision.update'; id: string; patch: Partial<Decision> }
  | { type: 'decision.remove'; id: string }
  | { type: 'check.update'; id: string; patch: Partial<CheckPoint> }
  | { type: 'check.remove'; id: string }
  | { type: 'check.promote'; id: string }
  | { type: 'info.update'; id: string; patch: Partial<KeyInfo> }
  | { type: 'info.remove'; id: string }

const patchIn = <T extends { id: string }>(list: T[], id: string, patch: Partial<T>) =>
  list.map((item) => (item.id === id ? { ...item, ...patch } : item))

export function reportReducer(state: Report | null, event: ReportEvent): Report | null {
  if (event.type === 'load') return event.report
  if (!state) return state

  switch (event.type) {
    case 'summary':
      return { ...state, summary: event.text }
    case 'title':
      return { ...state, meta: { ...state.meta, title: event.text } }
    case 'action.update':
      return { ...state, actions: patchIn(state.actions, event.id, event.patch) }
    case 'action.add':
      return {
        ...state,
        actions: [
          ...state.actions,
          { id: uid(), text: '', owner: null, dueDate: null, dueHint: null, lot: 'Général', done: false, source: 'Ajout manuel' },
        ],
      }
    case 'action.remove':
      return { ...state, actions: state.actions.filter((a) => a.id !== event.id) }
    case 'decision.update':
      return { ...state, decisions: patchIn(state.decisions, event.id, event.patch) }
    case 'decision.remove':
      return { ...state, decisions: state.decisions.filter((d) => d.id !== event.id) }
    case 'check.update':
      return { ...state, checks: patchIn(state.checks, event.id, event.patch) }
    case 'check.remove':
      return { ...state, checks: state.checks.filter((c) => c.id !== event.id) }
    case 'check.promote': {
      const check = state.checks.find((c) => c.id === event.id)
      if (!check) return state
      const action: ActionItem = {
        id: uid(),
        text: check.text.replace(/\.$/, ''),
        owner: check.owner,
        dueDate: null,
        dueHint: null,
        lot: check.lot,
        done: false,
        source: check.source,
      }
      return { ...state, checks: state.checks.filter((c) => c.id !== event.id), actions: [...state.actions, action] }
    }
    case 'info.update':
      return { ...state, infos: patchIn(state.infos, event.id, event.patch) }
    case 'info.remove':
      return { ...state, infos: state.infos.filter((i) => i.id !== event.id) }
  }
}
