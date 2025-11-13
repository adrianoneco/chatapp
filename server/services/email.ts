const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USERNAME = process.env.SMTP_USERNAME || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export class EmailService {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    console.log("[EMAIL] Sending email:", {
      to: options.to,
      subject: options.subject,
      from: SMTP_USERNAME,
    });

    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      
      for (const recipient of recipients) {
        console.log(`[EMAIL] Would send to: ${recipient}`);
        console.log(`[EMAIL] Subject: ${options.subject}`);
        console.log(`[EMAIL] Body: ${options.text || options.html?.substring(0, 100)}`);
      }

      console.warn("[EMAIL] SMTP service not fully implemented - nodemailer required");
      console.warn("[EMAIL] Configure SMTP:", { SMTP_HOST, SMTP_PORT, SMTP_USERNAME });
      
      return true;
    } catch (error) {
      console.error("[EMAIL] Failed to send email:", error);
      return false;
    }
  }

  async sendConversationTranscription(
    recipientEmail: string,
    conversationId: string,
    messages: Array<{ sender: string; content: string; timestamp: Date }>
  ): Promise<boolean> {
    const transcription = messages
      .map(msg => `[${msg.timestamp.toLocaleString()}] ${msg.sender}: ${msg.content}`)
      .join("\n");

    const html = `
      <h2>Transcrição da Conversa</h2>
      <p>ID da conversa: ${conversationId}</p>
      <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
${transcription}
      </pre>
    `;

    return await this.sendEmail({
      to: recipientEmail,
      subject: `Transcrição da Conversa #${conversationId.substring(0, 8)}`,
      text: transcription,
      html,
    });
  }

  async sendMeetingNotification(
    recipients: string[],
    meetingTitle: string,
    scheduledAt: Date,
    action: "created" | "updated" | "cancelled"
  ): Promise<boolean> {
    const actionText = {
      created: "agendada",
      updated: "atualizada",
      cancelled: "cancelada",
    };

    const html = `
      <h2>Reunião ${actionText[action]}</h2>
      <p><strong>Título:</strong> ${meetingTitle}</p>
      <p><strong>Data/Hora:</strong> ${scheduledAt.toLocaleString("pt-BR")}</p>
      ${action === "cancelled" ? "<p style='color: red;'><strong>Esta reunião foi cancelada.</strong></p>" : ""}
    `;

    return await this.sendEmail({
      to: recipients,
      subject: `Reunião ${actionText[action]}: ${meetingTitle}`,
      html,
    });
  }
}

export const emailService = new EmailService();
