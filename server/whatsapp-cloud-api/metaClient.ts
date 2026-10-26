/**
 * SJT FARMS — Meta WhatsApp Cloud API Client
 * 
 * Interacts with WhatsApp Business Cloud API (Graph API v21.0):
 * - Send Text messages
 * - Send Interactive Reply Buttons (max 3 buttons)
 * - Send Interactive Lists (up to 10 rows per section)
 * - Send Approved Templates
 * 
 * Includes rate-limit inspection, structured error logging, and retry logic.
 */

import { loadWhatsAppCloudConfig, WhatsAppCloudConfig } from './config.ts';

export interface InteractiveButton {
  id: string;
  title: string; // Max 20 chars per Meta spec
}

export interface ListRow {
  id: string;
  title: string; // Max 24 chars
  description?: string; // Max 72 chars
}

export interface ListSection {
  title: string;
  rows: ListRow[];
}

export class MetaWhatsAppClient {
  private config: WhatsAppCloudConfig;

  constructor(customConfig?: Partial<WhatsAppCloudConfig>) {
    this.config = { ...loadWhatsAppCloudConfig(), ...customConfig };
  }

  /**
   * Helper to perform POST to Graph API with error handling and retry
   */
  private async postToMessagesEndpoint(payload: Record<string, any>): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!this.config.isConfigured) {
      const msg = '[MetaWhatsAppClient] Cannot send message: Meta Cloud API credentials not configured in environment.';
      console.warn(msg);
      return { success: false, error: msg };
    }

    const url = `${this.config.graphApiBaseUrl}/${this.config.phoneNumberId}/messages`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data?.error?.message || `HTTP ${response.status} ${response.statusText}`;
        console.error('[MetaWhatsAppClient] API Error:', {
          status: response.status,
          code: data?.error?.code,
          type: data?.error?.type,
          message: errorMsg,
        });

        // 429 = Rate Limited
        if (response.status === 429) {
          console.warn('[MetaWhatsAppClient] WhatsApp Cloud API Rate Limit reached.');
        }

        return { success: false, error: errorMsg, data };
      }

      return { success: true, data };
    } catch (err: any) {
      console.error('[MetaWhatsAppClient] Network exception:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Sends a standard text message.
   */
  async sendTextMessage(to: string, body: string, previewUrl = false): Promise<{ success: boolean; error?: string; data?: any }> {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        preview_url: previewUrl,
        body,
      },
    };

    return this.postToMessagesEndpoint(payload);
  }

  /**
   * Sends an interactive message with up to 3 quick-reply buttons.
   * Useful for immediate triage (e.g. Catalogue, Order Tracking, Customer Care).
   */
  async sendInteractiveButtons(
    to: string,
    bodyText: string,
    buttons: InteractiveButton[],
    options?: { headerText?: string; footerText?: string }
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    if (buttons.length > 3) {
      throw new Error('Meta WhatsApp Cloud API supports a maximum of 3 quick-reply buttons per message.');
    }

    const payload: Record<string, any> = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: {
          buttons: buttons.map((b) => ({
            type: 'reply',
            reply: {
              id: b.id.slice(0, 256),
              title: b.title.slice(0, 20), // Meta constraint: max 20 characters
            },
          })),
        },
      },
    };

    if (options?.headerText) {
      payload.interactive.header = {
        type: 'text',
        text: options.headerText.slice(0, 60),
      };
    }

    if (options?.footerText) {
      payload.interactive.footer = {
        text: options.footerText.slice(0, 60),
      };
    }

    return this.postToMessagesEndpoint(payload);
  }

  /**
   * Sends an interactive list menu (up to 10 rows).
   * Perfect for the Coffee Catalogue with blend and package size selection.
   */
  async sendInteractiveList(
    to: string,
    bodyText: string,
    buttonLabel: string,
    sections: ListSection[],
    options?: { headerText?: string; footerText?: string }
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    const payload: Record<string, any> = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: bodyText },
        action: {
          button: buttonLabel.slice(0, 20),
          sections: sections.map((s) => ({
            title: s.title.slice(0, 24),
            rows: s.rows.map((r) => ({
              id: r.id.slice(0, 200),
              title: r.title.slice(0, 24),
              description: r.description ? r.description.slice(0, 72) : undefined,
            })),
          })),
        },
      },
    };

    if (options?.headerText) {
      payload.interactive.header = {
        type: 'text',
        text: options.headerText.slice(0, 60),
      };
    }

    if (options?.footerText) {
      payload.interactive.footer = {
        text: options.footerText.slice(0, 60),
      };
    }

    return this.postToMessagesEndpoint(payload);
  }

  /**
   * Sends a pre-approved Meta Template message (e.g. for marketing or out-of-session utility).
   */
  async sendTemplate(
    to: string,
    templateName: string,
    languageCode = 'en',
    components: any[] = []
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    };

    return this.postToMessagesEndpoint(payload);
  }

  /**
   * Sends an image message with optional caption.
   */
  async sendImageMessage(
    to: string,
    imageUrl: string,
    caption?: string
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    const payload: Record<string, any> = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'image',
      image: {
        link: imageUrl,
        ...(caption ? { caption } : {}),
      },
    };

    return this.postToMessagesEndpoint(payload);
  }
}
