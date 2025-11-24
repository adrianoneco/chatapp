export type FileType = "image" | "video" | "audio" | "document" | "unknown";

export interface FileInfo {
  type: FileType;
  mimeType: string;
  extension: string;
  name: string;
  size: number;
}

export interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: string;
  genre?: string;
  duration?: number;
  picture?: {
    data: Uint8Array;
    format: string;
  };
}

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "ico"];
const VIDEO_EXTENSIONS = ["mp4", "webm", "ogg", "avi", "mov", "mkv", "flv", "wmv"];
const AUDIO_EXTENSIONS = ["mp3", "wav", "ogg", "m4a", "aac", "flac", "wma", "opus", "webm"];
const DOCUMENT_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"];

const IMAGE_MIMETYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/svg+xml",
];
const VIDEO_MIMETYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/avi",
  "video/quicktime",
  "video/x-matroska",
];
const AUDIO_MIMETYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp4",
  "audio/aac",
  "audio/flac",
  "audio/webm",
];
const DOCUMENT_MIMETYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
];

export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

export function detectFileType(file: File): FileInfo {
  const extension = getFileExtension(file.name);
  const mimeType = file.type || "";

  let type: FileType = "unknown";

  // Try to determine type from MIME type first
  if (IMAGE_MIMETYPES.includes(mimeType)) {
    type = "image";
  } else if (VIDEO_MIMETYPES.includes(mimeType)) {
    type = "video";
  } else if (AUDIO_MIMETYPES.includes(mimeType)) {
    type = "audio";
  } else if (DOCUMENT_MIMETYPES.includes(mimeType)) {
    type = "document";
  }
  // Fallback to extension-based detection
  else if (IMAGE_EXTENSIONS.includes(extension)) {
    type = "image";
  } else if (VIDEO_EXTENSIONS.includes(extension)) {
    type = "video";
  } else if (AUDIO_EXTENSIONS.includes(extension)) {
    type = "audio";
  } else if (DOCUMENT_EXTENSIONS.includes(extension)) {
    type = "document";
  }

  return {
    type,
    mimeType,
    extension,
    name: file.name,
    size: file.size,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export async function readAudioMetadata(file: File): Promise<AudioMetadata> {
  // Basic metadata from filename
  const metadata: AudioMetadata = {
    title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
  };
  
  return Promise.resolve(metadata);
}
