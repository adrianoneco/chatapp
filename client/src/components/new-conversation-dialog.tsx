import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "./user-avatar";
import { Search } from "lucide-react";
import type { SafeUser } from "@shared/schema";
import { useLocation } from "wouter";

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewConversationDialog({ open, onOpenChange }: NewConversationDialogProps) {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

  const { data: contacts = [] } = useQuery<SafeUser[]>({
    queryKey: ["/api/users?role=client"],
    enabled: open,
  });

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(search.toLowerCase()) ||
    contact.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectContact = (contactId: string) => {
    setLocation(`/conversations/webchat/${contactId}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Conversa</DialogTitle>
          <DialogDescription>
            Selecione um contato para iniciar uma conversa
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contato..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[300px] pr-4">
            {filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Nenhum contato encontrado
              </div>
            ) : (
              <div className="space-y-2">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleSelectContact(contact.id)}
                  >
                    <UserAvatar name={contact.name} image={contact.image} className="h-10 w-10" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{contact.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
