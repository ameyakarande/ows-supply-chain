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
