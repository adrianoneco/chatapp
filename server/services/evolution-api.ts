import type { ChannelConfig } from "@shared/schema";

export interface EvolutionAPIConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
}

export interface WhatsAppMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: any;
  messageTimestamp: number;
  pushName?: string;
}

export interface EvolutionAPIInstance {
  instance: {
    instanceName: string;
    status: string;
  };
  qrcode?: {
    code: string;
    base64: string;
  };
}

export interface EvolutionAPIProfile {
  profileName?: string;
  profilePictureUrl?: string;
  phoneNumber?: string;
}

export class EvolutionAPIService {
  private config: EvolutionAPIConfig;

  constructor(config: EvolutionAPIConfig) {
    this.config = config;
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any) {
    const url = `${this.config.apiUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Evolution API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Evolution API request error:', error);
      throw error;
    }
  }

  async createInstance(): Promise<EvolutionAPIInstance> {
    return this.makeRequest('/instance/create', 'POST', {
      instanceName: this.config.instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    });
  }

  async connectInstance(): Promise<any> {
    return this.makeRequest(`/instance/connect/${this.config.instanceName}`, 'GET');
  }

  async getInstanceStatus(): Promise<any> {
    return this.makeRequest(`/instance/connectionState/${this.config.instanceName}`, 'GET');
  }

  async getQRCode(): Promise<{ code: string; base64: string }> {
    const result = await this.makeRequest(`/instance/qrcode/${this.config.instanceName}`, 'GET');
    return result.qrcode || result;
  }

  async getProfileInfo(): Promise<EvolutionAPIProfile> {
    try {
      const result = await this.makeRequest(`/chat/fetchProfile/${this.config.instanceName}`, 'GET');
      return {
        profileName: result.name || result.profileName,
        profilePictureUrl: result.profilePictureUrl || result.picture,
        phoneNumber: result.id || result.phoneNumber,
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      return {};
    }
  }

  async sendTextMessage(remoteJid: string, text: string, quotedMessageId?: string): Promise<any> {
    // Extract phone number from remoteJid (remove @s.whatsapp.net suffix)
    const phoneNumber = extractPhoneFromJid(remoteJid);
    
    const payload: any = {
      number: phoneNumber,
      text,
    };

    if (quotedMessageId) {
      payload.quoted = {
        key: {
          id: quotedMessageId,
        },
      };
    }

    return this.makeRequest(`/message/sendText/${this.config.instanceName}`, 'POST', payload);
  }

  async sendMediaMessage(remoteJid: string, mediaUrl: string, caption?: string, mediaType: 'image' | 'video' | 'audio' | 'document' = 'image'): Promise<any> {
    // Extract phone number from remoteJid (remove @s.whatsapp.net suffix)
    const phoneNumber = extractPhoneFromJid(remoteJid);
    
    const payload: any = {
      number: phoneNumber,
      mediatype: mediaType,
      media: mediaUrl,
    };

    if (caption) {
      payload.caption = caption;
    }

    return this.makeRequest(`/message/sendMedia/${this.config.instanceName}`, 'POST', payload);
  }

  async configureWebhook(webhookUrl: string, events: string[]): Promise<any> {
    return this.makeRequest(`/webhook/set/${this.config.instanceName}`, 'POST', {
      enabled: true,
      url: webhookUrl,
      events,
      webhookByEvents: true,
    });
  }

  async fetchMessages(remoteJid: string, limit: number = 50): Promise<any[]> {
    try {
      const result = await this.makeRequest(
        `/chat/findMessages/${this.config.instanceName}`,
        'POST',
        {
          where: {
            key: {
              remoteJid,
            },
          },
          limit,
        }
      );
      return result.messages || result || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  async deleteInstance(): Promise<any> {
    return this.makeRequest(`/instance/delete/${this.config.instanceName}`, 'DELETE');
  }

  async logoutInstance(): Promise<any> {
    return this.makeRequest(`/instance/logout/${this.config.instanceName}`, 'DELETE');
  }
}

export function createEvolutionAPIService(channelConfig: ChannelConfig): EvolutionAPIService {
  if (!channelConfig.apiUrl || !channelConfig.apiKey || !channelConfig.instanceName) {
    throw new Error('Evolution API configuration incomplete');
  }

  return new EvolutionAPIService({
    apiUrl: channelConfig.apiUrl,
    apiKey: channelConfig.apiKey,
    instanceName: channelConfig.instanceName,
  });
}

export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function formatRemoteJid(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  return `${normalized}@s.whatsapp.net`;
}

export function extractPhoneFromJid(remoteJid: string): string {
  return remoteJid.split('@')[0];
}
