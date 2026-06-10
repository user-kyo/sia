import re

with open('src/pages/AnalyticsDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Card dimensions
content = content.replace(
    'const Card = ({ title, value, icon: Icon, trend, trendUp, alert, attention }) => (\n  <div className="relative bg-white dark:bg-[#1b2035] rounded-2xl p-6 border border-slate-200 dark:border-white/10 flex flex-col justify-between group',
    'const Card = ({ title, value, icon: Icon, trend, trendUp, alert, attention }) => (\n  <div className="relative h-full w-full bg-white dark:bg-[#1b2035] rounded-2xl p-6 border border-slate-200 dark:border-white/10 flex flex-col justify-between group'
)

# Fix ChartCard dimensions
content = content.replace(
    'const ChartCard = ({ children, className = \'\', onClick }) => (\n  <div onClick={onClick} className={`relative bg-white dark:bg-[#1b2035] rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col group',
    'const ChartCard = ({ children, className = \'\', onClick }) => (\n  <div onClick={onClick} className={`relative h-full w-full bg-white dark:bg-[#1b2035] rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col group'
)

# Fix motion.div wrappers
content = content.replace(
    'className="lg:col-span-2">',
    'className="lg:col-span-2 h-full w-full">'
)

content = content.replace(
    'className="h-full">',
    'className="h-full w-full">'
)

with open('src/pages/AnalyticsDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
