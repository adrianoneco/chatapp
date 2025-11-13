export interface TemplateVariable {
  key: string;
  label: string;
  description: string;
  category: "conversa" | "atendente" | "cliente";
  example: string;
}

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  {
    key: "{{conversationId}}",
    label: "ID da Conversa",
    description: "Identificador único da conversa",
    category: "conversa",
    example: "abc-123-xyz"
  },
  {
    key: "{{protocol}}",
    label: "Protocol",
    description: "Protocolo/ETag associado à conversa (usado pelo assistente)",
    category: "conversa",
    example: "W/\"1234567890abcdef\""
  },
  {
    key: "{{conversationStatus}}",
    label: "Status da Conversa",
    description: "Status atual da conversa (aberta, fechada, etc)",
    category: "conversa",
    example: "aberta"
  },
  {
    key: "{{conversationChannel}}",
    label: "Canal da Conversa",
    description: "Nome do canal de comunicação",
    category: "conversa",
    example: "WhatsApp"
  },
  {
    key: "{{messageCount}}",
    label: "Total de Mensagens",
    description: "Número total de mensagens na conversa",
    category: "conversa",
    example: "42"
  },
  {
    key: "{{attendantName}}",
    label: "Nome do Atendente",
    description: "Nome completo do atendente",
    category: "atendente",
    example: "João Silva"
  },
  {
    key: "{{attendantEmail}}",
    label: "Email do Atendente",
    description: "Email do atendente",
    category: "atendente",
    example: "joao@empresa.com"
  },
  {
    key: "{{attendantRole}}",
    label: "Cargo do Atendente",
    description: "Cargo ou função do atendente",
    category: "atendente",
    example: "Suporte Técnico"
  },
  {
    key: "{{clientName}}",
    label: "Nome do Cliente",
    description: "Nome completo do cliente",
    category: "cliente",
    example: "Maria Santos"
  },
  {
    key: "{{clientEmail}}",
    label: "Email do Cliente",
    description: "Email do cliente",
    category: "cliente",
    example: "maria@email.com"
  },
  {
    key: "{{clientPhone}}",
    label: "Telefone do Cliente",
    description: "Número de telefone do cliente",
    category: "cliente",
    example: "+55 11 98765-4321"
  },
  {
    key: "{{currentDate}}",
    label: "Data Atual",
    description: "Data atual formatada",
    category: "conversa",
    example: "13/11/2025"
  },
  {
    key: "{{currentTime}}",
    label: "Hora Atual",
    description: "Hora atual formatada",
    category: "conversa",
    example: "14:30"
  }
];

export function getVariablesByCategory(category: "conversa" | "atendente" | "cliente") {
  return TEMPLATE_VARIABLES.filter(v => v.category === category);
}

export function getAllVariableKeys(): string[] {
  return TEMPLATE_VARIABLES.map(v => v.key);
}
