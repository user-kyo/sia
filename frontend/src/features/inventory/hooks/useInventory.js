import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchInventory, createProduct, updateProduct,
  deleteProduct, adjustStock, fetchCategories,
} from '../api/inventoryApi'

const LIMIT = 20

export const useInventory = (filters = {}) =>
  useInfiniteQuery({
    queryKey: ['inventory', filters],
    queryFn: ({ pageParam = 0 }) =>
      fetchInventory({ ...filters, offset: pageParam, limit: LIMIT }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const fetched = pages.reduce((acc, p) => acc + p.data.length, 0)
      return fetched < lastPage.total ? fetched : undefined
    },
  })

export const useCategories = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 5,
  })

export const useCreateProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export const useUpdateProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })
}

export const useDeleteProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })
}

export const useAdjustStock = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adjustStock,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })
}
