import type { AppUser } from '../context/AuthContext';
import type { Quotation } from '../types';
import { sendVendorNotification } from './emailService';

type ChannelStatus = 'sent' | 'mocked' | 'skipped' | 'failed';

export interface VendorNotificationDispatchResult {
    email: ChannelStatus;
    whatsapp: ChannelStatus;
    telegram: ChannelStatus;
}

const EMAIL_WEBHOOK = import.meta.env.VITE_VENDOR_EMAIL_WEBHOOK_URL as string | undefined;
const WHATSAPP_WEBHOOK = import.meta.env.VITE_VENDOR_WHATSAPP_WEBHOOK_URL as string | undefined;
const TELEGRAM_WEBHOOK = import.meta.env.VITE_VENDOR_TELEGRAM_WEBHOOK_URL as string | undefined;

const buildMessage = (quotation: Quotation) =>
    `New quotation request ${quotation.rfqNo} for ${quotation.vessel} at ${quotation.port}. Please review and submit your quote.`;

async function postToWebhook(url: string, payload: Record<string, unknown>): Promise<boolean> {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    return response.ok;
}

function buildTelegramSendUrl(rawUrl: string): string {
    if (rawUrl.includes('/sendMessage')) {
        return rawUrl;
    }

    if (rawUrl.includes('/getWebhookInfo')) {
        return rawUrl.replace('/getWebhookInfo', '/sendMessage');
    }

    return rawUrl.endsWith('/') ? `${rawUrl}sendMessage` : `${rawUrl}/sendMessage`;
}

export async function sendVendorMultiChannelNotification(
    quotation: Quotation,
    vendor?: AppUser
): Promise<VendorNotificationDispatchResult> {
    const payload = {
        rfqNo: quotation.rfqNo,
        supplier: quotation.supplier,
        supplierEmail: quotation.supplierEmail,
        whatsappNumber: vendor?.whatsappNumber,
        telegramUsername: vendor?.telegramUsername,
        vessel: quotation.vessel,
        port: quotation.port,
        message: buildMessage(quotation)
    };

    let email: ChannelStatus = 'skipped';
    if (quotation.supplierEmail) {
        if (EMAIL_WEBHOOK) {
            try {
                email = await postToWebhook(EMAIL_WEBHOOK, { channel: 'email', ...payload }) ? 'sent' : 'failed';
            } catch (error) {
                console.error('Email webhook failed', error);
                email = 'failed';
            }
        } else {
            email = await sendVendorNotification(quotation) ? 'mocked' : 'failed';
        }
    }

    let whatsapp: ChannelStatus = 'skipped';
    if (vendor?.whatsappNumber) {
        if (WHATSAPP_WEBHOOK) {
            try {
                whatsapp = await postToWebhook(WHATSAPP_WEBHOOK, { channel: 'whatsapp', ...payload }) ? 'sent' : 'failed';
            } catch (error) {
                console.error('WhatsApp webhook failed', error);
                whatsapp = 'failed';
            }
        } else {
            console.log(`[WhatsAppService] Simulated WhatsApp notification to ${vendor.whatsappNumber} for ${quotation.rfqNo}`);
            whatsapp = 'mocked';
        }
    }

    let telegram: ChannelStatus = 'skipped';
    if (vendor?.telegramUsername) {
        if (TELEGRAM_WEBHOOK) {
            try {
                const telegramChatId = vendor.telegramUsername.startsWith('@')
                    ? vendor.telegramUsername
                    : `@${vendor.telegramUsername}`;
                const telegramUrl = buildTelegramSendUrl(TELEGRAM_WEBHOOK);
                telegram = await postToWebhook(telegramUrl, {
                    chat_id: telegramChatId,
                    text: payload.message
                }) ? 'sent' : 'failed';
            } catch (error) {
                console.error('Telegram webhook failed', error);
                telegram = 'failed';
            }
        } else {
            console.log(`[TelegramService] Simulated Telegram notification to @${vendor.telegramUsername.replace(/^@/, '')} for ${quotation.rfqNo}`);
            telegram = 'mocked';
        }
    }

    return { email, whatsapp, telegram };
}
