import { useEffect } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import {
  fetchInventory, createProduct, updateProduct,
  deleteProduct, adjustStock, fetchCategories, createCategory, updateCategory, deleteCategory, uploadProductImage, fetchBrands
} from '../api/inventoryApi'

const LIMIT = 20

const invalidateInventoryViews = (qc) => {
  qc.invalidateQueries({ queryKey: ['inventory'] })
  qc.invalidateQueries({ queryKey: ['inventory-paginated'] })
}

export const useInventorySubscription = () => {
  const qc = useQueryClient()
  
  useEffect(() => {
    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory' },
        (payload) => {
          console.log('Realtime change received:', payload)
          qc.invalidateQueries({ queryKey: ['inventory'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])
}

export const useInventory = (filters = {}, options = {}) =>
  useInfiniteQuery({
    queryKey: ['inventory', filters],
    queryFn: ({ pageParam = 0 }) =>
      fetchInventory({ ...filters, offset: pageParam, limit: LIMIT }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const fetched = pages.reduce((acc, p) => acc + p.data.length, 0)
      return fetched < lastPage.total ? fetched : undefined
    },
    ...options,
  })

export const useInventoryPaginated = (filters = {}, page = 1, limit = 10, options = {}) =>
  useQuery({
    queryKey: ['inventory-paginated', filters, page, limit],
    queryFn: () => fetchInventory({ ...filters, offset: (page - 1) * limit, limit }),
    ...options,
  })

export const useCategories = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 5,
  })

export const useCreateCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export const useUpdateCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      invalidateInventoryViews(qc)
    },
  })
}

export const useDeleteCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      invalidateInventoryViews(qc)
    },
  })
}

export const useBrands = () =>
  useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
    staleTime: 1000 * 60 * 5,
  })

export const useCreateProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      invalidateInventoryViews(qc)
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export const useUploadProductImage = () => {
  return useMutation({
    mutationFn: uploadProductImage,
  })
}

export const useUpdateProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      invalidateInventoryViews(qc)
      qc.invalidateQueries({ queryKey: ['notification-inventory'] })
    },
  })
}

export const useDeleteProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => invalidateInventoryViews(qc),
  })
}

export const useAdjustStock = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adjustStock,
    onSuccess: () => {
      invalidateInventoryViews(qc)
      qc.invalidateQueries({ queryKey: ['notification-inventory'] })
    },
  })
}
