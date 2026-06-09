import api from '../../../lib/axios'

const buildQS = (params) => {
  const p = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, v)
  })
  return p.toString()
}

export const fetchInventory = async ({
  search, category, stockStatus, minPrice, maxPrice,
  sortBy, sortOrder, offset = 0, limit = 20,
}) => {
  const qs = buildQS({
    search, category,
    stock_status: stockStatus,
    min_price: minPrice,
    max_price: maxPrice,
    sort_by: sortBy,
    sort_order: sortOrder,
    offset,
    limit,
  })
  const { data } = await api.get(`/inventory?${qs}`)
  return data
}

export const createProduct = async (product) => {
  const { data } = await api.post('/inventory', product)
  return data
}

export const updateProduct = async ({ id, ...product }) => {
  const { data } = await api.put(`/inventory/${id}`, product)
  return data
}

export const deleteProduct = async (id) => {
  await api.delete(`/inventory/${id}`)
}

export const adjustStock = async ({ id, ...adjustment }) => {
  const { data } = await api.post(`/inventory/${id}/adjust-stock`, adjustment)
  return data
}

export const fetchCategories = async () => {
  const { data } = await api.get('/categories')
  return data
}
