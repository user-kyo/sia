import api from '../../../lib/axios'

export const fetchProcurements = async ({ status } = {}) => {
  const p = new URLSearchParams()
  if (status) p.set('status_filter', status)
  const { data } = await api.get(`/procurements?${p.toString()}`)
  return data
}

export const createProcurement = async (procurement) => {
  const { data } = await api.post('/procurements', procurement)
  return data
}

export const updateProcurementStatus = async ({ id, status, reason }) => {
  const p = new URLSearchParams({ new_status: status })
  if (reason) p.set('reason', reason)
  const { data } = await api.put(`/procurements/${id}/status?${p.toString()}`)
  return data
}
