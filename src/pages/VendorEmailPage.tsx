import { useEffect, useMemo, useState } from 'react';
import type { AppUser } from '../context/AuthContext';
import type { Attachment, EmailDraft, EmailMessageRecord, EmailSignature, EmailTemplate } from '../types';
import { ArrowLeft, Bell, Check, Eye, Mail, Paperclip, PenSquare, Plus, Save, Send, Signature, Trash2, Users, LayoutTemplate, X } from 'lucide-react';
import { Button } from '../components/common/Button';
import { connectOutlook, disconnectOutlook, getStoredOutlookSession, isOutlookConfigured, saveDraftToOutlook, sendOutlookEmail, type OutlookSession } from '../utils/outlookEmailService';

interface VendorEmailPageProps {
    currentUser: AppUser;
    users: AppUser[];
    drafts: EmailDraft[];
    signatures: EmailSignature[];
    messages: EmailMessageRecord[];
    templates: EmailTemplate[];
    onBack: () => void;
    onSaveDrafts: (drafts: EmailDraft[]) => void;
    onSaveSignatures: (signatures: EmailSignature[]) => void;
    onSaveMessages: (messages: EmailMessageRecord[]) => void;
    onSaveTemplates: (templates: EmailTemplate[]) => void;
}

interface ComposerState {
    id: string | null;
    name: string;
    subject: string;
    body: string;
    toVendorEmails: string[];
    bulkRecipientInput: string;
    ccInput: string;
    bccInput: string;
    signatureId: string;
    attachments: Attachment[];
    outlookDraftId?: string;
}

function escapeHtml(text: string) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function toHtmlParagraphs(text: string) {
    return escapeHtml(text).replace(/\n/g, '<br />');
}

function parseAddressList(value: string) {
    return value.split(/[;,]/).map(part => part.trim()).filter(Boolean);
}

function createEmptyComposer(defaultSignatureId = ''): ComposerState {
    return {
        id: null,
        name: `Draft ${new Date().toLocaleString()}`,
        subject: '',
        body: '',
        toVendorEmails: [],
        bulkRecipientInput: '',
        ccInput: '',
        bccInput: '',
        signatureId: defaultSignatureId,
        attachments: []
    };
}

