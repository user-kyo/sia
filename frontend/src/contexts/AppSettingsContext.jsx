import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import translations from '../lib/translations'

const DEFAULTS = {
  // Business Info
  storeName:           'My Store',
  storeAddress:        '123 Main Street, City',
  storePhone:          '+63 912 345 6789',

  // Tax
  taxRate:             12,
  taxEnabled:          true,

  // Inventory defaults
  defaultReorderPoint: 10,

  // Date/Time
  dateFormat:          'MM/DD/YYYY',
  timeFormat:          '12h',

  // Readability
  fontSize:            'medium',   // 'small' | 'medium' | 'large'
  tableDensity:        'default',  // 'compact' | 'default' | 'comfortable'
  language:            'en',       // 'en' | 'fil'
  highContrast:        false,
}

const FONT_SIZES = { small: '13px', medium: '15px', large: '17px' }

function load() {
  try {
    const raw = localStorage.getItem('sia_app_settings')
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }
  } catch {
    return { ...DEFAULTS }
  }
}

const AppSettingsContext = createContext(null)

export function AppSettingsProvider({ children }) {
  const [settings, setSettings] = useState(load)

  // Apply font size to <html>
  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZES[settings.fontSize] || FONT_SIZES.medium
  }, [settings.fontSize])

  // Apply high contrast class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', settings.highContrast)
  }, [settings.highContrast])

  const updateSettings = useCallback((patch) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      localStorage.setItem('sia_app_settings', JSON.stringify(next))
      return next
    })
  }, [])

  /** t(key, vars?) — translate a key in the current language */
  const t = useCallback((key, vars = {}) => {
    const lang = translations[settings.language] || translations.en
    let str = lang[key] ?? translations.en[key] ?? key
    Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, v) })
    return str
  }, [settings.language])

  /** Format a Date using the user's chosen date/time format */
  const formatDate = useCallback((value) => {
    const d = value instanceof Date ? value : new Date(value)
    if (isNaN(d)) return '—'
    const pad = (n) => String(n).padStart(2, '0')
    const y = d.getFullYear(), m = pad(d.getMonth() + 1), day = pad(d.getDate())

    let datePart
    if (settings.dateFormat === 'DD/MM/YYYY')      datePart = `${day}/${m}/${y}`
    else if (settings.dateFormat === 'YYYY-MM-DD') datePart = `${y}-${m}-${day}`
    else                                            datePart = `${m}/${day}/${y}`

    let h = d.getHours(), min = pad(d.getMinutes())
    const timePart = settings.timeFormat === '24h'
      ? `${pad(h)}:${min}`
      : `${h % 12 || 12}:${min} ${h >= 12 ? 'PM' : 'AM'}`

    return `${datePart} ${timePart}`
  }, [settings.dateFormat, settings.timeFormat])

  return (
    <AppSettingsContext.Provider value={{ settings, updateSettings, t, formatDate }}>
      {children}
    </AppSettingsContext.Provider>
  )
}

export const useAppSettings = () => useContext(AppSettingsContext)
