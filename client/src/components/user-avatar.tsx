import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const dotSizeClasses = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
};

export function UserAvatar({ 
  name, 
  avatarUrl, 
  isOnline, 
  size = "md",
  className 
}: UserAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn("relative", className)}>
      <Avatar className={sizeClasses[size]}>
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
        <AvatarFallback>
          {initials || <User className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      {isOnline !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-background",
            dotSizeClasses[size],
            isOnline ? "bg-green-500" : "bg-muted-foreground"
          )}
          aria-label={isOnline ? "Online" : "Offline"}
        />
      )}
    </div>
  );
}