function readFileAsAttachment(file: File): Promise<Attachment> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = typeof reader.result === 'string' ? reader.result : '';
            resolve({
                id: `email-att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                fileName: file.name,
                fileType: file.type || 'application/octet-stream',
                base64Data: result.includes(',') ? result.split(',')[1] : result
            });
        };
        reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
        reader.readAsDataURL(file);
    });
}

function stripAttachmentPayloads(attachments: Attachment[]): Attachment[] {
    return attachments.map(attachment => ({
        ...attachment,
        base64Data: ''
    }));
}

function buildSignatureHtml(signature?: EmailSignature) {
    if (!signature) return '';

    const logoHtml = signature.logoUrl 
        ? `<div style="margin-bottom: 10px;"><img src="${signature.logoUrl}" alt="Logo" style="width: ${signature.logoWidth || 180}px; max-width: 100%; height: auto;" /></div>`
        : '';

    if (signature.layout === 'business-card') {
        return `
            <div class="signature-block">
                ${logoHtml}
                <div style="margin-bottom: 20px;">
                    <div>${escapeHtml(signature.signOff || 'Regards,')}</div>
                    <div>${escapeHtml(signature.senderName || '')}</div>
                </div>
                <div style="display:flex; gap:18px; align-items:flex-start;">
                    <div style="min-width:220px; text-align:center;">
                        ${!signature.logoUrl ? `<img src="${window.location.origin}/logo.png" alt="OceanWharf" style="width:180px; max-width:100%; display:block; margin:0 auto 6px;" />` : ''}
                        <div style="font-weight:800; font-size:26px; letter-spacing:1px;">OCEANWHARF</div>
                    </div>
                    <div style="border-left:1px solid #bfc6d4; padding-left:18px; line-height:1.45;">
                        <div style="font-weight:800; font-size:18px;">${escapeHtml(signature.companyName || 'OceanWharf Shipping Services')}</div>
                        <div>${escapeHtml(signature.addressLine || '20 Collyer Quay, #09-01, Singapore, 049319')}</div>
                        <div>Tel&nbsp;&nbsp;&nbsp;&nbsp;: ${escapeHtml(signature.phonePrimary || '+65 6727 8393')}</div>
                        <div>Mob : ${escapeHtml(signature.phoneSecondary || '+65 8630 4675')}</div>
                        <div>Email : <a href="mailto:${escapeHtml(signature.emailAddress || 'operations@oceanwharfshipping.com')}">${escapeHtml(signature.emailAddress || 'operations@oceanwharfshipping.com')}</a></div>
                        <div>Web : <a href="${escapeHtml(signature.websiteUrl || 'https://www.oceanwharfshipping.com')}" target="_blank" rel="noreferrer">${escapeHtml((signature.websiteUrl || 'www.oceanwharfshipping.com').replace(/^https?:\/\//, ''))}</a></div>
                        <div style="color:#ff0000; font-weight:800; font-size:16px;">ShipServ Tradenet ID: ${escapeHtml(signature.tradeId || '307312')}</div>
                    </div>
                </div>
                <div style="margin-top:14px; color:#1b8f49; font-size:14px;">${escapeHtml(signature.environmentNote || 'Please consider the environment before printing this e-mail!')}</div>
            </div>
        `;
    }

    return `<div>${logoHtml}${toHtmlParagraphs(signature.content)}</div>`;
}

export default function VendorEmailPage({
    currentUser,
    users,
    drafts,
    signatures,
    messages,
    templates,
    onBack,
    onSaveDrafts,
    onSaveSignatures,
    onSaveMessages,
    onSaveTemplates
}: VendorEmailPageProps) {
    const vendorUsers = useMemo(
        () => users.filter(user => user.role === 'vendor').sort((a, b) => a.displayName.localeCompare(b.displayName)),
        [users]
    );
    const categoryOptions = useMemo(
        () => Array.from(new Set(vendorUsers.flatMap(user => user.categories || []))).sort((a, b) => a.localeCompare(b)),
        [vendorUsers]
    );
    const signatureOptions = useMemo(
        () => signatures.filter(signature => signature.ownerEmail === currentUser.email).sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || b.updatedAt.localeCompare(a.updatedAt)),
        [currentUser.email, signatures]
    );
    const draftOptions = useMemo(
        () => drafts.filter(draft => draft.createdBy === currentUser.email).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        [currentUser.email, drafts]
    );
    const templateOptions = useMemo(
        () => templates.filter(template => template.createdBy === currentUser.email).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        [currentUser.email, templates]
    );
    const messageHistory = useMemo(
        () => messages.filter(message => message.createdBy === currentUser.email).sort((a, b) => (b.sentAt || b.createdAt).localeCompare(a.sentAt || a.createdAt)),
        [currentUser.email, messages]
    );

    const defaultSignature = signatureOptions.find(signature => signature.isDefault) || signatureOptions[0];
    const [composer, setComposer] = useState<ComposerState>(() => createEmptyComposer(defaultSignature?.id || ''));
    const [signatureName, setSignatureName] = useState('');
    const [signatureContent, setSignatureContent] = useState('');
    const [editingSignatureId, setEditingSignatureId] = useState<string | null>(null);
    const [signatureLayout, setSignatureLayout] = useState<'simple' | 'business-card'>('business-card');
    const [signatureSignOff, setSignatureSignOff] = useState('Regards,');
    const [signatureSenderName, setSignatureSenderName] = useState(currentUser.displayName);
    const [signatureCompanyName, setSignatureCompanyName] = useState('OceanWharf Shipping Services');
    const [signatureAddressLine, setSignatureAddressLine] = useState('20 Collyer Quay, #09-01, Singapore, 049319');
    const [signaturePhonePrimary, setSignaturePhonePrimary] = useState('+65 6727 8393');
    const [signaturePhoneSecondary, setSignaturePhoneSecondary] = useState('+65 8630 4675');
    const [signatureEmailAddress, setSignatureEmailAddress] = useState('operations@oceanwharfshipping.com');
    const [signatureWebsiteUrl, setSignatureWebsiteUrl] = useState('https://www.oceanwharfshipping.com');
    const [signatureTradeId, setSignatureTradeId] = useState('307312');
    const [signatureEnvironmentNote, setSignatureEnvironmentNote] = useState('Please consider the environment before printing this e-mail!');
    const [signatureLogoUrl, setSignatureLogoUrl] = useState('');
    const [signatureLogoWidth, setSignatureLogoWidth] = useState(180);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isBusy, setIsBusy] = useState(false);
    const [outlookSession, setOutlookSession] = useState<OutlookSession | null>(() => getStoredOutlookSession());

    useEffect(() => {
        if (signatureOptions.length > 0) return;

        const now = new Date().toISOString();
        onSaveSignatures([
            ...signatures,
            {
                id: `sig-${Date.now()}`,
                name: 'Default Signature',
                content: `Regards,\n${currentUser.displayName}`,
                layout: 'business-card',
                signOff: 'Regards,',
                senderName: currentUser.displayName,
                companyName: 'OceanWharf Shipping Services',
                addressLine: '20 Collyer Quay, #09-01, Singapore, 049319',
                phonePrimary: '+65 6727 8393',
                phoneSecondary: '+65 8630 4675',
                emailAddress: 'operations@oceanwharfshipping.com',
                websiteUrl: 'https://www.oceanwharfshipping.com',
                tradeId: '307312',
                environmentNote: 'Please consider the environment before printing this e-mail!',
                isDefault: true,
                ownerEmail: currentUser.email,
                createdAt: now,
                updatedAt: now
            }
        ]);
    }, [currentUser.displayName, currentUser.email, onSaveSignatures, signatureOptions.length, signatures]);

    useEffect(() => {
        setComposer(prev => prev.signatureId ? prev : { ...prev, signatureId: defaultSignature?.id || '' });
    }, [defaultSignature?.id]);

    const selectedSignature = signatureOptions.find(signature => signature.id === composer.signatureId);
    const composedHtml = `${toHtmlParagraphs(composer.body)}${selectedSignature ? `<br /><br />${buildSignatureHtml(selectedSignature)}` : ''}`;
    const combinedRecipientEmails = useMemo(
        () => Array.from(new Set([...composer.toVendorEmails, ...parseAddressList(composer.bulkRecipientInput)])),
        [composer.bulkRecipientInput, composer.toVendorEmails]
    );

    const loadDraft = (draft: EmailDraft) => {
        const vendorEmailSet = new Set(vendorUsers.map(vendor => vendor.email));
        setComposer({
            id: draft.id,
            name: draft.name,
            subject: draft.subject,
            body: draft.body,
            toVendorEmails: draft.toVendorEmails.filter(email => vendorEmailSet.has(email)),
            bulkRecipientInput: draft.toVendorEmails.filter(email => !vendorEmailSet.has(email)).join(', '),
            ccInput: draft.cc.join(', '),
            bccInput: draft.bcc.join(', '),
            signatureId: draft.signatureId || defaultSignature?.id || '',
            attachments: draft.attachments || [],
            outlookDraftId: draft.outlookDraftId
        });
        setStatusMessage(`Loaded draft "${draft.name}".`);
        setErrorMessage('');
    };

    const resetComposer = () => {
        setComposer(createEmptyComposer(defaultSignature?.id || ''));
        setStatusMessage('Started a new draft.');
        setErrorMessage('');
    };

    const toggleVendor = (email: string) => {
        setComposer(prev => ({
            ...prev,
            toVendorEmails: prev.toVendorEmails.includes(email)
                ? prev.toVendorEmails.filter(item => item !== email)
                : [...prev.toVendorEmails, email]
        }));
    };

    const toggleCategory = (category: string) => {
        setSelectedCategories(prev => prev.includes(category) ? prev.filter(item => item !== category) : [...prev, category]);
    };

    const addSelectedCategories = () => {
        const categoryEmails = vendorUsers
            .filter(user => selectedCategories.some(category => (user.categories || []).includes(category)))
            .map(user => user.email);
        setComposer(prev => ({
            ...prev,
            toVendorEmails: Array.from(new Set([...prev.toVendorEmails, ...categoryEmails]))
        }));
        setStatusMessage(`Added ${categoryEmails.length} vendor${categoryEmails.length === 1 ? '' : 's'} from selected categories.`);
        setErrorMessage('');
    };

    const saveSignature = () => {
        if (!signatureName.trim()) {
            setErrorMessage('Signature name is required.');
            setStatusMessage('');
            return;
        }

        const existing = editingSignatureId
            ? signatures.find(signature => signature.id === editingSignatureId)
            : undefined;
        const now = new Date().toISOString();
        const nextSignature: EmailSignature = {
            id: editingSignatureId || `sig-${Date.now()}`,
            name: signatureName.trim(),
            content: signatureContent.trim(),
            layout: signatureLayout,
            signOff: signatureSignOff.trim(),
            senderName: signatureSenderName.trim(),
            companyName: signatureCompanyName.trim(),
            addressLine: signatureAddressLine.trim(),
            phonePrimary: signaturePhonePrimary.trim(),
            phoneSecondary: signaturePhoneSecondary.trim(),
            emailAddress: signatureEmailAddress.trim(),
            websiteUrl: signatureWebsiteUrl.trim(),
            tradeId: signatureTradeId.trim(),
            environmentNote: signatureEnvironmentNote.trim(),
            logoUrl: signatureLogoUrl.trim(),
            logoWidth: signatureLogoWidth,
            isDefault: existing?.isDefault || signatureOptions.length === 0,
            ownerEmail: currentUser.email,
            createdAt: existing?.createdAt || now,
            updatedAt: now
        };

        onSaveSignatures([...signatures.filter(signature => signature.id !== nextSignature.id), nextSignature]);
        setComposer(prev => ({ ...prev, signatureId: nextSignature.id }));
        setSignatureName('');
        setSignatureContent('');
        setSignatureLayout('business-card');
        setSignatureLogoUrl('');
        setSignatureLogoWidth(180);
        setEditingSignatureId(null);
        setIsSignatureModalOpen(false);
        setStatusMessage(`Signature "${nextSignature.name}" saved.`);
        setErrorMessage('');
    };

    const handleRemind = (message: EmailMessageRecord) => {
        setComposer({
            id: null,
            name: `Reminder: ${message.subject}`,
            subject: `Reminder: ${message.subject}`,
            body: `(Original message below)\n\n---\n\n${message.body}`,
            toVendorEmails: [...message.toVendorEmails],
            bulkRecipientInput: '',
            ccInput: (message.cc || []).join(', '),
            bccInput: (message.bcc || []).join(', '),
            signatureId: message.signatureId || defaultSignature?.id || '',
            attachments: []
        });
        setStatusMessage('Composer pre-filled for reminder. You can now edit and choose recipients.');
        setErrorMessage('');
    };

    const saveTemplate = () => {
        if (!templateName.trim() || !composer.subject.trim() || !composer.body.trim()) {
            setErrorMessage('Template name, subject, and message are required.');
            setStatusMessage('');
            return;
        }

        const existing = editingTemplateId ? templateOptions.find(template => template.id === editingTemplateId) : undefined;
        const now = new Date().toISOString();
        const nextTemplate: EmailTemplate = {
            id: editingTemplateId || `template-${Date.now()}`,
            name: templateName.trim(),
            subject: composer.subject.trim(),
            body: composer.body,
            cc: parseAddressList(composer.ccInput),
            bcc: parseAddressList(composer.bccInput),
            signatureId: composer.signatureId || undefined,
            createdBy: currentUser.email,
            createdAt: existing?.createdAt || now,
            updatedAt: now
        };

        onSaveTemplates([nextTemplate, ...templates.filter(template => template.id !== nextTemplate.id)]);
        setTemplateName('');
        setEditingTemplateId(null);
        setStatusMessage(`Template "${nextTemplate.name}" saved.`);
        setErrorMessage('');
    };

    const loadTemplate = (template: EmailTemplate) => {
        setComposer(prev => ({
            ...prev,
            subject: template.subject,
            body: template.body,
            ccInput: template.cc.join(', '),
            bccInput: template.bcc.join(', '),
            signatureId: template.signatureId || prev.signatureId
        }));
        setTemplateName(template.name);
        setEditingTemplateId(template.id);
        setStatusMessage(`Template "${template.name}" loaded.`);
        setErrorMessage('');
    };

    const deleteTemplate = (templateId: string) => {
        if (!window.confirm('Delete this email template?')) return;
        onSaveTemplates(templates.filter(template => template.id !== templateId));
        if (editingTemplateId === templateId) {
            setEditingTemplateId(null);
            setTemplateName('');
        }
    };

    const deleteMessage = (messageId: string) => {
        if (!window.confirm('Delete this recent activity entry?')) return;
        onSaveMessages(messages.filter(message => message.id !== messageId));
        setStatusMessage('Recent activity deleted.');
        setErrorMessage('');
    };

    const setDefaultSignature = (signatureId: string) => {
        onSaveSignatures(
            signatures.map(signature => signature.ownerEmail !== currentUser.email
                ? signature
                : { ...signature, isDefault: signature.id === signatureId, updatedAt: new Date().toISOString() })
        );
        setComposer(prev => ({ ...prev, signatureId }));
        setStatusMessage('Default signature updated.');
        setErrorMessage('');
    };

    const deleteSignature = (signatureId: string) => {
        if (!window.confirm('Delete this signature?')) return;
        onSaveSignatures(signatures.filter(signature => signature.id !== signatureId));
        if (composer.signatureId === signatureId) {
            setComposer(prev => ({ ...prev, signatureId: '' }));
        }
        setStatusMessage('Signature deleted.');
        setErrorMessage('');
    };

    const connectMailbox = async () => {
        try {
            setIsBusy(true);
            const session = await connectOutlook();
            setOutlookSession(session);
            setStatusMessage(`Connected to Outlook as ${session.email || session.displayName || 'your account'}.`);
            setErrorMessage('');
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to connect Outlook.');
            setStatusMessage('');
        } finally {
            setIsBusy(false);
        }
    };

    const disconnectMailbox = () => {
        disconnectOutlook();
        setOutlookSession(null);
        setStatusMessage('Outlook connection removed from this browser.');
        setErrorMessage('');
    };

    const ensureValidComposer = () => {
        if (combinedRecipientEmails.length === 0) {
            throw new Error('Select at least one vendor recipient.');
        }
        if (!composer.subject.trim()) {
            throw new Error('Enter an email subject.');
        }
        if (!composer.body.trim()) {
            throw new Error('Enter an email message.');
        }
    };

    const buildDraftRecord = (status: EmailDraft['status'], provider: EmailDraft['provider'], outlookDraftId?: string, lastError?: string): EmailDraft => {
        const timestamp = new Date().toISOString();
        return {
            id: composer.id || `draft-${Date.now()}`,
            name: composer.name.trim() || `Draft ${new Date().toLocaleString()}`,
            subject: composer.subject.trim(),
            body: composer.body,
            toVendorEmails: combinedRecipientEmails,
            cc: parseAddressList(composer.ccInput),
            bcc: parseAddressList(composer.bccInput),
            signatureId: composer.signatureId || undefined,
            attachments: composer.attachments,
            outlookDraftId,
            status,
            provider,
            createdBy: currentUser.email,
            createdAt: composer.id ? drafts.find(draft => draft.id === composer.id)?.createdAt || timestamp : timestamp,
            updatedAt: timestamp,
            lastSyncedAt: provider === 'outlook-graph' ? timestamp : undefined,
            lastSentAt: status === 'sent' ? timestamp : undefined,
            lastError
        };
    };

    const persistDraft = async () => {
        ensureValidComposer();

        let outlookDraftId = composer.outlookDraftId;
        let provider: EmailDraft['provider'] = 'local';

        if (outlookSession) {
            const outlookDraft = await saveDraftToOutlook({
                subject: composer.subject.trim(),
                bodyHtml: composedHtml,
                to: combinedRecipientEmails,
                cc: parseAddressList(composer.ccInput),
                bcc: parseAddressList(composer.bccInput),
                attachments: composer.attachments
            }, composer.outlookDraftId);
            outlookDraftId = outlookDraft.draftId;
            provider = 'outlook-graph';
        }

        const nextDraft = buildDraftRecord('draft', provider, outlookDraftId);
        onSaveDrafts([nextDraft, ...drafts.filter(draft => draft.id !== nextDraft.id)]);
        setComposer(prev => ({ ...prev, id: nextDraft.id, name: nextDraft.name, outlookDraftId: nextDraft.outlookDraftId }));
        setStatusMessage(provider === 'outlook-graph' ? 'Draft saved locally and in Outlook Drafts.' : 'Draft saved locally.');
        setErrorMessage('');
    };

    const sendMessage = async () => {
        ensureValidComposer();
        if (!outlookSession) {
            throw new Error('Connect Outlook before sending mail.');
        }

        const cc = parseAddressList(composer.ccInput);
        const bcc = parseAddressList(composer.bccInput);
        const sentAt = new Date().toISOString();
        const lightweightAttachments = stripAttachmentPayloads(composer.attachments);

        for (const vendorEmail of combinedRecipientEmails) {
            await sendOutlookEmail({
                subject: composer.subject.trim(),
                bodyHtml: composedHtml,
                to: [vendorEmail],
                cc,
                bcc,
                attachments: composer.attachments
            });
        }

        const sentDraft = {
            ...buildDraftRecord('sent', 'outlook-graph', composer.outlookDraftId),
            attachments: lightweightAttachments,
            lastSentAt: sentAt
        };
        onSaveDrafts(drafts.filter(draft => draft.id !== sentDraft.id));
        onSaveMessages([
            {
                id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                draftId: sentDraft.id,
                subject: sentDraft.subject,
                body: sentDraft.body,
                toVendorEmails: combinedRecipientEmails,
                cc: sentDraft.cc,
                bcc: sentDraft.bcc,
                signatureId: sentDraft.signatureId,
                attachments: lightweightAttachments,
                status: 'sent' as const,
                provider: 'outlook-graph' as const,
                createdBy: currentUser.email,
                createdAt: sentAt,
                sentAt
            },
            ...messages
        ]);
        resetComposer();
        setStatusMessage(`Sent ${combinedRecipientEmails.length} individual email${combinedRecipientEmails.length === 1 ? '' : 's'} through Outlook.`);
        setErrorMessage('');
        window.alert(`Email sent successfully to ${combinedRecipientEmails.length} recipient${combinedRecipientEmails.length === 1 ? '' : 's'}.`);
    };

    const sendReminder = async (message: EmailMessageRecord) => {
        if (!outlookSession) {
            throw new Error('Connect Outlook before sending reminders.');
        }

        const reminderSentAt = new Date().toISOString();

        for (const recipientEmail of message.toVendorEmails) {
            await sendOutlookEmail({
                subject: `Reminder: ${message.subject}`,
                bodyHtml: `${toHtmlParagraphs(message.body)}<br /><br /><strong>This is a reminder email.</strong>`,
                to: [recipientEmail],
                cc: message.cc,
                bcc: message.bcc,
                attachments: message.attachments.filter(attachment => attachment.base64Data)
            });
        }

        onSaveMessages([
            {
                ...message,
                id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                subject: `Reminder: ${message.subject}`,
                createdAt: reminderSentAt,
                sentAt: reminderSentAt
            },
            ...messages
        ]);

        setStatusMessage(`Reminder sent to ${message.toVendorEmails.length} recipient${message.toVendorEmails.length === 1 ? '' : 's'}.`);
        setErrorMessage('');
        window.alert(`Reminder sent successfully to ${message.toVendorEmails.length} recipient${message.toVendorEmails.length === 1 ? '' : 's'}.`);
    };

    const deleteDraft = (draftId: string) => {
        if (!window.confirm('Delete this saved draft from the app?')) return;
        onSaveDrafts(drafts.filter(draft => draft.id !== draftId));
        if (composer.id === draftId) {
            resetComposer();
        }
    };

    const handleAttachmentUpload = async (files: FileList | null) => {
        if (!files?.length) return;

        try {
            setIsBusy(true);
            const loaded = await Promise.all(Array.from(files).map(readFileAsAttachment));
            setComposer(prev => ({ ...prev, attachments: [...prev.attachments, ...loaded] }));
            setStatusMessage(`${loaded.length} attachment${loaded.length === 1 ? '' : 's'} added.`);
            setErrorMessage('');
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to attach file.');
            setStatusMessage('');
        } finally {
            setIsBusy(false);
        }
    };

    const runAsyncAction = async (action: () => Promise<void>) => {
        try {
            setIsBusy(true);
            await action();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'The email action failed.');
            setStatusMessage('');
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <div className="email-page">
            <div className="email-header">
                <div>
                    <div className="email-header-actions">
                        <Button variant="secondary" onClick={onBack}>
                            <ArrowLeft size={15} style={{ marginRight: 6 }} />
                            Back
                        </Button>
                        <span className="email-header-badge">
                            <Mail size={14} />
                            Outlook Vendor Mail
                        </span>
                    </div>
                    <h2>Vendor Email Composer</h2>
                    <p>Compose, save drafts, attach files, manage signatures, and send to selected vendors from your Outlook mailbox.</p>
                </div>
                <div className="email-connection-card">
                    <div className="email-connection-title">Outlook connection</div>
                    <div className={`email-connection-state ${outlookSession ? 'connected' : 'disconnected'}`}>
                        {outlookSession ? `Connected: ${outlookSession.email || outlookSession.displayName || 'Outlook account'}` : 'Not connected'}
                    </div>
                    <div className="email-connection-actions">
                        <Button variant="primary" onClick={connectMailbox} disabled={isBusy || !isOutlookConfigured()}>
                            Connect Outlook
                        </Button>
                        <Button variant="secondary" onClick={disconnectMailbox} disabled={isBusy || !outlookSession}>
                            Disconnect
                        </Button>
                    </div>
                    {!isOutlookConfigured() && (
                        <div className="email-config-note">Set `VITE_OUTLOOK_CLIENT_ID` to enable live Outlook sending.</div>
                    )}
                </div>
            </div>

            {(statusMessage || errorMessage) && (
                <div className={`email-feedback ${errorMessage ? 'error' : 'success'}`}>
                    {errorMessage || statusMessage}
                </div>
            )}

            <div className="email-layout">
                <aside className="email-sidebar">
                    <div className="email-panel">
                        <div className="email-panel-header">
                            <span><Users size={15} /> Recipients</span>
                            <div className="email-inline-actions">
                                <button type="button" onClick={() => setComposer(prev => ({ ...prev, toVendorEmails: vendorUsers.map(vendor => vendor.email) }))}>Select all</button>
                                <button type="button" onClick={() => setComposer(prev => ({ ...prev, toVendorEmails: [] }))}>Clear</button>
                            </div>
                        </div>
                        <div className="email-vendor-list">
                            {vendorUsers.map(vendor => (
                                <label key={vendor.id} className="email-vendor-row">
                                    <input type="checkbox" checked={composer.toVendorEmails.includes(vendor.email)} onChange={() => toggleVendor(vendor.email)} />
                                    <div>
                                        <div className="email-vendor-name">{vendor.displayName}</div>
                                        <div className="email-vendor-email">{vendor.email}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <div className="email-recipient-tools">
                            <div className="email-field-group">
                                <label>Choose by categories</label>
                                <div className="email-category-list">
                                    {categoryOptions.length === 0 && <span className="email-empty-note">No vendor categories available yet.</span>}
                                    {categoryOptions.map(category => (
                                        <button
                                            key={category}
                                            type="button"
                                            className={`email-category-chip ${selectedCategories.includes(category) ? 'active' : ''}`}
                                            onClick={() => toggleCategory(category)}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                                <div className="email-inline-actions">
                                    <button type="button" onClick={addSelectedCategories} disabled={selectedCategories.length === 0}>Add category vendors</button>
                                    <button type="button" onClick={() => setSelectedCategories([])} disabled={selectedCategories.length === 0}>Clear categories</button>
                                </div>
                            </div>
                            <div className="email-field-group">
                                <label>Paste bulk email IDs</label>
                                <textarea
                                    className="form-textarea"
                                    rows={4}
                                    value={composer.bulkRecipientInput}
                                    onChange={event => setComposer(prev => ({ ...prev, bulkRecipientInput: event.target.value }))}
                                    placeholder="vendor1@example.com, vendor2@example.com or one per line"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="email-panel">
                        <div className="email-panel-header">
                            <span><Save size={15} /> Drafts</span>
                            <button type="button" onClick={resetComposer}>New</button>
                        </div>
                        <div className="email-sidebar-list">
                            {draftOptions.length === 0 && <div className="email-empty-note">No saved drafts yet.</div>}
                            {draftOptions.map(draft => (
                                <div key={draft.id} className="email-sidebar-item">
                                    <button type="button" className="email-sidebar-main" onClick={() => loadDraft(draft)}>
                                        <strong>{draft.subject || draft.name}</strong>
                                        <span>{draft.toVendorEmails.length} vendor{draft.toVendorEmails.length === 1 ? '' : 's'} · {draft.status}</span>
                                    </button>
                                    <button type="button" className="email-icon-button" onClick={() => deleteDraft(draft.id)} title="Delete draft">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="email-panel">
                        <div className="email-panel-header">
                            <span><LayoutTemplate size={15} /> Templates</span>
                        </div>
                        <div className="email-signature-editor">
                            <input
                                className="form-input"
                                value={templateName}
                                onChange={event => setTemplateName(event.target.value)}
                                placeholder="Template name"
                            />
                            <div className="email-signature-actions">
                                <Button variant="secondary" onClick={saveTemplate}>
                                    {editingTemplateId ? 'Update Template' : 'Save Template'}
                                </Button>
                                {editingTemplateId && (
                                    <Button variant="secondary" onClick={() => { setEditingTemplateId(null); setTemplateName(''); }}>
                                        Cancel
                                    </Button>
                                )}
                            </div>
                            <div className="email-sidebar-list">
                                {templateOptions.length === 0 && <div className="email-empty-note">No templates saved yet.</div>}
                                {templateOptions.map(template => (
                                    <div key={template.id} className="email-sidebar-item">
                                        <button type="button" className="email-sidebar-main" onClick={() => loadTemplate(template)}>
                                            <strong>{template.name}</strong>
                                            <span>{template.subject}</span>
                                        </button>
                                        <button type="button" className="email-icon-button" onClick={() => deleteTemplate(template.id)} title="Delete template">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="email-panel">
                        <div className="email-panel-header">
                            <span><Signature size={15} /> Signatures</span>
                            <button 
                                type="button" 
                                onClick={() => {
                                    setEditingSignatureId(null);
                                    setSignatureName('');
                                    setSignatureContent('');
                                    setSignatureLogoUrl('');
                                    setSignatureLogoWidth(180);
                                    setIsSignatureModalOpen(true);
                                }}
                            >
                                Add New
                            </button>
                        </div>
                        <div className="email-sidebar-list">
                            {signatureOptions.length === 0 && <div className="email-empty-note">No signatures yet.</div>}
                            {signatureOptions.map(signature => (
                                <div key={signature.id} className="email-sidebar-item">
                                    <button
                                        type="button"
                                        className="email-sidebar-main"
                                        onClick={() => {
                                            setEditingSignatureId(signature.id);
                                            setSignatureName(signature.name);
                                            setSignatureContent(signature.content);
                                            setSignatureLayout(signature.layout || 'simple');
                                            setSignatureSignOff(signature.signOff || 'Regards,');
                                            setSignatureSenderName(signature.senderName || currentUser.displayName);
                                            setSignatureCompanyName(signature.companyName || 'OceanWharf Shipping Services');
                                            setSignatureAddressLine(signature.addressLine || '20 Collyer Quay, #09-01, Singapore, 049319');
                                            setSignaturePhonePrimary(signature.phonePrimary || '+65 6727 8393');
                                            setSignaturePhoneSecondary(signature.phoneSecondary || '+65 8630 4675');
                                            setSignatureEmailAddress(signature.emailAddress || 'operations@oceanwharfshipping.com');
                                            setSignatureWebsiteUrl(signature.websiteUrl || 'https://www.oceanwharfshipping.com');
                                            setSignatureTradeId(signature.tradeId || '307312');
                                            setSignatureEnvironmentNote(signature.environmentNote || 'Please consider the environment before printing this e-mail!');
                                            setSignatureLogoUrl(signature.logoUrl || '');
                                            setSignatureLogoWidth(signature.logoWidth || 180);
                                            setIsSignatureModalOpen(true);
                                        }}
                                    >
                                        <strong>{signature.name}</strong>
                                        <span>{signature.isDefault ? 'Default' : 'Saved'}</span>
                                    </button>
                                    <div className="email-inline-icon-actions">
                                        <button type="button" className="email-icon-button" onClick={() => setDefaultSignature(signature.id)} title="Set Default">
                                            <Check size={14} />
                                        </button>
                                        <button type="button" className="email-icon-button" onClick={() => deleteSignature(signature.id)} title="Delete">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {isSignatureModalOpen && (
                    <div className="signature-modal-overlay">
                        <div className="signature-modal">
                            <div className="signature-modal-header">
                                <h3>{editingSignatureId ? 'Edit Signature' : 'Add New Signature'}</h3>
                                <button type="button" onClick={() => setIsSignatureModalOpen(false)}><X size={20} /></button>
                            </div>
                            <div className="signature-modal-body">
                                <div className="signature-grid">
                                    <div className="signature-fields">
                                        <div className="email-field-group">
                                            <label>Signature name</label>
                                            <input className="form-input" value={signatureName} onChange={event => setSignatureName(event.target.value)} placeholder="e.g. Standard Business" />
                                        </div>
                                        <div className="email-field-group">
                                            <label>Layout</label>
                                            <select className="form-select" value={signatureLayout} onChange={event => setSignatureLayout(event.target.value as 'simple' | 'business-card')}>
                                                <option value="business-card">Professional card layout</option>
                                                <option value="simple">Simple text only</option>
                                            </select>
                                        </div>
                                        <div className="email-field-group">
                                            <label>Logo URL</label>
                                            <input className="form-input" value={signatureLogoUrl} onChange={event => setSignatureLogoUrl(event.target.value)} placeholder="https://example.com/logo.png" />
                                        </div>
                                        {signatureLogoUrl && (
                                            <div className="email-field-group">
                                                <label>Logo width: {signatureLogoWidth}px</label>
                                                <input type="range" min="20" max="400" step="10" value={signatureLogoWidth} onChange={event => setSignatureLogoWidth(parseInt(event.target.value))} style={{ width: '100%' }} />
                                            </div>
                                        )}
                                        <div className="email-field-group">
                                            <label>Sign off</label>
                                            <input className="form-input" value={signatureSignOff} onChange={event => setSignatureSignOff(event.target.value)} placeholder="Regards," />
                                        </div>
                                        <div className="email-field-group">
                                            <label>Sender name</label>
                                            <input className="form-input" value={signatureSenderName} onChange={event => setSignatureSenderName(event.target.value)} />
                                        </div>
                                        {signatureLayout === 'simple' && (
                                            <div className="email-field-group">
                                                <label>Custom content (Markdown supported)</label>
                                                <textarea className="form-textarea" rows={4} value={signatureContent} onChange={event => setSignatureContent(event.target.value)} placeholder="Write signature here..." />
                                            </div>
                                        )}
                                        {signatureLayout === 'business-card' && (
                                            <div className="signature-card-fields">
                                                <input className="form-input" value={signatureCompanyName} onChange={event => setSignatureCompanyName(event.target.value)} placeholder="Company name" />
                                                <input className="form-input" value={signatureAddressLine} onChange={event => setSignatureAddressLine(event.target.value)} placeholder="Address" />
                                                <input className="form-input" value={signaturePhonePrimary} onChange={event => setSignaturePhonePrimary(event.target.value)} placeholder="Primary phone" />
                                                <input className="form-input" value={signaturePhoneSecondary} onChange={event => setSignaturePhoneSecondary(event.target.value)} placeholder="Secondary phone" />
                                                <input className="form-input" value={signatureEmailAddress} onChange={event => setSignatureEmailAddress(event.target.value)} placeholder="Email" />
                                                <input className="form-input" value={signatureWebsiteUrl} onChange={event => setSignatureWebsiteUrl(event.target.value)} placeholder="Website URL" />
                                                <input className="form-input" value={signatureTradeId} onChange={event => setSignatureTradeId(event.target.value)} placeholder="Trade ID" />
                                                <input className="form-input" value={signatureEnvironmentNote} onChange={event => setSignatureEnvironmentNote(event.target.value)} placeholder="Eco note" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="signature-preview-pane">
                                        <label>Preview</label>
                                        <div className="email-signature-preview" dangerouslySetInnerHTML={{ __html: buildSignatureHtml({
                                            id: 'preview',
                                            name: signatureName || 'Preview',
                                            content: signatureContent,
                                            layout: signatureLayout,
                                            signOff: signatureSignOff,
                                            senderName: signatureSenderName,
                                            companyName: signatureCompanyName,
                                            addressLine: signatureAddressLine,
                                            phonePrimary: signaturePhonePrimary,
                                            phoneSecondary: signaturePhoneSecondary,
                                            emailAddress: signatureEmailAddress,
                                            websiteUrl: signatureWebsiteUrl,
                                            tradeId: signatureTradeId,
                                            environmentNote: signatureEnvironmentNote,
                                            logoUrl: signatureLogoUrl,
                                            logoWidth: signatureLogoWidth,
                                            isDefault: false,
                                            ownerEmail: currentUser.email,
                                            createdAt: '',
                                            updatedAt: ''
                                        }) }} />
                                    </div>
                                </div>
                            </div>
                            <div className="signature-modal-footer">
                                <Button variant="secondary" onClick={() => setIsSignatureModalOpen(false)}>Cancel</Button>
                                <Button variant="primary" onClick={saveSignature}>Save Signature</Button>
                            </div>
                        </div>
                    </div>
                )}

                <section className="email-main">
                    <div className="email-panel">
                        <div className="email-panel-header">
                            <span><PenSquare size={15} /> Compose</span>
                            <div className="email-inline-actions">
                                <button type="button" onClick={() => setComposer(prev => ({ ...prev, name: `${prev.subject || 'Draft'} ${new Date().toLocaleTimeString()}` }))}>Rename draft</button>
                            </div>
                        </div>
                        <div className="email-compose-grid">
                            <div className="email-field-group">
                                <label>Draft name</label>
                                <input className="form-input" value={composer.name} onChange={event => setComposer(prev => ({ ...prev, name: event.target.value }))} />
                            </div>
                            <div className="email-field-group">
                                <label>Subject</label>
                                <input className="form-input" value={composer.subject} onChange={event => setComposer(prev => ({ ...prev, subject: event.target.value }))} placeholder="Enter email subject" />
                            </div>
                            <div className="email-field-group">
                                <label>CC</label>
                                <input className="form-input" value={composer.ccInput} onChange={event => setComposer(prev => ({ ...prev, ccInput: event.target.value }))} placeholder="comma separated emails" />
                            </div>
                            <div className="email-field-group">
                                <label>BCC</label>
                                <input className="form-input" value={composer.bccInput} onChange={event => setComposer(prev => ({ ...prev, bccInput: event.target.value }))} placeholder="comma separated emails" />
                            </div>
                            <div className="email-field-group email-field-full">
                                <label>Signature</label>
                                <select className="form-select" value={composer.signatureId} onChange={event => setComposer(prev => ({ ...prev, signatureId: event.target.value }))}>
                                    <option value="">No signature</option>
                                    {signatureOptions.map(signature => (
                                        <option key={signature.id} value={signature.id}>{signature.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="email-field-group email-field-full">
                                <label>Message</label>
                                <textarea className="form-textarea" rows={12} value={composer.body} onChange={event => setComposer(prev => ({ ...prev, body: event.target.value }))} placeholder="Write your email here" />
                            </div>
                        </div>

                        <div className="email-attachments-bar">
                            <label className="email-upload-button">
                                <Paperclip size={15} />
                                Add Attachments
                                <input type="file" multiple onChange={event => void handleAttachmentUpload(event.target.files)} />
                            </label>
                            <div className="email-attachment-list">
                                {composer.attachments.length === 0 && <span className="email-empty-note">No attachments added.</span>}
                                {composer.attachments.map(file => (
                                    <div key={file.id} className="email-attachment-chip">
                                        <span>{file.fileName}</span>
                                        <button type="button" onClick={() => setComposer(prev => ({ ...prev, attachments: prev.attachments.filter(item => item.id !== file.id) }))}>×</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="email-action-bar">
                            <Button variant="secondary" onClick={() => void runAsyncAction(persistDraft)} disabled={isBusy}>
                                <Save size={15} style={{ marginRight: 6 }} />
                                Save Draft
                            </Button>
                            <Button variant="primary" onClick={() => void runAsyncAction(sendMessage)} disabled={isBusy || !outlookSession}>
                                <Send size={15} style={{ marginRight: 6 }} />
                                Send via Outlook
                            </Button>
                            <Button variant="secondary" onClick={resetComposer} disabled={isBusy}>
                                <Plus size={15} style={{ marginRight: 6 }} />
                                New Message
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    if (!window.confirm('Clear the composed email?')) return;
                                    resetComposer();
                                    setStatusMessage('Composed email cleared.');
                                    setErrorMessage('');
                                }}
                                disabled={isBusy}
                            >
                                Clear Email
                            </Button>
                        </div>
                    </div>

                    <div className="email-panel">
                        <div className="email-panel-header">
                            <span>Preview</span>
                        </div>
                        <div className="email-preview-meta">
                            <div><strong>To:</strong> {combinedRecipientEmails.join(', ') || 'No recipients selected'}</div>
                            <div><strong>CC:</strong> {parseAddressList(composer.ccInput).join(', ') || '-'}</div>
                            <div><strong>BCC:</strong> {parseAddressList(composer.bccInput).join(', ') || '-'}</div>
                            <div><strong>Attachments:</strong> {composer.attachments.length}</div>
                        </div>
                        <div className="email-preview-body" dangerouslySetInnerHTML={{ __html: composedHtml || '<em>No content yet.</em>' }} />
                    </div>

                    <div className="email-panel">
                        <div className="email-panel-header">
                            <span>Recent Activity</span>
                        </div>
                        <div className="email-history-table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>When</th>
                                        <th>Subject</th>
                                        <th>Recipients</th>
                                        <th>Status</th>
                                        <th>Provider</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {messageHistory.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center">No email activity yet.</td>
                                        </tr>
                                    )}
                                    {messageHistory.map(message => (
                                        <tr key={message.id}>
                                            <td>{new Date(message.sentAt || message.createdAt).toLocaleString()}</td>
                                            <td>{message.subject || '(No subject)'}</td>
                                            <td>{message.toVendorEmails.join(', ')}</td>
                                            <td>{message.status}</td>
                                            <td>{message.provider}</td>
                                            <td>
                                                <div className="email-inline-icon-actions">
                                                    <button type="button" className="email-icon-button" onClick={() => handleRemind(message)} title="Remind/Edit">
                                                        <Bell size={16} />
                                                    </button>
                                                    <button type="button" className="email-icon-button" onClick={() => loadDraft(message as unknown as EmailDraft)} title="View in Composer">
                                                        <Eye size={16} />
                                                    </button>
                                                    <button type="button" className="email-icon-button" onClick={() => deleteMessage(message.id)} title="Delete history">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
