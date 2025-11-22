import nodemailer from "nodemailer";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

let emailConfig: EmailConfig | null = null;

// Try to load email config from environment variables
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  emailConfig = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
  };
}

export async function sendPasswordResetEmail(email: string, token: string) {
  if (!emailConfig) {
    console.warn("⚠️  Email not configured. Password reset link:");
    console.warn(`   http://localhost:5000/reset-password?token=${token}`);
    return;
  }

  const transporter = nodemailer.createTransport(emailConfig);

  const resetUrl = `${process.env.APP_URL || "http://localhost:5000"}/reset-password?token=${token}`;

  const mailOptions = {
    from: emailConfig.from,
    to: email,
    subject: "Recuperação de Senha - Sistema de Atendimento",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Recuperação de Senha</h1>
            </div>
            <div class="content">
              <p>Olá,</p>
              <p>Você solicitou a recuperação de senha para sua conta no Sistema de Atendimento.</p>
              <p>Clique no botão abaixo para redefinir sua senha:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Redefinir Senha</a>
              </div>
              <p>Ou copie e cole este link no seu navegador:</p>
              <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
              <p><strong>Este link expira em 1 hora.</strong></p>
              <p>Se você não solicitou esta recuperação, ignore este email.</p>
            </div>
            <div class="footer">
              <p>© 2024 Sistema de Atendimento. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Password reset email sent to:", email);
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw new Error("Erro ao enviar email de recuperação");
  }
}
