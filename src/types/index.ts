export interface QuotationLineItem {
    id: string;
    lineNo: number;
    itemCode: string;
    itemDescription: string;
    specification: string;
    primaryUnit: string;
    quantity: number;
    unitPrice: number;
    discountPercentage: number;
    netUnitPrice: number;
    netTotal: number;
    remark: string;
    adminUnitPrice?: number;
}

export interface TaxRow {
    id: string;
    taxType: string;
    taxCode: string; // for reference only
    amount: number;
    percentage: number;
    remark: string;
}

export interface Attachment {
    id: string;
    fileName: string;
    fileType: string;
    base64Data: string;
}

export interface Supplier {
    name: string;
    email: string;
}

export interface Quotation {
    id: string; // UUID or string
    // Section A: Header
    operatingUnit: string;
    supplier: string;
    vessel: string;
    port: string;
    status: 'New' | 'SentToVendor' | 'Submitted' | 'Approved' | 'Rejected' | 'Closed' | 'PO Issued' | 'Invoice Raised';
    categories?: string[];
    poNo?: string;
    poDate?: string;
    buyer: string;
    rfqCreationDate: string;
    rfqNo: string;
    requisitionNo: string;
    warranty: string;
    comments: string;
    incoLocationComment: string;

    // Section A: Header Right Side
    description: string;
    deliveryInstruction: string;
    needByDate: string;
    paymentTerms: string;
    currency: string;
    supplierEmail: string;
    supplierQuotationNo: string;
    headerDiscountPercentage: number;
    discountType: 'Overall Discount' | 'Line Item Discount';
    freightTerms: string;
    grading: string;
    tax: string;
    deliveryTimeDays: number;
    effectiveFrom: string;
    effectiveTo: string;

    // Items
    lineItems: QuotationLineItem[];

    // Taxes
    taxes: TaxRow[];

    // Attachments
    requisitionAttachments: Attachment[];
    quotationAttachments: Attachment[];

    // Totals
    deliveryCharge: number;
    additionalCharge1Label: string;
    additionalCharge1Amount: number;
    additionalCharge2Label: string;
    additionalCharge2Amount: number;

    grossTotal: number;
    totalDiscount: number;
    taxTotal: number;
    overallTotal: number;

    // Admin values
    adminGrossTotal?: number;
    adminTotalDiscount?: number;
    adminTaxTotal?: number;
    adminOverallTotal?: number;

    // Audit
    lastModifiedAt: string;
    vendorEditCount: number;
}

// Master data types for dropdowns and reference arrays

export interface InvoiceLineItem {
    id: string;
    lineNo: number;
    itemCode: string;
    itemDescription: string;
    specification: string;
    primaryUnit: string;
    quantity: number;
    unitPrice: number;
    discountPercentage: number;
    netUnitPrice: number;
    netTotal: number;
    remark: string;
}

export interface Invoice {
    id: string;
    invoiceNo: string;
    invoiceDate: string;
    customerId: string;
    customerName: string;
    terms: string;
    dueDate: string;
    lineItems: InvoiceLineItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;
    notes: string;
    termsAndConditions: string;
    status: 'Draft' | 'Sent' | 'Paid';
    poId?: string; // Origin PO ID if imported
}

export interface NotificationRecord {
    id: string;
    recipientEmail: string;
    title: string;
    message: string;
    createdAt: string;
    isRead: boolean;
    relatedQuotationId?: string;
}

export interface EmailSignature {
    id: string;
    name: string;
    content: string;
    layout?: 'simple' | 'business-card';
    signOff?: string;
    senderName?: string;
    companyName?: string;
    addressLine?: string;
    phonePrimary?: string;
    phoneSecondary?: string;
    emailAddress?: string;
    websiteUrl?: string;
    tradeId?: string;
    environmentNote?: string;
    logoUrl?: string;
    logoWidth?: number;
    isDefault: boolean;
    ownerEmail: string;
    createdAt: string;
    updatedAt: string;
}

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    cc: string[];
    bcc: string[];
    signatureId?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface EmailDraft {
    id: string;
    name: string;
    subject: string;
    body: string;
    toVendorEmails: string[];
    cc: string[];
    bcc: string[];
    signatureId?: string;
    attachments: Attachment[];
    outlookDraftId?: string;
    status: 'draft' | 'sent' | 'failed';
    provider: 'local' | 'outlook-graph';
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    lastSyncedAt?: string;
    lastSentAt?: string;
    lastError?: string;
}

export interface EmailMessageRecord {
    id: string;
    draftId?: string;
    subject: string;
    body: string;
    toVendorEmails: string[];
    cc: string[];
    bcc: string[];
    signatureId?: string;
    attachments: Attachment[];
    status: 'draft' | 'sent' | 'failed';
    provider: 'local' | 'outlook-graph';
    createdBy: string;
    createdAt: string;
    sentAt?: string;
    outlookMessageId?: string;
    errorMessage?: string;
}

export interface Customer {
    id: string;
    name: string;
    email: string;
    address?: string;
}

export interface MasterData {
    vessels: string[];
    suppliers: Array<{ name: string; email: string }>;
    customers: Customer[];
    categories: string[];
    currencies: string[];
    ports: string[];
    operatingUnits: string[];
    paymentTerms: string[];
    freightTerms: string[];
    taxTypes: string[];
}
