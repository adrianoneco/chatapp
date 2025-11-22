import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function parseDate(date: string | Date): Date {
  if (typeof date === "string") {
    return parseISO(date);
  }
  return date;
}

export function getTime(date: string | Date): string {
  const parsedDate = parseDate(date);
  return format(parsedDate, "HH:mm", { locale: ptBR });
}

export function getDate(date: string | Date): string {
  const parsedDate = parseDate(date);
  return format(parsedDate, "dd/MM/yyyy", { locale: ptBR });
}

export function getDateTime(date: string | Date): string {
  const parsedDate = parseDate(date);
  return format(parsedDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function getDateTimeShort(date: string | Date): string {
  const parsedDate = parseDate(date);
  return format(parsedDate, "dd/MM/yy HH:mm", { locale: ptBR });
}

export function getRelativeDate(date: string | Date): string {
  const parsedDate = parseDate(date);
  const now = new Date();
  const diffInMs = now.getTime() - parsedDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return "agora";
  }
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "minuto" : "minutos"} atrás`;
  }
  
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hora" : "horas"} atrás`;
  }
  
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? "dia" : "dias"} atrás`;
  }
  
  return getDate(parsedDate);
}

export function getDayOfWeek(date: string | Date): string {
  const parsedDate = parseDate(date);
  return format(parsedDate, "EEEE", { locale: ptBR });
}

export function getFullDateTime(date: string | Date): string {
  const parsedDate = parseDate(date);
  return format(parsedDate, "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
}
