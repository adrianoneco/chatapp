# Sistema de Webhooks

## 📋 Visão Geral

O sistema de webhooks permite que você receba notificações em tempo real sobre eventos que ocorrem no chat. Configure URLs externas para receber automaticamente dados sobre conversas, mensagens e usuários.

## 🎯 Eventos Disponíveis

### Conversas
- **conversation.created** - Nova conversa criada
- **conversation.assigned** - Conversa atribuída a atendente
- **conversation.transferred** - Conversa transferida entre atendentes
- **conversation.closed** - Conversa encerrada

### Mensagens
- **message.sent** - Nova mensagem enviada
- **message.updated** - Mensagem atualizada/editada
- **message.deleted** - Mensagem deletada

### Usuários
- **user.created** - Novo usuário registrado
- **user.updated** - Dados de usuário atualizados
- **user.deleted** - Usuário deletado

## 🔐 Tipos de Autenticação

### 1. None (Sem Autenticação)
Nenhuma autenticação é enviada na requisição.

### 2. API Key
Envia um header customizado com sua API key.

**Configuração:**
- Nome do Header: `X-API-Key` (ou qualquer nome customizado)
- Valor: Sua chave de API

**Exemplo de header enviado:**
```
X-API-Key: abc123def456ghi789jkl012mno345pq
```

### 3. Bearer Token (JWT)
Envia um token JWT no header Authorization.

**Configuração:**
- Token JWT completo

**Exemplo de header enviado:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Basic Authentication
Envia username e password codificados em Base64.

**Configuração:**
- Username: seu_usuario
- Password: sua_senha

**Exemplo de header enviado:**
```
Authorization: Basic c2V1X3VzdWFyaW86c3VhX3Nlbmhh
```

## 📦 Formato do Payload

Todos os webhooks enviam um payload JSON com a seguinte estrutura:

```json
{
  "event": "nome.do.evento",
  "timestamp": "2024-11-24T20:30:00.000Z",
  "data": {
    // Dados específicos do evento
  }
}
```

### Exemplos de Payloads

#### Conversa Criada
```json
{
  "event": "conversation.created",
  "timestamp": "2024-11-24T20:30:00.000Z",
  "data": {
    "id": "e647f4d3-fb9c-4f73-a40f-29aa8ab115bc",
    "protocol": "ABC1234567",
    "channel": "webchat",
    "status": "waiting",
    "clientId": "user_456",
    "clientIp": "192.168.1.1",
    "clientLocation": "São Paulo, BR",
    "gpsLocation": false,
    "latitude": null,
    "longitude": null
  }
}
```

#### Mensagem Enviada
```json
{
  "event": "message.sent",
  "timestamp": "2024-11-24T20:30:00.000Z",
  "data": {
    "message": {
      "id": "23acd898-3726-42b5-85b1-2cdd156c12da",
      "conversationId": "e647f4d3-fb9c-4f73-a40f-29aa8ab115bc",
      "senderId": "7cef34cf-0d47-4a2f-a5dc-19f9b9a3e4b2",
      "content": "Olá, como posso ajudar?",
      "type": "text",
      "createdAt": "2024-11-24T20:30:00.000Z"
    },
    "conversationId": "e647f4d3-fb9c-4f73-a40f-29aa8ab115bc"
  }
}
```

#### Conversa Transferida
```json
{
  "event": "conversation.transferred",
  "timestamp": "2024-11-24T20:30:00.000Z",
  "data": {
    "conversation": {
      "id": "e647f4d3-fb9c-4f73-a40f-29aa8ab115bc",
      "protocol": "ABC1234567",
      "status": "active"
    },
    "fromAttendantId": "att_789",
    "toAttendantId": "att_012"
  }
}
```

## 🧪 Testando Webhooks

### Usando a Interface

1. Acesse **Configurações → Webhooks**
2. Clique em **Testar** no webhook desejado
3. Escolha um **Payload de Exemplo** ou escreva um customizado
4. Clique em **Enviar Teste**
5. Visualize o resultado (status HTTP, resposta, erros)

### Payloads de Teste

A interface oferece 10 payloads de exemplo prontos:
- ✓ Conversa Criada
- ✓ Conversa Atribuída  
- ✓ Conversa Transferida
- ✓ Conversa Fechada
- ✓ Mensagem Enviada
- ✓ Mensagem Atualizada
- ✓ Mensagem Deletada
- ✓ Usuário Criado
- ✓ Usuário Atualizado
- ✓ Usuário Deletado

### Testando com RequestBin

1. Crie um endpoint temporário em https://requestbin.com
2. Copie a URL gerada (ex: `https://eo123abc.x.pipedream.net`)
3. Configure seu webhook com esta URL
4. Realize ações no chat (criar conversa, enviar mensagem, etc.)
5. Verifique as requisições recebidas no RequestBin

## 📊 Logs de Execução

Cada webhook mantém um histórico das últimas 50 chamadas:

- ✅ **Sucesso**: Status 200-299, ícone verde
- ❌ **Erro**: Status 400+, ícone vermelho, mensagem de erro
- 📋 **Detalhes**: Payload enviado, resposta recebida, timestamp

### Visualizando Logs

