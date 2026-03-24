import React from 'react';
import { Plus, Edit, Eye, Download, FileText, Search, ArrowLeft, Trash2 } from 'lucide-react';
import { Invoice } from '../types';
import { Button } from '../components/common/Button';

interface InvoiceDashboardProps {
    invoices: Invoice[];
    onBack: () => void;
    onNewInvoice: () => void;
    onEditInvoice: (invoice: Invoice) => void;
    onViewInvoice: (invoice: Invoice) => void;
    onDeleteInvoice: (invoice: Invoice) => void;
}

const InvoiceDashboard: React.FC<InvoiceDashboardProps> = ({ 
    invoices, 
    onBack,
    onNewInvoice, 
    onEditInvoice, 
    onViewInvoice,
    onDeleteInvoice 
}) => {
    return (
        <div style={{ backgroundColor: '#fff', minHeight: '80vh', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Button onClick={onBack} variant="secondary">
                        <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back
                    </Button>
                    <div style={{ padding: '8px', backgroundColor: '#eff6ff', borderRadius: '6px' }}>
                        <FileText size={24} color="#3b82f6" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Invoices</h2>
                        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Manage and track your customer invoices</p>
                    </div>
                </div>
                <Button onClick={onNewInvoice} variant="primary">
                    <Plus size={16} style={{ marginRight: '6px' }} /> New Invoice
                </Button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#9ca3af' }} />
                    <input 
                        placeholder="Search invoices by number or customer..." 
                        style={{ width: '100%', padding: '8px 8px 8px 35px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}
                    />
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ textAlign: 'left', padding: '12px 15px', fontWeight: 600, color: '#4b5563' }}>Invoice #</th>
                        <th style={{ textAlign: 'left', padding: '12px 15px', fontWeight: 600, color: '#4b5563' }}>Date</th>
                        <th style={{ textAlign: 'left', padding: '12px 15px', fontWeight: 600, color: '#4b5563' }}>Customer</th>
                        <th style={{ textAlign: 'right', padding: '12px 15px', fontWeight: 600, color: '#4b5563' }}>Total Amount</th>
                        <th style={{ textAlign: 'center', padding: '12px 15px', fontWeight: 600, color: '#4b5563' }}>Status</th>
                        <th style={{ textAlign: 'center', padding: '12px 15px', fontWeight: 600, color: '#4b5563' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {invoices.length === 0 ? (
                        <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                                No invoices found. Create your first invoice to get started.
                            </td>
                        </tr>
                    ) : (
                        invoices.map((inv) => (
                            <tr key={inv.id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.2s' }}>
                                <td style={{ padding: '12px 15px', fontWeight: 600, color: '#3b82f6' }}>{inv.invoiceNo}</td>
                                <td style={{ padding: '12px 15px' }}>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                                <td style={{ padding: '12px 15px' }}>{inv.customerName}</td>
                                <td style={{ padding: '12px 15px', textAlign: 'right', fontWeight: 600 }}>₹ {inv.totalAmount.toFixed(2)}</td>
                                <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                    <span style={{ 
                                        padding: '4px 8px', 
                                        borderRadius: '12px', 
                                        fontSize: '11px', 
                                        fontWeight: 600,
                                        backgroundColor: inv.status === 'Paid' ? '#d1fae5' : '#fef3c7',
                                        color: inv.status === 'Paid' ? '#065f46' : '#92400e'
                                    }}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                        <button 
                                            onClick={() => onEditInvoice(inv)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                                            title="Edit Invoice"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button 
                                            onClick={() => onViewInvoice(inv)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                                            title="View Invoice"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button 
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                                            title="Download PDF"
                                        >
                                            <Download size={16} />
                                        </button>
                                        <button 
                                            onClick={() => onDeleteInvoice(inv)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
                                            title="Delete Invoice"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default InvoiceDashboard;
