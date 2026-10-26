/**
 * SJT FARMS — Meta WhatsApp Cloud API Client (v22.0)
 * 
 * Provides robust, typed outbound messaging to Meta Graph API:
 * - Text messages with link previews
 * - Interactive quick-reply buttons (up to 3)
 * - Interactive list messages (up to 10 rows)
 * - Native package images with captions
 * - Pre-approved template messages
 * - Automatic retry handling on network blips and rate-limit awareness (HTTP 429)
 */

import { getWhatsAppConfig } from './config';

export interface InteractiveButton {
  id: string;
  title: string;
}

export interface ListRow {
  id: string;
  title: string;
  description?: string;
}

export interface ListSection {
  title: string;
  rows: ListRow[];
}

export interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters: any[];
}

export class MetaWhatsAppClient {
  private config = getWhatsAppConfig();

  private get baseUrl(): string {
    return `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`;
  }

  private async postToMessagesEndpoint(payload: Record<string, any>, retries = 2): Promise<{ success: boolean; error?: string; data?: any }> {
    if (!this.config.accessToken || !this.config.phoneNumberId) {
      console.warn('[MetaWhatsAppClient] Missing access token or phone number ID. Outbound message skipped in unconfigured environment.');
      return { success: false, error: 'Unconfigured Meta credentials' };
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data: any = await response.json().catch(() => ({}));

        if (!response.ok) {
          const errorMsg = data?.error?.message || `HTTP ${response.status} ${response.statusText}`;
          console.error(`[MetaWhatsAppClient] Attempt ${attempt + 1} failed:`, {
            status: response.status,
            code: data?.error?.code,
            message: errorMsg,
          });

          // 429 Rate Limit - Wait with exponential backoff before retry
          if (response.status === 429 && attempt < retries) {
            const delay = Math.pow(2, attempt) * 1000;
            console.warn(`[MetaWhatsAppClient] Rate limited. Retrying in ${delay}ms...`);
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }

          if (attempt === retries) {
            return { success: false, error: errorMsg, data };
          }
          continue;
        }

        return { success: true, data };
      } catch (err: any) {
        console.error(`[MetaWhatsAppClient] Network exception on attempt ${attempt + 1}:`, err.message);
        if (attempt === retries) {
          return { success: false, error: err.message };
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    return { success: false, error: 'Maximum retry attempts exceeded' };
  }

  /**
   * Sends standard text message
   */
  async sendTextMessage(to: string, text: string, previewUrl = false): Promise<{ success: boolean; error?: string; data?: any }> {
    return this.postToMessagesEndpoint({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        preview_url: previewUrl,
        body: text,
      },
    });
  }

  /**
   * Sends interactive reply buttons (Meta limit: max 3 buttons)
   */
  async sendInteractiveButtons(
    to: string,
    bodyText: string,
    buttons: InteractiveButton[],
    options?: { headerText?: string; footerText?: string }
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    const trimmedButtons = buttons.slice(0, 3);
    const payload: Record<string, any> = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: {
          buttons: trimmedButtons.map((b) => ({
            type: 'reply',
            reply: {
              id: b.id.slice(0, 256),
              title: b.title.slice(0, 20),
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
   * Sends interactive list message (Meta limit: max 10 rows)
   */
  async sendInteractiveList(
    to: string,
    bodyText: string,
    buttonText: string,
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
          button: buttonText.slice(0, 20),
          sections: sections.map((s) => ({
            title: s.title.slice(0, 24),
            rows: s.rows.slice(0, 10).map((r) => ({
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
   * Sends a genuine product package image
   */
  async sendImageMessage(
    to: string,
    imageUrl: string,
    caption?: string
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    return this.postToMessagesEndpoint({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'image',
      image: {
        link: imageUrl,
        ...(caption ? { caption } : {}),
      },
    });
  }

  /**
   * Sends pre-approved Meta Template message (for out-of-session notifications)
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode = 'en',
    components: TemplateComponent[] = []
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    return this.postToMessagesEndpoint({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    });
  }
}
