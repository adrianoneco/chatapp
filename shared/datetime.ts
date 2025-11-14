const TIMEZONE = "America/Sao_Paulo";

/**
 * Formata data no formato brasileiro (dd/MM/yyyy)
 * @param date - String ISO ou objeto Date
 * @returns Data formatada (ex: "13/11/2025")
 */
export function getDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0].split('-').reverse().join('/');
}

/**
 * Formata hora no formato brasileiro (HH:mm)
 * @param date - String ISO ou objeto Date
 * @returns Hora formatada (ex: "15:30")
 */
export function getTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[1].substring(0,5);
}

/**
 * Formata data e hora completos
 * @param date - String ISO ou objeto Date
 * @returns Data e hora formatados (ex: "13/11/2025 15:30")
 */
export function getDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${getDate(d)} ${getTime(d)}`;
}

/**
 * Formata data/hora relativa (ex: "há 5 minutos", "ontem")
 * @param date - String ISO ou objeto Date
 * @returns Texto relativo em português
 */
export function getRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'agora';
  if (diffMin < 60) return `há ${diffMin} minuto${diffMin > 1 ? 's' : ''}`;
  if (diffHour < 24) return `há ${diffHour} hora${diffHour > 1 ? 's' : ''}`;
  if (diffDay === 1) return 'ontem';
  if (diffDay < 7) return `há ${diffDay} dias`;
  
  return getDate(d);
}

export default { getDate, getTime, getDateTime, getRelativeTime };
