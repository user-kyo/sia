import api from '../../../lib/axios'

export const SALES_TRANSACTIONS_QUERY_KEY = ['dashboard-sales-transactions']

const buildQS = (params) => {
  const p = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') p.set(key, value)
  })
  return p.toString()
}

export const fetchSalesTransactions = async ({ limit = 6, offset = 0, summaryFrom, summaryTo } = {}) => {
  const qs = buildQS({ limit, offset, summary_from: summaryFrom, summary_to: summaryTo })
  const { data } = await api.get(`/sales-transactions?${qs}`)
  return data
}

export const createSalesTransaction = async (transaction) => {
  const { data } = await api.post('/sales-transactions', transaction)
  return data
}
