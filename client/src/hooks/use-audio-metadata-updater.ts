import { useEffect, useRef } from "react";
import { MessageWithDetails } from "./use-conversations";
import { readAudioMetadata } from "@/lib/file-utils";
import { apiRequest } from "@/lib/api";

interface AudioMetadataUpdate {
  messageId: string;
  metadata: {
    audio_tags: {
      title: string;
      artist: string;
      album?: string;
      year?: string;
      cover: string | null;
    };
  };
  duration?: string;
}

export function useAudioMetadataUpdater(
  messages: MessageWithDetails[],
  conversationId: string | undefined
) {
  const processedMessagesRef = useRef<Set<string>>(new Set());
  const processingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!conversationId || !messages || messages.length === 0) return;

    const processAudioMessages = async () => {
      // Find audio messages without metadata
      const audioMessagesWithoutMetadata = messages.filter(
        (msg) =>
          msg.type === "audio" &&
          msg.mediaUrl &&
          msg.mediaUrl !== "#" &&
          !msg.metadata?.audio_tags &&
          !processedMessagesRef.current.has(msg.id) &&
          !processingRef.current.has(msg.id)
      );

      if (audioMessagesWithoutMetadata.length === 0) return;

      // Process messages one by one to avoid overwhelming the browser
      for (const message of audioMessagesWithoutMetadata.slice(0, 3)) {
        processingRef.current.add(message.id);

        try {
          // Fetch the audio file
          const response = await fetch(message.mediaUrl!);
          const blob = await response.blob();
          const file = new File([blob], "audio.mp3", { type: blob.type });

          // Read metadata
          const metadata = await readAudioMetadata(file);

          // Convert album art to base64 if available
          let coverData: string | null = null;
          if (metadata.picture) {
            const coverBlob = new Blob([new Uint8Array(metadata.picture.data)], {
              type: metadata.picture.format,
            });
            const reader = new FileReader();
            coverData = await new Promise<string>((resolve) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(coverBlob);
            });
          }

          // Calculate duration
          let duration: string | undefined;
          if (metadata.duration) {
            const totalSeconds = Math.floor(metadata.duration);
            duration = `${Math.floor(totalSeconds / 60)}:${(totalSeconds % 60)
              .toString()
              .padStart(2, "0")}`;
          }

          // Update message metadata on server
          const update: AudioMetadataUpdate = {
            messageId: message.id,
            metadata: {
              audio_tags: {
                title: metadata.title || "Sem título",
                artist: metadata.artist || "Artista desconhecido",
                album: metadata.album,
                year: metadata.year,
                cover: coverData,
              },
            },
          };

          if (duration) {
            update.duration = duration;
          }

          await apiRequest(`/messages/${message.id}/metadata`, {
            method: "PATCH",
            body: JSON.stringify(update),
          });

          processedMessagesRef.current.add(message.id);
          console.log(
            `[AudioMetadataUpdater] Updated metadata for message ${message.id}`
          );
        } catch (error) {
          console.error(
            `[AudioMetadataUpdater] Failed to update message ${message.id}:`,
            error
          );
          // Mark as processed even if failed to avoid retrying continuously
          processedMessagesRef.current.add(message.id);
        } finally {
          processingRef.current.delete(message.id);
        }

        // Small delay between processing messages
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    };

    // Start processing after a small delay
    const timeout = setTimeout(processAudioMessages, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [messages, conversationId]);
}
