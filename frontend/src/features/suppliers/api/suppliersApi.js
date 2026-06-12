import api from '../../../lib/axios'

export const fetchSuppliers = async ({ search, status, includeDeleted = false } = {}) => {
  const p = new URLSearchParams()
  if (search) p.set('search', search)
  if (status) p.set('status_filter', status)
  if (includeDeleted) p.set('include_deleted', 'true')
  const { data } = await api.get(`/suppliers?${p.toString()}`)
  return data
}

export const createSupplier = async (supplier) => {
  const { data } = await api.post('/suppliers', supplier)
  return data
}

export const updateSupplier = async ({ id, ...supplier }) => {
  const { data } = await api.put(`/suppliers/${id}`, supplier)
  return data
}

export const deleteSupplier = async (id) => {
  await api.delete(`/suppliers/${id}`)
}
