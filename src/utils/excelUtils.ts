import * as XLSX from 'xlsx';
import { QuotationLineItem } from '../types';

const TEMPLATE_HEADERS = [
    'Line No',
    'Item Code',
    'Item Description',
    'Specification',
    'Primary Unit',
    'Quantity',
    'Unit Price',
    'Discount Percentage',
    'Remark'
];

export const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Items');
    
    // Auto-size columns for better readability
    const colWidths = [10, 15, 40, 50, 15, 10, 10, 15, 30];
    ws['!cols'] = colWidths.map(w => ({ wch: w }));

    XLSX.writeFile(wb, 'Quotation_Items_Template.xlsx');
};

export const parseExcelFile = (file: File): Promise<Partial<QuotationLineItem>[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convert sheet to JSON with headers as keys
                const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);
                
                const items: Partial<QuotationLineItem>[] = rawData.map((row, index) => ({
                    lineNo: parseInt(row['Line No']) || index + 1,
                    itemCode: (row['Item Code'] || '').toString(),
                    itemDescription: (row['Item Description'] || '').toString(),
                    specification: (row['Specification'] || '').toString(),
                    primaryUnit: (row['Primary Unit'] || '').toString(),
                    quantity: parseFloat(row['Quantity']) || 0,
                    unitPrice: parseFloat(row['Unit Price']) || 0,
                    discountPercentage: parseFloat(row['Discount Percentage']) || 0,
                    remark: (row['Remark'] || '').toString(),
                    netUnitPrice: 0, // Will be calculated by recalculateTotals
                    netTotal: 0      // Will be calculated by recalculateTotals
                }));
                
                resolve(items);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

export const exportToExcel = (items: QuotationLineItem[], filename: string = 'Quotation_Items.xlsx') => {
    const data = items.map(item => ({
        'Line No': item.lineNo,
        'Item Code': item.itemCode,
        'Item Description': item.itemDescription,
        'Specification': item.specification,
        'Primary Unit': item.primaryUnit,
        'Quantity': item.quantity,
        'Unit Price': item.unitPrice,
        'Discount Percentage': item.discountPercentage,
        'Remark': item.remark
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Items');
    
    // Auto-size columns for better readability
    const colWidths = [10, 15, 40, 50, 15, 10, 10, 15, 30];
    ws['!cols'] = colWidths.map(w => ({ wch: w }));

    XLSX.writeFile(wb, filename);
};