1. Clique em **Ver Logs** no webhook
2. Expanda qualquer log para ver:
   - Tipo de evento
   - Payload completo enviado
   - Status HTTP da resposta
   - Corpo da resposta
   - Timestamp preciso

## 🔧 Headers Customizados

Você pode adicionar headers HTTP customizados além da autenticação:

**Exemplos:**
```
Content-Type: application/json
X-Custom-Header: valor-personalizado
X-Request-ID: uuid-unico
X-Signature: hmac-sha256-signature
```

## ⚡ Boas Práticas

### Segurança
1. **Sempre use HTTPS** para endpoints de produção
2. **Valide a autenticação** no seu endpoint
3. **Verifique timestamps** para evitar replay attacks
4. **Use IPs permitidos** se possível

### Performance
1. **Responda rapidamente**: Webhooks esperam resposta < 30s
2. **Use filas**: Processe dados assincronamente
3. **Retorne 2xx**: Mesmo que processe depois
4. **Implemente retry**: Para chamadas que falharem

### Desenvolvimento
1. **Use RequestBin/Webhook.site** para testes iniciais
2. **Teste todos os eventos** antes de colocar em produção
3. **Monitore os logs** para identificar problemas
4. **Documente payloads** para sua equipe

## 🐛 Troubleshooting

### Webhook não está disparando

1. ✅ Verifique se o webhook está **Ativo** (toggle verde)
2. ✅ Confirme que o **evento está selecionado** nas configurações
3. ✅ Teste manualmente usando o botão **Testar**
4. ✅ Verifique os **logs** para ver se há erros

### Erro de autenticação

1. 🔑 Verifique se escolheu o tipo de auth correto
2. 🔑 Para API Key: Confirme nome do header e valor
3. 🔑 Para Bearer: Token JWT completo (com header.payload.signature)
4. 🔑 Para Basic: Username e password corretos

### Timeout ou erro de conexão

1. 🌐 Confirme que a URL está acessível publicamente
2. 🌐 Verifique firewall/segurança do endpoint
3. 🌐 Use HTTPS se possível
4. 🌐 Teste a URL com curl/Postman manualmente

### Payload incorreto

1. 📦 Use os **Payloads de Exemplo** para referência
2. 📦 Verifique a estrutura JSON no campo de teste
3. 📦 Veja os logs para conferir o que foi enviado
4. 📦 Compare com a documentação acima

## 🚀 Casos de Uso

### Integração com CRM
```javascript
// Quando uma conversa é criada, adicionar lead no CRM
POST https://seu-crm.com/api/webhooks/chatapp
{
  "event": "conversation.created",
  "data": {
    "clientId": "user_456",
    "clientIp": "192.168.1.1",
    "protocol": "ABC1234567"
  }
}
```

### Notificações por Email
```javascript
// Enviar email quando conversa é atribuída
POST https://seu-servidor.com/api/notify-email
{
  "event": "conversation.assigned",
  "data": {
    "attendantId": "att_789",
    "protocol": "ABC1234567"
  }
}
```

### Analytics
```javascript
// Registrar métricas de mensagens
POST https://analytics.sua-empresa.com/events
{
  "event": "message.sent",
  "data": {
    "conversationId": "conv_123",
    "type": "text",
    "timestamp": "2024-11-24T20:30:00.000Z"
  }
}
```

### Integração com Slack/Discord
```javascript
// Notificar equipe em tempo real
POST https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX
{
  "text": "🆕 Nova conversa: ABC1234567",
  "attachments": [{
    "color": "good",
    "fields": [
      { "title": "Status", "value": "waiting", "short": true },
      { "title": "IP", "value": "192.168.1.1", "short": true }
    ]
  }]
}
```

## 📝 Referência Rápida

| Ação | Endpoint | Método |
|------|----------|--------|
| Listar webhooks | `/api/webhooks` | GET |
| Criar webhook | `/api/webhooks` | POST |
| Atualizar webhook | `/api/webhooks/:id` | PATCH |
| Deletar webhook | `/api/webhooks/:id` | DELETE |
| Testar webhook | `/api/webhooks/:id/test` | POST |
| Ver logs | `/api/webhooks/:id/logs` | GET |

## 💡 Dicas Avançadas

### Validação de Assinatura

Para validar que a requisição veio do ChatApp, adicione um header customizado:

```javascript
// No webhook, adicione:
X-Webhook-Secret: seu-segredo-compartilhado

// No seu endpoint, valide:
if (req.headers['x-webhook-secret'] !== 'seu-segredo-compartilhado') {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

### Processamento em Batch

Se recebe muitos eventos, processe em lote:

```javascript
const queue = [];
const BATCH_SIZE = 10;
const BATCH_INTERVAL = 5000; // 5 segundos

app.post('/webhook', (req, res) => {
  queue.push(req.body);
  res.status(200).json({ received: true });
});

setInterval(() => {
  if (queue.length >= BATCH_SIZE) {
    processBatch(queue.splice(0, BATCH_SIZE));
  }
}, BATCH_INTERVAL);
```

### Retry Automático

Implemente retry com backoff exponencial:

```javascript
async function sendWebhook(url, payload, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) return response;
      
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
}
```

---

**Desenvolvido para ChatApp v1.0**  
Documentação atualizada em: 24/11/2024
