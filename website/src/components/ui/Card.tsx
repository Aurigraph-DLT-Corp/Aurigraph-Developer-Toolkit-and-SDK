import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'gradient' | 'glass';
  hover?: boolean;
  className?: string;
}

export default function Card({
  children,
  variant = 'default',
  hover = true,
  className,
}: CardProps) {
  const baseStyles = 'rounded-2xl p-6 lg:p-8';

  const variants = {
    default: 'bg-slate-900/50 border border-white/5',
    gradient: 'gradient-border bg-slate-900/80',
    glass: 'glass-card',
  };

  const hoverStyles = hover ? 'hover-lift cursor-pointer' : '';

  return (
    <div className={clsx(baseStyles, variants[variant], hoverStyles, className)}>
      {children}
    </div>
  );
}

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  highlight?: string;
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  highlight,
  className,
}: FeatureCardProps) {
  return (
    <Card className={className}>
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-quantum-blue/20 to-quantum-purple/20 flex items-center justify-center mb-6 text-quantum-blue">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
      {highlight && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <span className="text-quantum-green font-mono text-sm">{highlight}</span>
        </div>
      )}
    </Card>
  );
}

interface StatCardProps {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
}

export function StatCard({ value, label, description, icon }: StatCardProps) {
  return (
    <div className="text-center p-6">
      {icon && (
        <div className="w-12 h-12 rounded-full bg-quantum-blue/10 flex items-center justify-center mx-auto mb-4 text-quantum-blue">
          {icon}
        </div>
      )}
      <div className="text-4xl lg:text-5xl font-bold text-white mb-2 font-mono">
        {value}
      </div>
      <div className="text-lg font-semibold text-gray-300 mb-1">{label}</div>
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}
