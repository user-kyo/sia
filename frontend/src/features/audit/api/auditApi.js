import api from '../../../lib/axios'

export const AUDIT_LOGS_QUERY_KEY = ['audit-logs']

export const fetchAuditLogs = async ({ search, action, module, days, limit } = {}) => {
  const p = new URLSearchParams()
  if (search) p.set('search', search)
  if (action) p.set('action', action)
  if (module) p.set('module', module)
  if (days) p.set('days', String(days))
  if (limit) p.set('limit', String(limit))
  const { data } = await api.get(`/audit-logs?${p.toString()}`)
  return data
}

const looksLikeChangeList = (text = '') => /→|->/.test(text)

// Returns the list of change strings for a log. Prefers the structured
// `changes` column; falls back to parsing legacy descriptions that embedded
// the diff after a ": " separator (e.g. "Updated product X: cost 750 → 850").
export const getAuditChanges = (log) => {
  if (Array.isArray(log?.changes) && log.changes.length) return log.changes
  const desc = log?.description || ''
  const idx = desc.indexOf(': ')
  if (idx > -1 && looksLikeChangeList(desc.slice(idx))) {
    return desc.slice(idx + 2).split(', ').filter(Boolean)
  }
  return []
}

// Returns the description without any embedded diff (so the Description column
// stays clean). The diff may be appended to the description as a fallback for
// when the structured `changes` column isn't available, so we always strip it.
export const getAuditDescription = (log) => {
  const desc = log?.description || ''
  const idx = desc.indexOf(': ')
  if (idx > -1 && looksLikeChangeList(desc.slice(idx))) {
    return desc.slice(0, idx)
  }
  return desc
}

export const deleteAuditLog = async (id) => {
  await api.delete(`/audit-logs/${id}`)
}

export const clearAuditLogs = async ({ days } = {}) => {
  const p = new URLSearchParams()
  if (days) p.set('days', String(days))
  const qs = p.toString()
  await api.delete(`/audit-logs/clear${qs ? `?${qs}` : ''}`)
}
