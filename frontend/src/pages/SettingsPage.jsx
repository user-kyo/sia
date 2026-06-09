import React, { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useCurrency, CURRENCIES } from '../contexts/CurrencyContext'
import { useAppSettings } from '../contexts/AppSettingsContext'
import { useToast } from '../components/ui/Toast'
import { Moon, Sun, Store, Package, Clock, Type, LayoutList, Globe, Contrast, DollarSign, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SectionSkeleton } from '../components/ui/Skeletons'

const DATE_FORMATS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']

/* ── reusable section shell ───────────────────────────────── */
function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] flex items-center gap-3">
        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
          <Icon size={18} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

const inputCls = 'w-full px-3 py-2.5 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all'
const labelCls = 'block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { code, setCurrency } = useCurrency()
  const { settings, updateSettings, t } = useAppSettings()
  const toast = useToast()

  const [isLoading, setIsLoading] = useState(true)
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const [biz, setBiz] = useState({
    storeName:    settings.storeName,
    storeAddress: settings.storeAddress,
    storePhone:   settings.storePhone,
  })
  const [bizSaved, setBizSaved] = useState(false)
  const saveBiz = () => {
    updateSettings(biz)
    setBizSaved(true)
    setTimeout(() => setBizSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('set_title')}</h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{t('set_subtitle')}</p>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <SectionSkeleton key="skeleton-settings" count={3} />
        ) : (
          <motion.div 
            key="content-settings"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-6"
          >

      {/* ── 1. Business Info ───────────────────────────────── */}
      <Section icon={Store} title={t('set_biz_title')} subtitle={t('set_biz_sub')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>{t('set_biz_name')}</label>
            <input
              className={inputCls}
              value={biz.storeName}
              onChange={e => setBiz(b => ({ ...b, storeName: e.target.value }))}
              placeholder="e.g. Ppen's Store"
            />
          </div>
          <div>
            <label className={labelCls}>{t('set_biz_addr')}</label>
            <input
              className={inputCls}
              value={biz.storeAddress}
              onChange={e => setBiz(b => ({ ...b, storeAddress: e.target.value }))}
              placeholder="e.g. 123 Rizal St, Manila"
            />
          </div>
          <div>
            <label className={labelCls}>{t('set_biz_phone')}</label>
            <input
              className={inputCls}
              value={biz.storePhone}
              onChange={e => setBiz(b => ({ ...b, storePhone: e.target.value }))}
              placeholder="e.g. +63 912 345 6789"
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={saveBiz}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white transition-colors shadow-[0_4px_14px_0_rgba(99,102,241,0.2)]"
          >
            {bizSaved ? t('set_saved') : t('set_save')}
          </button>
        </div>
      </Section>

      {/* ── 2. Default Reorder Point ───────────────────────── */}
      <Section icon={Package} title={t('set_reorder_title')} subtitle={t('set_reorder_sub')}>
        <div className="w-48">
          <label className={labelCls}>{t('set_reorder_label')}</label>
          <input
            type="number"
            min="0"
            value={settings.defaultReorderPoint}
            onChange={e => updateSettings({ defaultReorderPoint: parseInt(e.target.value) || 0 })}
            className={inputCls}
          />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
            {t('set_reorder_hint')}
          </p>
        </div>
      </Section>

      {/* ── 3. Date & Time Format ──────────────────────────── */}
      <Section icon={Clock} title={t('set_dt_title')} subtitle={t('set_dt_sub')}>
        <div className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-3">{t('set_dt_date')}</label>
            <div className="flex flex-wrap gap-2">
              {DATE_FORMATS.map(fmt => (
                <button
                  key={fmt}
                  onClick={() => updateSettings({ dateFormat: fmt })}
                  className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                    settings.dateFormat === fmt
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-3">{t('set_dt_time')}</label>
            <div className="flex gap-2">
              {[{ val: '12h', key: 'set_dt_12h' }, { val: '24h', key: 'set_dt_24h' }].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => updateSettings({ timeFormat: opt.val })}
                  className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                    settings.timeFormat === opt.val
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  {t(opt.key)}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-1 border-t border-slate-100 dark:border-white/10">
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
              {t('set_dt_preview')} <span className="font-semibold text-slate-600 dark:text-slate-300">
                {new Intl.DateTimeFormat('en', {
                  month: '2-digit', day: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                  hour12: settings.timeFormat === '12h',
                }).format(new Date())}
              </span>
            </p>
          </div>
        </div>
      </Section>

      {/* ── Font Size ──────────────────────────────────────── */}
      <Section icon={Type} title={t('set_font_title')} subtitle={t('set_font_sub')}>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-3">{t('set_font_label')}</label>
        <div className="flex gap-3">
          {[
            { val: 'small',   key: 'set_font_small',  sample: 'text-xs'   },
            { val: 'medium',  key: 'set_font_medium', sample: 'text-sm'   },
            { val: 'large',   key: 'set_font_large',  sample: 'text-base' },
          ].map(({ val, key, sample }) => (
            <button
              key={val}
              onClick={() => updateSettings({ fontSize: val })}
              className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all ${
                settings.fontSize === val
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                  : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
              }`}
            >
              <span className={`font-bold ${sample} ${settings.fontSize === val ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>Aa</span>
              <span className={`text-xs font-semibold ${settings.fontSize === val ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>{t(key)}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* ── Table Density ──────────────────────────────────── */}
      <Section icon={LayoutList} title={t('set_density_title')} subtitle={t('set_density_sub')}>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-3">{t('set_density_label')}</label>
        <div className="flex gap-3">
          {[
            { val: 'compact',     labelKey: 'set_compact',     descKey: 'set_compact_desc',     rows: 4 },
            { val: 'default',     labelKey: 'set_default',     descKey: 'set_default_desc',     rows: 3 },
            { val: 'comfortable', labelKey: 'set_comfortable', descKey: 'set_comfortable_desc', rows: 2 },
          ].map(({ val, labelKey, descKey, rows }) => (
            <button
              key={val}
              onClick={() => updateSettings({ tableDensity: val })}
              className={`flex-1 py-4 px-3 rounded-xl border-2 transition-all text-left ${
                settings.tableDensity === val
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                  : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
              }`}
            >
              <div className={`text-sm font-semibold mb-1 ${settings.tableDensity === val ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>{t(labelKey)}</div>
              <div className={`text-xs ${settings.tableDensity === val ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>{t(descKey)}</div>
              <div className={`mt-2.5 space-y-1 ${settings.tableDensity === val ? 'opacity-100' : 'opacity-40'}`}>
                {[...Array(rows)].map((_, i) => (
                  <div key={i} className="h-1.5 bg-indigo-300 dark:bg-indigo-500/40 rounded-full w-full" />
                ))}
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* ── Language ───────────────────────────────────────── */}
      <Section icon={Globe} title={t('set_lang_title')} subtitle={t('set_lang_sub')}>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-3">{t('set_lang_label')}</label>
        <div className="flex gap-3">
          {[
            { val: 'en',  label: 'English',  flag: '🇺🇸', note: 'Default' },
            { val: 'fil', label: 'Filipino', flag: '🇵🇭', note: 'Tagalog' },
          ].map(({ val, label, flag, note }) => (
            <button
              key={val}
              onClick={() => updateSettings({ language: val })}
              className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                settings.language === val
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                  : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
              }`}
            >
              <span className="text-2xl">{flag}</span>
              <div className="text-left">
                <div className={`text-sm font-semibold ${settings.language === val ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>{label}</div>
                <div className={`text-xs mt-0.5 ${settings.language === val ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>{note}</div>
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* ── High Contrast ──────────────────────────────────── */}
      <Section icon={Contrast} title={t('set_hc_title')} subtitle={t('set_hc_sub')}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('set_hc_label')}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('set_hc_desc')}</p>
          </div>
          <button
            onClick={() => updateSettings({ highContrast: !settings.highContrast })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.highContrast ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-white/10'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings.highContrast ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        {settings.highContrast && (
          <p className="mt-3 text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-lg px-3 py-2">
            {t('set_hc_active')}
          </p>
        )}
      </Section>

      {/* ── Appearance ─────────────────────────────────────── */}
      <Section icon={Sun} title={t('set_appear_title')} subtitle={t('set_appear_sub')}>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-3">{t('set_appear_label')}</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { val: 'light', labelKey: 'set_light', descKey: 'set_light_desc', Icon: Sun  },
            { val: 'dark',  labelKey: 'set_dark',  descKey: 'set_dark_desc',  Icon: Moon },
          ].map(({ val, labelKey, descKey, Icon: TIcon }) => (
            <button
              key={val}
              onClick={() => setTheme(val)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${theme === val ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-white/[0.02]'}`}
            >
              <div className={`p-2 rounded-lg ${theme === val ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'}`}>
                <TIcon size={20} />
              </div>
              <div className="text-left">
                <div className={`font-semibold ${theme === val ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>{t(labelKey)}</div>
                <div className={`text-xs mt-0.5 ${theme === val ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>{t(descKey)}</div>
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* ── Currency ───────────────────────────────────────── */}
      <Section icon={DollarSign} title={t('set_currency_title')} subtitle="Choose your display currency. Each product remembers the currency it was entered in.">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-3">{t('set_currency_label')}</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CURRENCIES.map(cur => {
            const active = code === cur.code
            return (
              <button
                key={cur.code}
                onClick={() => {
                  if (cur.code === code) return
                  setCurrency(cur.code)
                  toast(`Display currency switched to ${cur.code}. Products will now show their original price alongside an approximate converted amount.`, 'success')
                }}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  active
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                    : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-white/[0.02]'
                }`}
              >
                <span className={`text-xl font-bold w-8 text-center shrink-0 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  {cur.symbol}
                </span>
                <div>
                  <div className={`text-sm font-semibold ${active ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>{cur.code}</div>
                  <div className={`text-xs mt-0.5 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>{cur.label}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Info note */}
        <div className="mt-4 flex items-start gap-2.5 p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl">
          <DollarSign size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
            Each product remembers the currency it was entered in. When the display currency differs from a product's stored currency, both the original price and an approximate converted amount are shown. Exchange rates update automatically every hour.
          </p>
        </div>
      </Section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
