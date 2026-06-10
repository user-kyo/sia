import api from '../../../lib/axios'

const buildQS = (params) => {
  const p = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, v)
  })
  return p.toString()
}

export const fetchInventory = async ({
  search, category, brand, stockStatus, minPrice, maxPrice,
  sortBy, sortOrder, hasImage, offset = 0, limit = 20,
}) => {
  const qs = buildQS({
    search, category, brand,
    has_image: hasImage,
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

export const uploadProductImage = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post('/inventory/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

export const adjustStock = async ({ id, ...adjustment }) => {
  const { data } = await api.post(`/inventory/${id}/adjust-stock`, adjustment)
  return data
}

export const fetchCategories = async () => {
  const { data } = await api.get('/categories')
  return data
}

export const createCategory = async (categoryData) => {
  const { data } = await api.post('/categories', categoryData)
  return data
}

export const fetchBrands = async () => {
  const { data } = await api.get('/brands')
  return data
}
