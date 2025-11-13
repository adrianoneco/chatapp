import { Phone, PhoneOff, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./user-avatar";

interface IncomingCallToastProps {
  callerName: string;
  callerAvatarUrl?: string | null;
  isVideo: boolean;
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCallToast({
  callerName,
  callerAvatarUrl,
  isVideo,
  onAccept,
  onReject,
}: IncomingCallToastProps) {
  return (
    <Card className="w-96 shadow-lg border-2 border-primary" data-testid="toast-incoming-call">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <UserAvatar name={callerName} avatarUrl={callerAvatarUrl} size="md" />
          <div className="flex-1">
            <CardTitle className="text-base">{callerName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {isVideo ? "Chamada de vídeo" : "Chamada de áudio"}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button
            onClick={onReject}
            variant="destructive"
            className="flex-1"
            data-testid="button-reject-call"
          >
            <PhoneOff className="h-4 w-4 mr-2" />
            Recusar
          </Button>
          <Button
            onClick={onAccept}
            variant="default"
            className="flex-1"
            data-testid="button-accept-call"
          >
            {isVideo ? (
              <Video className="h-4 w-4 mr-2" />
            ) : (
              <Phone className="h-4 w-4 mr-2" />
            )}
            Atender
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
