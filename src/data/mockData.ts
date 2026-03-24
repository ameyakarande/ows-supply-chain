import { MasterData, Quotation } from '../types';

export const initialMasterData: MasterData = {
    operatingUnits: [
        'Oceanwharf Shipping Services'
    ],
    suppliers: [
        { name: 'OCEANWHARF SHIP MANAGEMENT PTE LTD', email: 'procurement@oceanwharf.com' },
        { name: 'GLOBAL MARINE SUPPLIES CO.', email: 'orders@globalmarine.com' },
        { name: 'AQUA PROVISIONS INC.', email: 'sales@aquaprovisions.net' },
        { name: 'STAR SHIPS SPARES BV', email: 'support@starshipspares.nl' }
    ],
    customers: [
        { id: 'c1', name: 'Maersk Line', email: 'billing@maersk.com' },
        { id: 'c2', name: 'MSC Mediterranean Shipping', email: 'accounts@msc.com' },
        { id: 'c3', name: 'CMA CGM Group', email: 'finance@cma-cgm.com' },
        { id: 'c4', name: 'Hapag-Lloyd', email: 'invoices@hl.com' }
    ],
    categories: ['Provisions', 'Spares', 'Stores', 'Underwater', 'Chemicals'],
    vessels: [
        'CPG ZOE',
        'OCEAN EXPLORER',
        'SEA RACER',
        'MARINE STAR'
    ],
    ports: ['Singapore', 'Dubai', 'Rotterdam', 'New York'],
    paymentTerms: [
        '30 DAYS',
        '60 DAYS',
        'CASH IN ADVANCE',
        'LETTER OF CREDIT'
    ],
    currencies: [
        'USD',
        'EUR',
        'SGD',
        'AED',
        'GBP',
        'INR'
    ],
    freightTerms: [
        'FOB (Free On Board)',
        'CIF (Cost, Insurance & Freight)',
        'EXW (Ex Works)',
        'DDP (Delivered Duty Paid)'
    ],
    taxTypes: [
        'VAT',
        'GST',
        'WHT',
        'CUSTOMS DUTY'
    ]
};

// Initial Mock Quotation data to emulate the screenshot
export const initialQuotations: Quotation[] = [
    {
        id: 'q-1001',
        operatingUnit: 'Oceanwharf Shipping Services',
        supplier: 'OCEANWHARF SHIP MANAGEMENT PTE LTD',
        vessel: 'CPG ZOE',
        port: 'MZ-MPM',
        status: 'New',
        buyer: 'Shivkar, Prashant',
        rfqCreationDate: '12-Mar-2026',
        rfqNo: '3109/BUN26/0036/302',
        requisitionNo: '3109/BUN26/0036/30',
        warranty: '',
        comments: '',
        incoLocationComment: '',

        description: '',
        deliveryInstruction: '',
        needByDate: '19-Feb-2026',
        paymentTerms: '',
        currency: 'USD',
        supplierEmail: 'procurement@oceanwharf.com',
        supplierQuotationNo: 'QT-2026-9901',
        headerDiscountPercentage: 0,
        discountType: 'Overall Discount',
        freightTerms: 'FOB (Free On Board)',
        grading: '',
        tax: '',
        deliveryTimeDays: 0,
        effectiveFrom: '',
        effectiveTo: '',

        lineItems: [
            {
                id: 'li-1',
                lineNo: 1,
                itemCode: 'MR.IMPA212109',
                itemDescription: 'ROPE WIRE GALV 6X19, 12MM DIAX200MTR W/CERT.--IMPA212109',
                specification: 'Crane Wire DIA 12 mm. ( 19 x 7 WSC) NON ROTATING GALVANISED STEEL WIRE ROPE SLING WITH TURNBACK SPLICED THIMBLE EYE AT ONE END AND OTHER END PLAIN TAPERED ANISED LENGTH: 100 MTRS SWL-10.2MT',
                primaryUnit: 'C/L',
                quantity: 2,
                unitPrice: 1500,
                discountPercentage: 0,
                netUnitPrice: 1500,
                netTotal: 3000,
                remark: 'Requires original manufacturer certificate.'
            }
        ],

        taxes: [
            {
                id: 't-1',
                taxType: 'VAT',
                taxCode: '',
                amount: 0,
                percentage: 5,
                remark: 'Standard VAT'
            },
            {
                id: 't-2',
                taxType: '',
                taxCode: '',
                amount: 0,
                percentage: 0,
                remark: ''
            },
            {
                id: 't-3',
                taxType: '',
                taxCode: '',
                amount: 0,
                percentage: 0,
                remark: ''
            }
        ],

        requisitionAttachments: [],
        quotationAttachments: [],
        deliveryCharge: 200,
        additionalCharge1Label: 'Handling',
        additionalCharge1Amount: 50,
        additionalCharge2Label: 'Bank Charge',
        additionalCharge2Amount: 0,

        grossTotal: 3200,
        totalDiscount: 0,
        taxTotal: 160,
        overallTotal: 3610,

        lastModifiedAt: new Date().toISOString(),
        vendorEditCount: 0
    }
];

// Helper empty quotation object
export const createEmptyQuotation = (): Quotation => ({
    id: `q-${Date.now()}`,
    operatingUnit: 'Oceanwharf Shipping Services',
    supplier: '',
    vessel: '',
    port: '',
    status: 'New',
    categories: [],
    buyer: 'Oceanwharf Shipping Services',
    rfqCreationDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
    rfqNo: `RFQ-${Math.floor(Math.random() * 10000)}`,
    requisitionNo: `REQ-${Math.floor(Math.random() * 10000)}`,
    warranty: '',
    comments: '',
    incoLocationComment: '',
    description: '',
    deliveryInstruction: '',
    needByDate: '',
    paymentTerms: '',
    currency: 'USD',
    supplierEmail: '',
    supplierQuotationNo: '',
    headerDiscountPercentage: 0,
    discountType: 'Overall Discount',
    freightTerms: '',
    grading: '',
    tax: '',
    deliveryTimeDays: 0,
    effectiveFrom: '',
    effectiveTo: '',
    lineItems: [
        {
            id: `li-${Date.now()}`,
            lineNo: 1,
            itemCode: '',
            itemDescription: '',
            specification: '',
            primaryUnit: 'EA',
            quantity: 1,
            unitPrice: 0,
            discountPercentage: 0,
            netUnitPrice: 0,
            netTotal: 0,
            remark: ''
        }
    ],
    taxes: [
        { id: `t-${Date.now()}-1`, taxType: '', taxCode: '', amount: 0, percentage: 0, remark: '' },
        { id: `t-${Date.now()}-2`, taxType: '', taxCode: '', amount: 0, percentage: 0, remark: '' },
        { id: `t-${Date.now()}-3`, taxType: '', taxCode: '', amount: 0, percentage: 0, remark: '' }
    ],
    requisitionAttachments: [],
    quotationAttachments: [],
    deliveryCharge: 0,
    additionalCharge1Label: '',
    additionalCharge1Amount: 0,
    additionalCharge2Label: '',
    additionalCharge2Amount: 0,
    grossTotal: 0,
    totalDiscount: 0,
    taxTotal: 0,
    overallTotal: 0,
    lastModifiedAt: new Date().toISOString(),
    vendorEditCount: 0
});
