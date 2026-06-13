import React, { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useCurrency, CURRENCIES } from '../contexts/CurrencyContext'
import { useAppSettings } from '../contexts/AppSettingsContext'
import { useToast } from '../components/ui/Toast'
import { Moon, Sun, Store, Package, Clock, Type, LayoutList, Globe, Contrast, DollarSign, AlertTriangle, Shield, Mail, Key, Eye, EyeOff, ExternalLink, X, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SectionSkeleton } from '../components/ui/Skeletons'
import { supabase } from '../lib/supabase'
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/axios'

const DATE_FORMATS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']

/* ── reusable section shell ───────────────────────────────── */
function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm mb-6">
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
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const { code, setCurrency } = useCurrency()
  const { settings, updateSettings, t } = useAppSettings()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState('business')
  const [confirmCurrency, setConfirmCurrency] = useState(null)
  const [confirmSetting, setConfirmSetting] = useState(null)

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

  // SMTP Settings
  const [smtp, setSmtp] = useState({ email: '', password: '' })
  const [smtpSaved, setSmtpSaved] = useState(false)
  const [isSavingSmtp, setIsSavingSmtp] = useState(false)
  const [showAppPasswordGuide, setShowAppPasswordGuide] = useState(false)

  React.useEffect(() => {
    const fetchSmtpSettings = async () => {
      try {
        const res = await api.get('/companies/settings');
        setSmtp({ email: res.data.smtp_email || '', password: res.data.smtp_password || '' });
        
        // Populate store name from company database if not overridden
        if (res.data.name) {
          setBiz(b => ({
            ...b,
            storeName: b.storeName && b.storeName !== 'My Store' ? b.storeName : res.data.name
          }));
        }
      } catch (err) {
        console.error("Failed to load SMTP settings:", err);
      }
    };
    if (user) {
      fetchSmtpSettings();
    }
  }, [user]);

  const saveSmtp = async () => {
    setIsSavingSmtp(true);
    try {
      await api.put('/companies/settings', {
        smtp_email: smtp.email,
        smtp_password: smtp.password
      });
      setSmtpSaved(true);
      toast("Email integration settings saved.", 'success');
      setTimeout(() => setSmtpSaved(false), 2000);
    } catch {
      toast("Failed to save email settings.", 'error');
    } finally {
      setIsSavingSmtp(false);
    }
  }

  // Security & Account states
  const [oldPassword, setOldPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  
  const handleUpdatePassword = async () => {
    setFormError('')
    setFieldErrors({})
    
    const newFieldErrors = {}
    if (!oldPassword) newFieldErrors.oldPassword = "Current Password is required."
    if (!password) newFieldErrors.password = "New Password is required."
    if (!confirmPassword) newFieldErrors.confirmPassword = "Confirm New Password is required."
    
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors)
      return
    }

    if (password !== confirmPassword) {
      return
    }
    
    if (password === oldPassword) {
      setFieldErrors({ password: "New password cannot be the same as the current password." })
      return
    }
    
    setIsUpdatingPassword(true)
    if (!import.meta.env.VITE_SUPABASE_URL) {
      setTimeout(() => {
        setIsUpdatingPassword(false)
        setOldPassword('')
        setPassword('')
        setConfirmPassword('')
        toast("Password updated successfully.", 'success')
      }, 800)
      return
    }

    // Verify current password first by re-authenticating
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    })
    
    if (signInError) {
      setFieldErrors({ oldPassword: "The current password is incorrect." })
      setIsUpdatingPassword(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setFormError(error.message)
    } else {
      setOldPassword('')
      setPassword('')
      setConfirmPassword('')
      
      // Trigger the custom "Password Changed" email via our backend
      try {
        await api.post('/auth/notify-security', { event_type: 'password_changed' });
      } catch (err) {
        console.error("Failed to trigger security email:", err);
      }
      
      toast("Password updated successfully.", 'success')
    }
    setIsUpdatingPassword(false)
  }

  const handleSendResetEmail = async () => {
    const user = (await supabase.auth.getSession()).data.session?.user
    if (!user?.email) {
      toast("No email associated with this account.", 'error')
      return
    }
    
    if (!import.meta.env.VITE_SUPABASE_URL) {
      toast("Reset email sent.", 'success')
      return
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      toast(error.message, 'error')
    } else {
      toast("Reset email sent.", 'success')
    }
  }

  const TABS = [
    { id: 'business', label: 'Business Settings', icon: Store },
    { id: 'regional', label: 'Regional & Localization', icon: Globe },
    { id: 'appearance', label: 'Appearance & Accessibility', icon: Sun },
    { id: 'security', label: 'Security & Account', icon: Shield },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('set_title')}</h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{t('set_subtitle')}</p>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 mb-6 border-b border-slate-200 dark:border-white/10">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          const TIcon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.02]'
              }`}
            >
              <TIcon size={16} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <SectionSkeleton key="skeleton-settings" count={3} />
        ) : (
          <motion.div 
            key={`content-settings-${activeTab}`}
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }} 
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {activeTab === 'business' && (
              <>

      {/* ── 1. Business Info ───────────────────────────────── */}
      <Section icon={Store} title={t('set_biz_title')} subtitle={t('set_biz_sub')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>{t('set_biz_name')}</label>
            <input
              className={inputCls}
              value={biz.storeName}
              onChange={e => setBiz(b => ({ ...b, storeName: e.target.value }))}
              placeholder="e.g. Your Company Name"
            />
          </div>
          <div>
            <label className={labelCls}>{t('set_biz_addr')}</label>
            <input
              className={inputCls}
              value={biz.storeAddress}
              onChange={e => setBiz(b => ({ ...b, storeAddress: e.target.value }))}
              placeholder="e.g. 123 Main St, City"
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

      {/* ── 1.5 Email Integration ───────────────────────────── */}
      <Section icon={Mail} title="Email Integration (Custom SMTP)" subtitle="Send Purchase Order emails using your company's actual email address.">
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-500/20 dark:bg-blue-500/10">
          <div>
            <h4 className="text-base font-bold text-blue-950 dark:text-blue-100">Use your own Gmail address</h4>
            <p className="mt-1 text-sm leading-6 text-blue-800 dark:text-blue-200">
              SIA can send purchase order emails from your own Gmail address. To do this, you need a Google App Password.
            </p>
          </div>
          <button
            onClick={() => setShowAppPasswordGuide(true)}
            className="mt-4 sm:mt-0 inline-flex shrink-0 items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:bg-blue-500/20 shadow-sm"
          >
            <Info size={16} />
            How to set this up?
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Sender Email Address</label>
            <input
              className={inputCls}
              type="email"
              value={smtp.email}
              onChange={e => setSmtp(s => ({ ...s, email: e.target.value }))}
              placeholder="e.g. purchasing@yourcompany.com"
            />
          </div>
          <div>
            <label className={labelCls}>Google App Password</label>
            <input
              className={inputCls}
              type="password"
              value={smtp.password}
              onChange={e => setSmtp(s => ({ ...s, password: e.target.value }))}
              placeholder="16-character App Password"
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={saveSmtp}
            disabled={isSavingSmtp}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl text-sm font-semibold text-white transition-colors shadow-[0_4px_14px_0_rgba(99,102,241,0.2)]"
          >
            {isSavingSmtp ? 'Saving...' : smtpSaved ? 'Saved!' : 'Save Email Settings'}
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
            className={`${inputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
            {t('set_reorder_hint')}
          </p>
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
                  setConfirmCurrency(cur)
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

              </>
            )}

            {activeTab === 'regional' && (
              <>
      <Section icon={Clock} title={t('set_dt_title')} subtitle={t('set_dt_sub')}>
        <div className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-3">{t('set_dt_date')}</label>
            <div className="flex flex-wrap gap-2">
              {DATE_FORMATS.map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setConfirmSetting({
                    type: 'dateFormat',
                    value: fmt,
                    title: 'Change Date Format?',
                    description: `Are you sure you want to change the date format to ${fmt}?`
                  })}
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
                  onClick={() => setConfirmSetting({
                    type: 'timeFormat',
                    value: opt.val,
                    title: 'Change Time Format?',
                    description: `Are you sure you want to change the time format to ${t(opt.key)}?`
                  })}
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
                {(() => {
                  const now = new Date();
                  const d = now.getDate().toString().padStart(2, '0');
                  const m = (now.getMonth() + 1).toString().padStart(2, '0');
                  const y = now.getFullYear();
                  
                  let dateStr = `${m}/${d}/${y}`;
                  if (settings.dateFormat === 'DD/MM/YYYY') dateStr = `${d}/${m}/${y}`;
                  if (settings.dateFormat === 'YYYY-MM-DD') dateStr = `${y}-${m}-${d}`;
                  
                  const timeStr = new Intl.DateTimeFormat('en', {
                    hour: '2-digit', minute: '2-digit',
                    hour12: settings.timeFormat === '12h'
                  }).format(now);
                  
                  return `${dateStr} ${timeStr}`;
                })()}
              </span>
            </p>
          </div>
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
              onClick={() => setConfirmSetting({
                type: 'language',
                value: val,
                title: 'Change Language?',
                description: `Are you sure you want to change the language to ${label}?`
              })}
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

              </>
            )}

            {activeTab === 'appearance' && (
              <>
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

              </>
            )}

            {activeTab === 'security' && (
              <>
                <Section icon={Key} title="Change Password" subtitle="Update your account password.">
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className={labelCls}>Current Password</label>
                      <div className="relative">
                        <input
                          type={showOldPassword ? "text" : "password"}
                          value={oldPassword}
                          onChange={e => { setOldPassword(e.target.value); setFieldErrors(prev => ({...prev, oldPassword: ''})); }}
                          placeholder="Enter current password"
                          className={`${inputCls} ${fieldErrors.oldPassword ? '!border-red-500 focus:!ring-red-500/30' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {fieldErrors.oldPassword && (
                        <p className="text-xs text-red-500 mt-1.5 font-medium">{fieldErrors.oldPassword}</p>
                      )}
                    </div>
                    <div>
                      <label className={labelCls}>New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={password}
                          onChange={e => { setPassword(e.target.value); setFieldErrors(prev => ({...prev, password: ''})); }}
                          placeholder="Enter new password"
                          className={`${inputCls} ${fieldErrors.password ? '!border-red-500 focus:!ring-red-500/30' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {fieldErrors.password && (
                        <p className="text-xs text-red-500 mt-1.5 font-medium">{fieldErrors.password}</p>
                      )}
                      <div className="mt-2">
                        <PasswordStrengthIndicator password={password} />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={e => { setConfirmPassword(e.target.value); setFieldErrors(prev => ({...prev, confirmPassword: ''})); }}
                          placeholder="Confirm new password"
                          className={`${inputCls} ${
                            (confirmPassword && password !== confirmPassword) || fieldErrors.confirmPassword
                              ? '!border-red-500 focus:!ring-red-500/30' 
                              : ''
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {confirmPassword && password !== confirmPassword ? (
                        <p className="text-xs text-red-500 mt-1.5 font-medium">Passwords do not match.</p>
                      ) : fieldErrors.confirmPassword ? (
                        <p className="text-xs text-red-500 mt-1.5 font-medium">{fieldErrors.confirmPassword}</p>
                      ) : null}
                    </div>
                    {formError && (
                      <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">{formError}</p>
                      </div>
                    )}
                    <button
                      onClick={handleUpdatePassword}
                      disabled={isUpdatingPassword}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:hover:bg-indigo-600 rounded-xl text-sm font-semibold text-white transition-colors shadow-[0_4px_14px_0_rgba(99,102,241,0.2)]"
                    >
                      {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </Section>

                <Section icon={Mail} title="Forgot Password" subtitle="Send a password reset link to your email.">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
                      If you've forgotten your password or want to reset it via email, we'll send a secure link to your registered email address.
                    </p>
                    <button
                      onClick={handleSendResetEmail}
                      className="px-5 py-2.5 whitespace-nowrap bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      Send Reset Link
                    </button>
                  </div>
                </Section>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmSetting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
              onClick={() => setConfirmSetting(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="relative bg-white dark:bg-[#0d0f1a] dark:backdrop-blur-xl border border-transparent dark:border-white/10 rounded-2xl w-full max-w-sm shadow-2xl dark:shadow-none p-6 z-10"
            >
              <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl flex items-center justify-center mb-4">
                <AlertTriangle size={20} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight mb-1.5">
                {confirmSetting.title}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                {confirmSetting.description}
              </p>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setConfirmSetting(null)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                >
                  {t('modal_cancel') || 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    updateSettings({ [confirmSetting.type]: confirmSetting.value })
                    setConfirmSetting(null)
                  }}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white transition-colors shadow-[0_4px_14px_0_rgba(99,102,241,0.2)]"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmCurrency && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
              onClick={() => setConfirmCurrency(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="relative bg-white dark:bg-[#0d0f1a] dark:backdrop-blur-xl border border-transparent dark:border-white/10 rounded-2xl w-full max-w-sm shadow-2xl dark:shadow-none p-6 z-10"
            >
              <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl flex items-center justify-center mb-4">
                <AlertTriangle size={20} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight mb-1.5">
                Change Display Currency?
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                Are you sure you want to change the display currency to <span className="font-semibold text-slate-700 dark:text-slate-300">{confirmCurrency.code}</span>? Products will now show their original price alongside an approximate converted amount.
              </p>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setConfirmCurrency(null)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                >
                  {t('modal_cancel') || 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    setCurrency(confirmCurrency.code)
                    toast(`Display currency switched to ${confirmCurrency.code}. Products will now show their original price alongside an approximate converted amount.`, 'success')
                    setConfirmCurrency(null)
                  }}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white transition-colors shadow-[0_4px_14px_0_rgba(99,102,241,0.2)]"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* App Password Guide Modal */}
      <AnimatePresence>
        {showAppPasswordGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowAppPasswordGuide(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0d0f1a] dark:backdrop-blur-xl border border-transparent dark:border-white/10 rounded-2xl shadow-2xl z-10"
            >
              <div className="sticky top-0 bg-white/90 dark:bg-[#0d0f1a]/90 backdrop-blur-md px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between z-20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                    <Mail size={18} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Gmail App Password Setup</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Step-by-step guide for connecting your Gmail account.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAppPasswordGuide(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex justify-center mb-6">
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-blue-200 bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:-translate-y-0.5 dark:border-blue-500/30"
                  >
                    Open Google App Passwords
                    <ExternalLink size={16} />
                  </a>
                </div>

                <div className="grid gap-5">
                  {[
                    {
                      title: 'Step 1: Go to your Google Account Settings',
                      body: 'Open a new tab and go to myaccount.google.com (or click your profile picture in Gmail and choose "Manage your Google Account").',
                    },
                    {
                      title: 'Step 2: Turn on 2-Step Verification',
                      body: 'On the left menu, click "Security". Scroll down to "How you sign in to Google". Click "2-Step Verification" and follow the steps on the screen to turn it on using your phone. If it already says "On", skip this step.',
                    },
                    {
                      title: 'Step 3: Search for App Passwords',
                      body: 'Go back to the main Security page (or use the search bar at the very top of your Google Account and type "App passwords"). Click on "App passwords".',
                    },
                    {
                      title: 'Step 4: Create a new password',
                      body: 'Google might ask you to type your normal password again. Then, you will see a box that says "App name". Type "SIA System" in that box and click the "Create" button.',
                    },
                    {
                      title: 'Step 5: Copy the secret code',
                      body: 'A box will pop up showing a 16-letter password on a yellow background. This is your App Password. Highlight it with your mouse, right-click, and select "Copy".',
                    },
                    {
                      title: 'Step 6: Paste it into SIA and Save',
                      body: 'Come back to this page. Right-click inside the "Google App Password" box at the bottom and choose "Paste". Click the "Save Email Settings" button.',
                    },
                  ].map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="mt-0.5 flex shrink-0 items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 font-bold text-xs">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{step.title}</p>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{step.body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                    <AlertTriangle size={16} className="text-amber-500" />
                    If you don't see "App passwords"
                  </p>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    Google hides this if you haven't turned on 2-Step Verification first. Also, some school or work accounts don't allow it. Ask your IT admin, or simply leave the fields empty to use the system default email.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
