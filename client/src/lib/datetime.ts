import { format, parseISO } from "date-fns";

export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === "string" ? parseISO(dateString) : dateString;
  return format(date, "dd/MM/yyyy");
}

export function formatTime(dateString: string | Date): string {
  const date = typeof dateString === "string" ? parseISO(dateString) : dateString;
  return format(date, "HH:mm");
}

export function formatDateTime(dateString: string | Date): string {
  const date = typeof dateString === "string" ? parseISO(dateString) : dateString;
  return format(date, "dd/MM/yyyy HH:mm");
}

export function formatRelativeTime(dateString: string | Date): string {
  const date = typeof dateString === "string" ? parseISO(dateString) : dateString;
  const now = new Date();
  
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInMinutes < 1) return "agora";
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInHours < 24) return `${diffInHours}h`;
  if (diffInDays < 7) return `${diffInDays}d`;
  
  return formatDate(date);
}
