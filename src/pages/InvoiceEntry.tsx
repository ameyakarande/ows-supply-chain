import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Search as SearchIcon, HelpCircle, X, Settings, Import, ArrowLeft } from 'lucide-react';
import { MasterData, Invoice, InvoiceLineItem, Quotation } from '../types';
import { Button } from '../components/common/Button';

interface InvoiceEntryProps {
    onBack: () => void;
    onSave: (invoice: Invoice) => void;
    masterData: MasterData;
    quotations: Quotation[];
    editInvoice?: Invoice | null;
}

const POSelectionModal: React.FC<{
    quotations: Quotation[];
    onSelect: (q: Quotation) => void;
    onClose: () => void;
}> = ({ quotations, onSelect, onClose }) => {
    const poIssuedQuotations = quotations.filter(q => q.status === 'PO Issued');

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '8px', width: '600px', maxWidth: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Import from Purchase Order</h3>
                    <X size={20} style={{ cursor: 'pointer', color: '#6b7280' }} onClick={onClose} />
                </div>
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    {poIssuedQuotations.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#6b7280' }}>No pending POs found.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                                    <th style={{ padding: '10px' }}>PO #</th>
                                    <th style={{ padding: '10px' }}>Supplier</th>
                                    <th style={{ padding: '10px' }}>Vessel</th>
                                    <th style={{ padding: '10px' }}>Total</th>
                                    <th style={{ padding: '10px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {poIssuedQuotations.map(q => (
                                    <tr key={q.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '10px', fontWeight: 600 }}>{q.poNo || q.rfqNo}</td>
                                        <td style={{ padding: '10px' }}>{q.supplier}</td>
                                        <td style={{ padding: '10px' }}>{q.vessel}</td>
                                        <td style={{ padding: '10px' }}>₹ {q.overallTotal.toFixed(2)}</td>
                                        <td style={{ padding: '10px', textAlign: 'right' }}>
                                            <Button variant="secondary" onClick={() => onSelect(q)} style={{ padding: '4px 10px', fontSize: '12px' }}>Select</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function InvoiceEntry({ onBack, onSave, masterData, quotations, editInvoice }: InvoiceEntryProps) {
    const [customerId, setCustomerId] = useState(editInvoice?.customerId || '');
    const [invoiceNo, setInvoiceNo] = useState(editInvoice?.invoiceNo || `INV-${Math.floor(100000 + Math.random() * 900000)}`);
    const [invoiceDate, setInvoiceDate] = useState(editInvoice?.invoiceDate || new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(editInvoice?.dueDate || new Date().toISOString().split('T')[0]);
    const [terms, setTerms] = useState(editInvoice?.terms || 'Due on Receipt');
    const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(editInvoice?.lineItems || [
        { 
            id: 'li-1', 
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
    ]);
    const [notes, setNotes] = useState(editInvoice?.notes || 'Thanks for your business.');
    const [termsAndConditions] = useState(editInvoice?.termsAndConditions || '');
    const [poId, setPoId] = useState(editInvoice?.poId || '');
    const [isPOModalOpen, setIsPOModalOpen] = useState(false);

    // Terms to Due Date Logic
    useEffect(() => {
        const date = new Date(invoiceDate);
        let daysToAdd = 0;
        switch (terms) {
            case 'Net 15': daysToAdd = 15; break;
            case 'Net 30': daysToAdd = 30; break;
            case 'Net 45': daysToAdd = 45; break;
            default: daysToAdd = 0; // Due on Receipt
        }
        date.setDate(date.getDate() + daysToAdd);
        setDueDate(date.toISOString().split('T')[0]);
    }, [invoiceDate, terms]);

    const calculateTotals = () => {
        const subtotal = lineItems.reduce((acc, item) => acc + item.netTotal, 0);
        const taxRate = 0; 
        const taxAmount = subtotal * taxRate;
        const totalAmount = subtotal + taxAmount;
        return { subtotal, taxAmount, totalAmount };
    };

    const { subtotal, taxAmount, totalAmount } = calculateTotals();

    const handleAddRow = () => {
        const newItem: InvoiceLineItem = {
            id: `li-${Date.now()}`,
            lineNo: lineItems.length + 1,
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
        };
        setLineItems([...lineItems, newItem]);
    };

    const handleRemoveRow = (id: string) => {
        if (lineItems.length === 1) return;
        const updated = lineItems.filter(item => item.id !== id).map((item, index) => ({
            ...item,
            lineNo: index + 1
        }));
        setLineItems(updated);
    };

    const updateItem = (id: string, field: keyof InvoiceLineItem, value: any) => {
        setLineItems(lineItems.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'unitPrice' || field === 'discountPercentage' || field === 'quantity') {
                    const price = field === 'unitPrice' ? value : item.unitPrice;
                    const disc = field === 'discountPercentage' ? value : item.discountPercentage;
                    const qty = field === 'quantity' ? value : item.quantity;
                    updated.netUnitPrice = price * (1 - disc / 100);
                    updated.netTotal = updated.netUnitPrice * qty;
                }
                return updated;
            }
            return item;
        }));
    };

    const handleImportPO = (q: Quotation) => {
        // Try to find a customer matching the supplier name (Simplified)
        const customer = masterData.customers?.find(c => c.name.toLowerCase().includes(q.supplier.toLowerCase())) || masterData.customers?.[0];
        if (customer) setCustomerId(customer.id);
        
        setPoId(q.id);
        setLineItems(q.lineItems.map(li => ({
            id: `li-${li.id}`,
            lineNo: li.lineNo,
            itemCode: li.itemCode,
            itemDescription: li.itemDescription,
            specification: li.specification,
            primaryUnit: li.primaryUnit,
            quantity: li.quantity,
            unitPrice: li.adminUnitPrice || li.unitPrice,
            discountPercentage: li.discountPercentage,
            netUnitPrice: li.netUnitPrice,
            netTotal: li.netTotal,
            remark: li.remark
        })));
        setIsPOModalOpen(false);
    };

    const handleSave = () => {
        if (!customerId) {
            alert('Please select a customer');
            return;
        }
        const customer = masterData.customers?.find(c => c.id === customerId);
        const newInvoice: Invoice = {
            id: editInvoice?.id || `inv-${Date.now()}`,
            invoiceNo,
            invoiceDate,
            customerId,
            customerName: customer?.name || '',
            terms,
            dueDate,
            lineItems,
            subtotal,
            taxRate: 0,
            taxAmount,
            totalAmount,
            notes,
            termsAndConditions,
            status: editInvoice?.status || 'Sent',
            poId
        };
        onSave(newInvoice);
        onBack();
    };

    const inputStyle: React.CSSProperties = {
        padding: '6px 10px',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        fontSize: '13px',
        width: '100%',
        boxSizing: 'border-box'
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '12px',
        fontWeight: 600,
        color: '#d97706',
        display: 'block',
        marginBottom: '4px'
    };

    const tableHeaderStyle: React.CSSProperties = {
        textAlign: 'left',
        padding: '12px 8px',
        fontSize: '11px',
        color: '#6b7280',
        textTransform: 'uppercase',
        borderBottom: '1px solid #e5e7eb'
    };

    const tableInputStyle: React.CSSProperties = {
        ...inputStyle,
        padding: '4px 6px',
        fontSize: '12px',
        border: '1px solid transparent',
        backgroundColor: 'transparent'
    };

    return (
        <div style={{ backgroundColor: '#fff', minHeight: '100vh', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            {isPOModalOpen && <POSelectionModal quotations={quotations} onSelect={handleImportPO} onClose={() => setIsPOModalOpen(false)} />}
            
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px', marginBottom: '25px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <Button variant="secondary" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ArrowLeft size={16} /> Back
                     </Button>
                     <div style={{ padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
                        <Calendar size={20} color="#374151" />
                     </div>
                     <div>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>{editInvoice ? 'Edit Invoice' : 'New Invoice'}</h2>
                     </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Button variant="secondary" onClick={() => setIsPOModalOpen(true)} style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Import size={16} /> Import PO
                    </Button>
                    <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb', margin: '0 5px' }} />
                    <Settings size={18} color="#6b7280" style={{ cursor: 'pointer' }} />
                    <X size={20} color="#6b7280" style={{ cursor: 'pointer' }} onClick={onBack} />
                </div>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px', alignItems: 'end' }}>
                    <div>
                        <label style={labelStyle}>Customer Name*</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <select 
                                style={{ ...inputStyle, flex: 1 }} 
                                value={customerId} 
                                onChange={(e) => setCustomerId(e.target.value)}
                            >
                                <option value="">Select or add a customer</option>
                                {masterData.customers?.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <Button variant="secondary" style={{ padding: '6px' }}><SearchIcon size={14} /></Button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                    <div>
                        <label style={labelStyle}>Invoice#*</label>
                        <div style={{ position: 'relative' }}>
                            <input style={inputStyle} value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
                            <Settings size={14} style={{ position: 'absolute', right: '10px', top: '9px', color: '#9ca3af' }} />
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Invoice Date*</label>
                        <input type="date" style={inputStyle} value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ ...labelStyle, color: '#374151' }}>Terms</label>
                        <select style={inputStyle} value={terms} onChange={e => setTerms(e.target.value)}>
                            <option>Due on Receipt</option>
                            <option>Net 15</option>
                            <option>Net 30</option>
                            <option>Net 45</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ ...labelStyle, color: '#374151' }}>Due Date</label>
                        <input type="date" style={inputStyle} value={dueDate} readOnly />
                    </div>
                </div>

                {/* Item Table */}
                <div style={{ marginTop: '20px', overflowX: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderBottom: 'none', borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px' }}>Item Table</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6', fontSize: '12px', cursor: 'pointer' }}>
                            <SearchIcon size={14} /> <span>Scan Item</span>
                        </div>
                    </div>
                    <table style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#fff' }}>
                                <th style={{ ...tableHeaderStyle, width: '40px' }}>#</th>
                                <th style={{ ...tableHeaderStyle, width: '120px' }}>Item Code</th>
                                <th style={{ ...tableHeaderStyle, width: '250px' }}>Description</th>
                                <th style={{ ...tableHeaderStyle, width: '250px' }}>Specification</th>
                                <th style={{ ...tableHeaderStyle, width: '80px' }}>UOM</th>
                                <th style={{ ...tableHeaderStyle, width: '80px', textAlign: 'right' }}>Qty</th>
                                <th style={{ ...tableHeaderStyle, width: '100px', textAlign: 'right' }}>Unit Price</th>
                                <th style={{ ...tableHeaderStyle, width: '80px', textAlign: 'right' }}>Disc %</th>
                                <th style={{ ...tableHeaderStyle, width: '100px', textAlign: 'right' }}>Net Price</th>
                                <th style={{ ...tableHeaderStyle, width: '100px', textAlign: 'right' }}>Total</th>
                                <th style={{ width: '40px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {lineItems.map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '8px', fontSize: '12px', color: '#6b7280' }}>{item.lineNo}</td>
                                    <td style={{ padding: '8px' }}>
                                        <input 
                                            style={tableInputStyle} 
                                            value={item.itemCode || ''} 
                                            onChange={e => updateItem(item.id, 'itemCode', e.target.value)} 
                                            placeholder="Code"
                                        />
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        <textarea 
                                            style={{ ...tableInputStyle, minHeight: '32px', resize: 'none' }}
                                            value={item.itemDescription || ''}
                                            onChange={e => updateItem(item.id, 'itemDescription', e.target.value)}
                                            placeholder="Item Description"
                                        />
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        <textarea 
                                            style={{ ...tableInputStyle, minHeight: '32px', resize: 'none' }}
                                            value={item.specification || ''}
                                            onChange={e => updateItem(item.id, 'specification', e.target.value)}
                                            placeholder="Specification"
                                        />
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        <input 
                                            style={tableInputStyle} 
                                            value={item.primaryUnit || ''} 
                                            onChange={e => updateItem(item.id, 'primaryUnit', e.target.value)} 
                                            placeholder="EA"
                                        />
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        <input 
                                            type="number" 
                                            style={{ ...tableInputStyle, textAlign: 'right' }} 
                                            value={item.quantity} 
                                            onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                        />
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        <input 
                                            type="number" 
                                            style={{ ...tableInputStyle, textAlign: 'right' }} 
                                            value={item.unitPrice} 
                                            onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                        />
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        <input 
                                            type="number" 
                                            style={{ ...tableInputStyle, textAlign: 'right' }} 
                                            value={item.discountPercentage} 
                                            onChange={e => updateItem(item.id, 'discountPercentage', parseFloat(e.target.value) || 0)}
                                        />
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px', fontWeight: 500 }}>
                                        {(item.netUnitPrice || 0).toFixed(2)}
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>
                                        {(item.netTotal || 0).toFixed(2)}
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'center' }}>
                                        <Trash2 
                                            size={14} 
                                            color="#ef4444" 
                                            style={{ cursor: 'pointer' }} 
                                            onClick={() => handleRemoveRow(item.id)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <Button variant="secondary" onClick={handleAddRow} style={{ fontSize: '12px', color: '#3b82f6' }}>
                            <Plus size={14} style={{ marginRight: '4px' }} /> Add New Row
                        </Button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '40px', marginTop: '20px' }}>
                    <div>
                        <label style={{ ...labelStyle, color: '#374151' }}>Customer Notes</label>
                        <textarea 
                            style={{ ...inputStyle, minHeight: '80px' }} 
                            value={notes} 
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Will be displayed on the invoice"
                        />
                    </div>
                    <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                            <span style={{ fontSize: '13px', color: '#6b7280' }}>Subtotal</span>
                            <span style={{ fontSize: '13px', fontWeight: 500 }}>{subtotal.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                            <span style={{ fontSize: '13px', color: '#6b7280' }}>Tax (0%)</span>
                            <span style={{ fontSize: '13px', fontWeight: 500 }}>{taxAmount.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 4px', fontSize: '18px', fontWeight: 700 }}>
                            <span>Total ( ₹ )</span>
                            <span>{totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '15px 40px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '10px', backdropFilter: 'blur(8px)', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                <Button variant="primary" onClick={handleSave} style={{ minWidth: '120px' }}>Save</Button>
                <Button variant="secondary" onClick={onBack}>Cancel</Button>
                <HelpCircle size={18} style={{ marginLeft: 'auto', alignSelf: 'center', color: '#6b7280', cursor: 'pointer' }} />
            </div>
            
            <div style={{ height: '80px' }} /> {/* Spacer for fixed footer */}
        </div>
    );
}
