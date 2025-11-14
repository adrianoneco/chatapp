import React from "react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";

type Props = {
    conversationId?: string;
    conversationStatus?: string;
    isAttendant?: boolean;
    // optional handlers for header usage
    onToggleConversation?: () => void;
    onExportJSON?: () => void;
    onTranscribe?: () => void;
    onTransfer?: () => void;
    open?: boolean;
    onOpenChange?: (v: boolean) => void;
};

export function ConversationActionsMenu({
    conversationId,
    conversationStatus,
    isAttendant,
    onToggleConversation,
    onExportJSON,
    onTranscribe,
    onTransfer,
    open,
    onOpenChange,
}: Props) {
    const emit = (action: string) => {
        if (onToggleConversation || onExportJSON || onTranscribe || onTransfer) {
            // if handlers provided, call them where appropriate
            switch (action) {
                case "toggle":
                    return onToggleConversation?.();
                case "export":
                    return onExportJSON?.();
                case "transcribe":
                    return onTranscribe?.();
                case "transfer":
                    return onTransfer?.();
            }
        }

        // otherwise dispatch global event for header to handle
        window.dispatchEvent(new CustomEvent("conversationAction", { detail: { action, conversationId } }));
    };

    return (
        <DropdownMenu open={open} onOpenChange={onOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" data-testid={conversationId ? `button-actions-${conversationId}` : "button-actions"}>
                    <MoreVertical className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => emit("toggle")}>
                    {conversationStatus === "closed" ? "Reabrir conversa" : "Fechar conversa"}
                </DropdownMenuItem>
                {isAttendant && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => emit("export")}>Exportar (JSON)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => emit("transcribe")}>Transcrever (TXT)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => emit("transfer")}>
                            Transferir atendente
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default ConversationActionsMenu;
