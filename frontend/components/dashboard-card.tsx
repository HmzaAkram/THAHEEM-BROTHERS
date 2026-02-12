import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

export function DashboardCard({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
}: DashboardCardProps) {
  return (
    <Card className="glass-card hover-scale overflow-hidden relative group border-0 shadow-lg transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/05 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <span
              className={`font-medium ${changeType === 'positive'
                ? 'text-emerald-500'
                : changeType === 'negative'
                  ? 'text-rose-500'
                  : 'text-blue-400'
                }`}
            >
              {changeType === 'positive' && '+'}
              {change}
            </span>
            <span className="opacity-70 group-hover:opacity-100 transition-opacity">Data</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
