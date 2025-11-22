import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface UserAvatarProps {
  name: string;
  image?: string | null;
  className?: string;
}

export function UserAvatar({ name, image, className }: UserAvatarProps) {
  const getInitials = (fullName: string) => {
    const names = fullName.trim().split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  return (
    <Avatar className={className}>
      {image && <AvatarImage src={image} alt={name} />}
      <AvatarFallback className="bg-primary text-primary-foreground">
        {name ? getInitials(name) : <User className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  );
}
