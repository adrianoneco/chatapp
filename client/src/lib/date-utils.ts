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

export function getDateDivider(date: string | Date): string {
  const parsedDate = parseDate(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const messageDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
  
  if (messageDate.getTime() === today.getTime()) {
    return "Hoje";
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return "Ontem";
  } else {
    return format(parsedDate, "dd/MM/yyyy", { locale: ptBR });
  }
}

export function isSameDay(date1: string | Date, date2: string | Date): boolean {
  const parsed1 = parseDate(date1);
  const parsed2 = parseDate(date2);
  return parsed1.getDate() === parsed2.getDate() &&
         parsed1.getMonth() === parsed2.getMonth() &&
         parsed1.getFullYear() === parsed2.getFullYear();
}
