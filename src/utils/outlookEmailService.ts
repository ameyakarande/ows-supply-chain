import type { Attachment } from '../types';

const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';
const SESSION_STORAGE_KEY = 'marine-outlook-session';
const AUTH_SCOPES = ['offline_access', 'openid', 'profile', 'User.Read', 'Mail.ReadWrite', 'Mail.Send'];

const OUTLOOK_CLIENT_ID = import.meta.env.VITE_OUTLOOK_CLIENT_ID as string | undefined;
const OUTLOOK_TENANT_ID = (import.meta.env.VITE_OUTLOOK_TENANT_ID as string | undefined) || 'common';
const OUTLOOK_REDIRECT_PATH = (import.meta.env.VITE_OUTLOOK_REDIRECT_PATH as string | undefined) || '/outlook-auth-callback.html';

export interface OutlookSession {
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
    email?: string;
    displayName?: string;
    connectedAt: string;
}

export interface OutlookComposePayload {
    subject: string;
    bodyHtml: string;
    to: string[];
    cc: string[];
    bcc: string[];
    attachments: Attachment[];
}

interface TokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
}

interface GraphProfile {
    displayName?: string;
    mail?: string;
    userPrincipalName?: string;
}

function ensureConfigured() {
    if (!OUTLOOK_CLIENT_ID) {
        throw new Error('Outlook integration is not configured. Set VITE_OUTLOOK_CLIENT_ID in your environment.');
    }
}

function getRedirectUri() {
    return `${window.location.origin}${OUTLOOK_REDIRECT_PATH}`;
}

function base64UrlEncode(input: ArrayBuffer): string {
    const bytes = new Uint8Array(input);
    let binary = '';
    bytes.forEach(byte => {
        binary += String.fromCharCode(byte);
    });

    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256(value: string): Promise<string> {
    const encoded = new TextEncoder().encode(value);
    const digest = await window.crypto.subtle.digest('SHA-256', encoded);
    return base64UrlEncode(digest);
}

function randomString(length = 96): string {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => (byte % 36).toString(36)).join('');
}

function parseStoredSession(): OutlookSession | null {
    try {
        const raw = localStorage.getItem(SESSION_STORAGE_KEY);
        return raw ? JSON.parse(raw) as OutlookSession : null;
    } catch (error) {
        console.error('Failed to parse stored Outlook session', error);
        return null;
    }
}

function storeSession(session: OutlookSession | null) {
    if (!session) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return;
    }

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function buildRecipients(emails: string[]) {
    return emails
        .filter(Boolean)
        .map(address => ({
            emailAddress: {
                address
            }
        }));
}

function normalizeAttachments(attachments: Attachment[]) {
    return attachments.map(file => ({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: file.fileName,
        contentType: file.fileType,
        contentBytes: file.base64Data
    }));
}

function buildMessagePayload(payload: OutlookComposePayload) {
    return {
        subject: payload.subject,
        body: {
            contentType: 'HTML',
            content: payload.bodyHtml
        },
        toRecipients: buildRecipients(payload.to),
        ccRecipients: buildRecipients(payload.cc),
        bccRecipients: buildRecipients(payload.bcc),
        attachments: normalizeAttachments(payload.attachments)
    };
}

