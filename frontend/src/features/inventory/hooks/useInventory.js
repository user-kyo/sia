import { useEffect } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import {
  fetchInventory, createProduct, updateProduct,
  deleteProduct, adjustStock, fetchCategories, uploadProductImage, fetchUnits
} from '../api/inventoryApi'

const LIMIT = 20

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

export const useCategories = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 5,
  })

export const useUnits = () =>
  useQuery({
    queryKey: ['units'],
    queryFn: fetchUnits,
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

export const useUploadProductImage = () => {
  return useMutation({
    mutationFn: uploadProductImage,
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
