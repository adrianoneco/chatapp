import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  children: React.ReactNode;
}

const EMOJI_CATEGORIES = {
  frequent: {
    label: "Frequentes",
    emojis: ["❤️", "👍", "😂", "😊", "🎉", "🔥", "👏", "✨"]
  },
  smileys: {
    label: "Rostos",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
      "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩",
      "😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪",
      "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨",
      "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥",
      "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕"
    ]
  },
  gestures: {
    label: "Gestos",
    emojis: [
      "👍", "👎", "👊", "✊", "🤛", "🤜", "🤞", "✌️",
      "🤟", "🤘", "👌", "🤏", "👈", "👉", "👆", "👇",
      "☝️", "✋", "🤚", "🖐️", "🖖", "👋", "🤙", "💪",
      "🙏", "✍️", "💅", "🤝", "👏", "👐"
    ]
  },
  hearts: {
    label: "Corações",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
      "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖",
      "💘", "💝", "💟"
    ]
  },
  objects: {
    label: "Objetos",
    emojis: [
      "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉",
      "⭐", "🌟", "✨", "💫", "🔥", "💥", "💯", "✅",
      "❌", "⚠️", "📱", "💻", "⌚", "📷", "🎮", "🎵"
    ]
  }
};

export function EmojiPicker({ onEmojiSelect, children }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Tabs defaultValue="frequent" className="w-full">
          <TabsList className="w-full grid grid-cols-5 rounded-none border-b">
            <TabsTrigger value="frequent" className="text-xs" data-testid="emoji-tab-frequent">😊</TabsTrigger>
            <TabsTrigger value="smileys" className="text-xs" data-testid="emoji-tab-smileys">😀</TabsTrigger>
            <TabsTrigger value="gestures" className="text-xs" data-testid="emoji-tab-gestures">👍</TabsTrigger>
            <TabsTrigger value="hearts" className="text-xs" data-testid="emoji-tab-hearts">❤️</TabsTrigger>
            <TabsTrigger value="objects" className="text-xs" data-testid="emoji-tab-objects">🎉</TabsTrigger>
          </TabsList>

          {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
            <TabsContent key={key} value={key} className="m-0">
              <ScrollArea className="h-64">
                <div className="grid grid-cols-8 gap-1 p-2">
                  {category.emojis.map((emoji, index) => (
                    <Button
                      key={`${emoji}-${index}`}
                      variant="ghost"
                      className="h-10 w-10 p-0 text-2xl hover:bg-accent"
                      onClick={() => handleEmojiClick(emoji)}
                      data-testid={`emoji-${emoji}`}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
