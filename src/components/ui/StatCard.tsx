interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  iconBg?: string
}

export function StatCard({ icon, label, value, iconBg = 'bg-navy-100' }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold text-slate-800 font-mono">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}