async function exchangeToken(body: URLSearchParams): Promise<TokenResponse> {
    const response = await fetch(`https://login.microsoftonline.com/${OUTLOOK_TENANT_ID}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
    });

    const payload = await response.json();
    if (!response.ok) {
        throw new Error(payload.error_description || payload.error || 'Outlook token exchange failed.');
    }

    return payload as TokenResponse;
}

async function fetchProfile(accessToken: string): Promise<GraphProfile> {
    const response = await fetch(`${GRAPH_BASE_URL}/me`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        throw new Error('Unable to load Outlook profile.');
    }

    return response.json() as Promise<GraphProfile>;
}

async function refreshSessionIfNeeded(session: OutlookSession): Promise<OutlookSession> {
    const now = Date.now();
    if (session.expiresAt - 60_000 > now) {
        return session;
    }

    if (!session.refreshToken) {
        throw new Error('Your Outlook session has expired. Please reconnect.');
    }

    ensureConfigured();

    const response = await exchangeToken(new URLSearchParams({
        client_id: OUTLOOK_CLIENT_ID!,
        grant_type: 'refresh_token',
        refresh_token: session.refreshToken,
        redirect_uri: getRedirectUri()
    }));

    const refreshed: OutlookSession = {
        ...session,
        accessToken: response.access_token,
        refreshToken: response.refresh_token || session.refreshToken,
        expiresAt: Date.now() + response.expires_in * 1000
    };

    storeSession(refreshed);
    return refreshed;
}

async function getAuthorizedSession(): Promise<OutlookSession> {
    const stored = parseStoredSession();
    if (!stored) {
        throw new Error('Connect Outlook before sending or saving drafts.');
    }

    return refreshSessionIfNeeded(stored);
}

export function isOutlookConfigured() {
    return Boolean(OUTLOOK_CLIENT_ID);
}

export function getStoredOutlookSession() {
    return parseStoredSession();
}

export function disconnectOutlook() {
    storeSession(null);
}

export async function connectOutlook(): Promise<OutlookSession> {
    ensureConfigured();

    const codeVerifier = randomString(64);
    const state = randomString(24);
    const challenge = await sha256(codeVerifier);
    const redirectUri = getRedirectUri();
    const authUrl = new URL(`https://login.microsoftonline.com/${OUTLOOK_TENANT_ID}/oauth2/v2.0/authorize`);

    authUrl.searchParams.set('client_id', OUTLOOK_CLIENT_ID!);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_mode', 'query');
    authUrl.searchParams.set('scope', AUTH_SCOPES.join(' '));
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', challenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    const popup = window.open(authUrl.toString(), 'marine-outlook-auth', 'width=620,height=780');
    if (!popup) {
        throw new Error('The Outlook sign-in popup was blocked by the browser.');
    }

    const message = await new Promise<{ code?: string; state?: string; error?: string; errorDescription?: string }>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
            window.removeEventListener('message', onMessage);
            reject(new Error('Outlook sign-in timed out.'));
        }, 120000);

        function onMessage(event: MessageEvent) {
            if (event.origin !== window.location.origin) return;
            const payload = event.data as { source?: string; code?: string; state?: string; error?: string; errorDescription?: string };
            if (!payload || payload.source !== 'marine-outlook-auth') return;

            window.clearTimeout(timeout);
            window.removeEventListener('message', onMessage);
            resolve(payload);
        }

        window.addEventListener('message', onMessage);
    });

    if (message.error) {
        throw new Error(message.errorDescription || message.error);
    }

    if (!message.code || message.state !== state) {
        throw new Error('Outlook authorization state validation failed.');
    }

    const token = await exchangeToken(new URLSearchParams({
        client_id: OUTLOOK_CLIENT_ID!,
        grant_type: 'authorization_code',
        code: message.code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier
    }));

    const profile = await fetchProfile(token.access_token);
    const session: OutlookSession = {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: Date.now() + token.expires_in * 1000,
        email: profile.mail || profile.userPrincipalName,
        displayName: profile.displayName,
        connectedAt: new Date().toISOString()
    };

    storeSession(session);
    return session;
}

async function graphRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
    const session = await getAuthorizedSession();
    const response = await fetch(`${GRAPH_BASE_URL}${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.accessToken}`,
            ...(init.headers || {})
        }
    });

    if (response.status === 204) {
        return undefined as T;
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error?.message || payload.error_description || 'Outlook request failed.');
    }

    return payload as T;
}

async function deleteDraftIfPresent(outlookDraftId?: string) {
    if (!outlookDraftId) return;

    try {
        await graphRequest<void>(`/me/messages/${outlookDraftId}`, {
            method: 'DELETE'
        });
    } catch (error) {
        console.warn('Unable to remove previous Outlook draft', error);
    }
}

export async function saveDraftToOutlook(payload: OutlookComposePayload, previousDraftId?: string): Promise<{ draftId: string }> {
    await deleteDraftIfPresent(previousDraftId);

    const response = await graphRequest<{ id: string }>('/me/messages', {
        method: 'POST',
        body: JSON.stringify({
            ...buildMessagePayload(payload),
            isDraft: true
        })
    });

    return { draftId: response.id };
}

export async function sendOutlookEmail(payload: OutlookComposePayload): Promise<{ messageId?: string }> {
    await graphRequest<void>('/me/sendMail', {
        method: 'POST',
        body: JSON.stringify({
            message: buildMessagePayload(payload),
            saveToSentItems: true
        })
    });

    return {};
}
