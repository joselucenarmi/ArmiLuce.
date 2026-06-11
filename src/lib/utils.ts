import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-ES').format(num);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeDate(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Ahora mismo';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return formatDate(date);
}

export function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    terreno_urbanizable: 'Terreno urbanizable',
    terreno_rustico: 'Terreno rústico',
    vivienda: 'Vivienda',
    local_comercial: 'Local comercial',
    nave_industrial: 'Nave industrial',
  };
  return labels[type] || type;
}

export function getValuationColor(valuation: string): string {
  const colors: Record<string, string> = {
    excelente: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    buena: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    normal: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    sobrevalorado: 'text-red-400 bg-red-500/10 border-red-500/20',
  };
  return colors[valuation] || colors.normal;
}

export function getValuationLabel(valuation: string): string {
  const labels: Record<string, string> = {
    excelente: 'Excelente oportunidad',
    buena: 'Buena oportunidad',
    normal: 'Precio normal',
    sobrevalorado: 'Sobrevalorado',
  };
  return labels[valuation] || valuation;
}

export function getPlanLimits(plan: string): { alerts: number; exports: boolean; advanced: boolean } {
  switch (plan) {
    case 'professional':
      return { alerts: Infinity, exports: true, advanced: true };
    case 'pro':
      return { alerts: Infinity, exports: false, advanced: true };
    default:
      return { alerts: 3, exports: false, advanced: false };
  }
}
