import { createContext, useContext, useState, useEffect, useCallback } from 'react'

export const CURRENCIES = [
  { code: 'PHP', label: 'Philippine Peso',  symbol: '₱',  locale: 'en-PH' },
  { code: 'USD', label: 'US Dollar',        symbol: '$',  locale: 'en-US' },
  { code: 'EUR', label: 'Euro',             symbol: '€',  locale: 'en-IE' },
  { code: 'GBP', label: 'British Pound',    symbol: '£',  locale: 'en-GB' },
  { code: 'JPY', label: 'Japanese Yen',     symbol: '¥',  locale: 'ja-JP' },
  { code: 'SGD', label: 'Singapore Dollar', symbol: 'S$', locale: 'en-SG' },
]

const RATES_CACHE_KEY = 'sia_rates_v3'
const RATES_TTL = 60 * 60 * 1000 // 1 hour

/**
 * Fallback USD-based rates: 1 USD = X units of currency.
 * Used when the Frankfurter API is unreachable and no cache exists.
 */
const FALLBACK = {
  USD: 1, PHP: 57.23, EUR: 0.9195, GBP: 0.7895, JPY: 155.7, SGD: 1.352,
}

function readCache() {
  try {
    const raw = localStorage.getItem(RATES_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.rates && parsed?.timestamp) return parsed
  } catch {}
  return null
}

async function fetchRatesFromAPI() {
  const res = await fetch('https://api.frankfurter.app/latest?from=USD')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  // Frankfurter omits USD from the response when USD is the base — add it back
  return { USD: 1, ...data.rates }
}

const CurrencyContext = createContext(null)

export function CurrencyProvider({ children }) {
  const [code, setCode] = useState(() => localStorage.getItem('sia_currency') || 'PHP')

  // Seed state from cache; fall back to built-in approximations so conversion
  // works immediately on first render (before the async fetch resolves).
  const cached = readCache()
  const [rates, setRates] = useState(cached?.rates ?? FALLBACK)
  const [ratesTs, setRatesTs] = useState(cached?.timestamp ?? null)
  const [ratesError, setRatesError] = useState(false)
  const [usingFallback, setUsingFallback] = useState(!cached)

  useEffect(() => {
    const c = readCache()
    if (c && Date.now() - c.timestamp < RATES_TTL) {
      setUsingFallback(false)
      return
    }
    fetchRatesFromAPI()
      .then(r => {
        const ts = Date.now()
        setRates(r)
        setRatesTs(ts)
        setRatesError(false)
        setUsingFallback(false)
        localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({ rates: r, timestamp: ts }))
      })
      .catch(() => setRatesError(true))
  }, [])

  const setCurrency = (newCode) => {
    setCode(newCode)
    localStorage.setItem('sia_currency', newCode)
  }

  const current = CURRENCIES.find(c => c.code === code) || CURRENCIES[0]

  /**
   * Convert `amount` from one currency to another using USD as a universal pivot.
   *
   *   amount_in_USD  = amount / rates[fromCode]
   *   result         = amount_in_USD * rates[toCode]
   *
   * Returns the amount unchanged when fromCode === toCode.
   */
  const convertAmount = useCallback((amount, fromCode, toCode) => {
    if (!fromCode || fromCode === toCode) return Number(amount) || 0
    const fromRate = rates[fromCode] ?? 1
    const toRate   = rates[toCode]   ?? 1
    return ((Number(amount) || 0) / fromRate) * toRate
  }, [rates])

  /**
   * Format `amount` in `displayCode` currency as-is — no conversion.
   * Use this to render a product's native/stored price.
   */
  const formatAs = useCallback((amount, displayCode) => {
    const cur = CURRENCIES.find(c => c.code === displayCode) || CURRENCIES[0]
    return new Intl.NumberFormat(cur.locale, {
      style: 'currency',
      currency: cur.code,
      minimumFractionDigits: cur.code === 'JPY' ? 0 : 2,
    }).format(Number(amount) || 0)
  }, [])

  /**
   * Format `amount` that is stored in `fromCode` currency, displayed in the
   * current store display currency.  If `fromCode` is omitted or matches the
   * display currency, no conversion is applied.
   */
  const formatPrice = useCallback((amount, fromCode = code) => {
    const converted = fromCode === code
      ? (Number(amount) || 0)
      : convertAmount(amount, fromCode, code)
    return new Intl.NumberFormat(current.locale, {
      style: 'currency',
      currency: current.code,
      minimumFractionDigits: current.code === 'JPY' ? 0 : 2,
    }).format(converted)
  }, [code, current, convertAmount])

  const ratesAge = useCallback(() => {
    if (usingFallback || !ratesTs) return null
    const mins = Math.floor((Date.now() - ratesTs) / 60000)
    if (mins < 1)  return 'just now'
    if (mins < 60) return `${mins} min ago`
    const hrs = Math.floor(mins / 60)
    return `${hrs} hr${hrs > 1 ? 's' : ''} ago`
  }, [ratesTs, usingFallback])

  return (
    <CurrencyContext.Provider value={{
      code, current, setCurrency, currencies: CURRENCIES,
      convertAmount, formatPrice, formatAs,
      rates, ratesAge, ratesError, usingFallback,
    }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)
