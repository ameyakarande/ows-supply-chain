import React from 'react';
import { Quotation } from '../types';
import { Button } from '../components/common/Button';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { Panel } from '../components/common/Panel';

interface QuotationComparisonProps {
    rfqNo: string;
    quotations: Quotation[];
    onBack: () => void;
}

export const QuotationComparison: React.FC<QuotationComparisonProps> = ({ rfqNo, quotations, onBack }) => {
    // Group all unique line items across all quotations
    const allItemCodes = Array.from(new Set(
        quotations.flatMap(q => q.lineItems.map(item => item.itemCode || item.itemDescription))
    ));

    const getVendorItem = (q: Quotation, identifier: string) => {
        return q.lineItems.find(item => (item.itemCode || item.itemDescription) === identifier);
    };

    const handlePrint = () => window.print();

    // Find the cheapest vendor for each item for highlighting
    const getCheapestVendor = (identifier: string) => {
        let minPrice = Infinity;
        let cheapestVendor = '';
        
        quotations.forEach(q => {
            const item = getVendorItem(q, identifier);
            if (item && item.unitPrice > 0 && item.unitPrice < minPrice) {
                minPrice = item.unitPrice;
                cheapestVendor = q.supplier;
            }
        });
        
        return cheapestVendor;
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
            <div className="flex justify-between align-center border-b pb-4 mb-4 no-print" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
                <div className="flex align-center gap-4">
                    <Button variant="icon" onClick={onBack} title="Back to List">
                        <ArrowLeft size={20} />
                    </Button>
                    <h2 style={{ margin: 0 }}>Comparison: RFQ {rfqNo}</h2>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handlePrint}><Printer size={16} style={{ marginRight: '6px' }} /> Print Comparison</Button>
                    <Button><Download size={16} style={{ marginRight: '6px' }} /> Export CSV</Button>
                </div>
            </div>

            <Panel title="Vendor Comparison Matrix">
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ minWidth: '300px', position: 'sticky', left: 0, backgroundColor: '#f8fafc', zIndex: 5 }}>Item Description</th>
                                <th style={{ width: '80px', textAlign: 'center' }}>Qty</th>
                                {quotations.map(q => (
                                    <th key={q.id} style={{ minWidth: '180px', textAlign: 'center', backgroundColor: '#f1f5f9' }}>
                                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{q.supplier}</div>
                                        <div style={{ fontSize: '11px', fontWeight: 500, color: '#64748b', marginTop: '2px' }}>{q.status}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {allItemCodes.map((identifier, idx) => {
                                const cheapestVendor = getCheapestVendor(identifier);
                                // Get common info from first occurrence
                                const firstItem = getVendorItem(quotations[0], identifier) || 
                                                 quotations.find(q => getVendorItem(q, identifier))?.lineItems.find(i => (i.itemCode || i.itemDescription) === identifier);
                                
                                return (
                                    <tr key={idx}>
                                        <td style={{ position: 'sticky', left: 0, backgroundColor: '#fff', zIndex: 4, fontSize: '12px' }}>
                                            <div style={{ fontWeight: 600 }}>{firstItem?.itemCode}</div>
                                            <div style={{ color: '#64748b', marginTop: '2px' }}>{firstItem?.itemDescription}</div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>{firstItem?.quantity}</td>
                                        {quotations.map(q => {
                                            const item = getVendorItem(q, identifier);
                                            const isCheapest = q.supplier === cheapestVendor;
                                            
                                            return (
                                                <td key={q.id} style={{ 
                                                    textAlign: 'center', 
                                                    backgroundColor: isCheapest ? '#f0fdf4' : 'transparent',
                                                    border: isCheapest ? '1px solid #bbf7d0' : undefined
                                                }}>
                                                    {item ? (
                                                        <>
                                                            <div style={{ fontWeight: 700, color: isCheapest ? '#166534' : '#1e293b' }}>
                                                                {q.currency} {item.unitPrice.toFixed(2)}
                                                            </div>
                                                            {item.discountPercentage > 0 && (
                                                                <div style={{ fontSize: '10px', color: '#dc2626' }}>
                                                                    -{item.discountPercentage}% Disc.
                                                                </div>
                                                            )}
                                                            {item.remark && (
                                                                <div style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic', marginTop: '4px' }}>
                                                                    "{item.remark}"
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span style={{ color: '#cbd5e1' }}>No Quote</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr style={{ backgroundColor: '#f8fafc', fontWeight: 700 }}>
                                <td colSpan={2} style={{ textAlign: 'right' }}>Total Value</td>
                                {quotations.map(q => (
                                    <td key={q.id} style={{ textAlign: 'center', fontSize: '16px', color: '#2563eb' }}>
                                        {q.currency} {q.overallTotal.toFixed(2)}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td colSpan={2} style={{ textAlign: 'right', fontSize: '11px', color: '#64748b' }}>Delivery Days</td>
                                {quotations.map(q => (
                                    <td key={q.id} style={{ textAlign: 'center', fontSize: '12px' }}>
                                        {q.deliveryTimeDays || '-'} days
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td colSpan={2} style={{ textAlign: 'right', fontSize: '11px', color: '#64748b' }}>Freight Terms</td>
                                {quotations.map(q => (
                                    <td key={q.id} style={{ textAlign: 'center', fontSize: '11px' }}>
                                        {q.freightTerms || '-'}
                                    </td>
                                ))}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </Panel>
            
            <div style={{ marginTop: '20px', color: '#64748b', fontSize: '12px' }}>
                * Green highlighting indicates the lowest unit price for that item.
            </div>
        </div>
    );
};
