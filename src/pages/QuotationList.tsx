import React, { useState } from 'react';
import { Quotation } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { FilePlus, Edit, Eye, Search, Trash2, Send, PlusCircle, MinusCircle, FileText, ArrowLeftRight } from 'lucide-react';
import { generatePO } from '../utils/poPdfUtils';
import { Modal } from '../components/common/Modal';

interface QuotationListProps {
    quotations: Quotation[];
    onCreate: () => void;
    onEdit: (id: string) => void;
    onView: (id: string) => void;
    onDelete: (id: string) => void;
    onBulkDelete?: (ids: string[]) => void;
    onCompare?: (rfqNo: string) => void;
    isVendor?: boolean;
    currentUserEmail?: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'SGD': 'S$',
    'AED': 'د.إ',
    'GBP': '£',
    'INR': '₹'
};

const REVENUE_STATUSES: Quotation['status'][] = ['Approved', 'PO Issued', 'Invoice Raised'];

export default function QuotationList({ 
    quotations, 
    onCreate, 
    onEdit, 
    onView, 
    onDelete, 
    onBulkDelete,
    onCompare,
    isVendor, 
    currentUserEmail 
}: QuotationListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    
    // Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteSource, setDeleteSource] = useState<'single' | 'bulk'>('bulk');
    const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);
    const [expandedRfqNos, setExpandedRfqNos] = useState<string[]>([]);

    const vendorQuotations = quotations.filter(q => 
        isVendor && currentUserEmail ? q.supplierEmail === currentUserEmail : true
    );

    const filteredQuotations = vendorQuotations.filter(q => {
        // Search filter
        return (
            q.rfqNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.vessel.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.supplier.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    // Dashboard Statistics
    let stats = {
        label1: 'Received', value1: 0, color1: '#3b82f6', icon1: Search,
        label2: 'Submitted', value2: 0, color2: '#8b5cf6', icon2: Send,
        label3: 'Approved', value3: 0, color3: '#10b981', icon3: Eye,
        label4: 'Unapproved', value4: 0, color4: '#ef4444', icon4: Trash2,
        label5: 'Total Revenue', value5: '0.00', color5: '#f59e0b', icon5: FileText
    };

    if (isVendor) {
        stats.value1 = vendorQuotations.length;
        stats.value2 = vendorQuotations.filter(q => ['Submitted', 'Approved', 'Rejected', 'PO Issued', 'Invoice Raised'].includes(q.status)).length;
        stats.value3 = vendorQuotations.filter(q => REVENUE_STATUSES.includes(q.status)).length;
        stats.value4 = vendorQuotations.filter(q => q.status === 'Rejected').length;
        
        const approvedAndPO = vendorQuotations.filter(q => REVENUE_STATUSES.includes(q.status));
        const byCurrency = approvedAndPO.reduce((acc, q) => {
            acc[q.currency] = (acc[q.currency] || 0) + q.overallTotal;
            return acc;
        }, {} as Record<string, number>);
        const parts = Object.entries(byCurrency).map(([curr, amt]) => `${CURRENCY_SYMBOLS[curr] || curr} ${amt.toFixed(2)}`);
        stats.value5 = parts.length > 0 ? parts.join(' | ') as any : '0.00';
    } else {
        // Admin Stats - Grouped by RFQ No.
        const rfqGroups = new Map<string, Quotation[]>();
        quotations.forEach(q => {
            if (!rfqGroups.has(q.rfqNo)) rfqGroups.set(q.rfqNo, []);
            rfqGroups.get(q.rfqNo)!.push(q);
        });

        stats.label1 = 'Quotations Created';
        stats.value1 = rfqGroups.size;

        stats.label2 = 'Submissions';
        stats.value2 = Array.from(rfqGroups.values()).filter(group => 
            group.some(q => ['Submitted', 'Approved', 'Rejected', 'PO Issued', 'Invoice Raised'].includes(q.status))
        ).length;

        stats.label3 = 'Quotations Approved';
        stats.value3 = Array.from(rfqGroups.values()).filter(group => 
            group.some(q => REVENUE_STATUSES.includes(q.status))
        ).length;

        stats.label4 = 'Quotations Unapproved';
        stats.value4 = Array.from(rfqGroups.values()).filter(group => 
            group.some(q => q.status === 'Rejected')
        ).length;

        stats.icon1 = FilePlus;

        // Total Revenue for Admin - Aggregate all approved, PO issued, and invoice raised quotations
        const approvedAndPOAdmin = quotations.filter(q => REVENUE_STATUSES.includes(q.status));
        const byCurrencyAdmin = approvedAndPOAdmin.reduce((acc, q) => {
            const val = q.adminOverallTotal ?? q.overallTotal;
            acc[q.currency] = (acc[q.currency] || 0) + val;
            return acc;
        }, {} as Record<string, number>);
        const partsAdmin = Object.entries(byCurrencyAdmin).map(([curr, amt]) => `${CURRENCY_SYMBOLS[curr] || curr} ${amt.toFixed(2)}`);
        stats.value5 = partsAdmin.length > 0 ? partsAdmin.join(' | ') as any : '0.00';
    }

    const StatCard = ({ label, value, color, icon: Icon }: any) => (
        <div style={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
            <div style={{
                backgroundColor: `${color}15`,
                color: color,
                padding: '10px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Icon size={20} />
            </div>
            <div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            </div>
        </div>
    );

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(filteredQuotations.map(q => q.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleRfqExpansion = (rfqNo: string) => {
        setExpandedRfqNos(prev => 
            prev.includes(rfqNo) ? prev.filter(r => r !== rfqNo) : [...prev, rfqNo]
        );
    };

    const handleBulkDeleteAction = () => {
        if (selectedIds.length > 0) {
            setDeleteSource('bulk');
            setIsDeleteModalOpen(true);
        }
    };

    const handleSingleDeleteInitiate = (id: string) => {
        setSingleDeleteId(id);
        setDeleteSource('single');
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deleteSource === 'bulk') {
            if (onBulkDelete) {
                onBulkDelete(selectedIds);
                setSelectedIds([]);
            }
        } else if (deleteSource === 'single' && singleDeleteId) {
            onDelete(singleDeleteId);
        }
        setIsDeleteModalOpen(false);
        setSingleDeleteId(null);
    };

    const isAllSelected = filteredQuotations.length > 0 && selectedIds.length === filteredQuotations.length;
    const isSomeSelected = selectedIds.length > 0 && selectedIds.length < filteredQuotations.length;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="flex justify-between align-center border-b pb-4 mb-4" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h2 style={{ margin: 0 }}>Marine Quotations</h2>
                    {!isVendor && selectedIds.length > 0 && (
                        <Button variant="danger" onClick={handleBulkDeleteAction} style={{ padding: '4px 12px', fontSize: '12px' }}>
                            <Trash2 size={14} style={{ marginRight: '6px' }} />
                            Delete Selected ({selectedIds.length})
                        </Button>
                    )}
                </div>
                {!isVendor && (
                    <Button variant="primary" onClick={onCreate}>
                        <FilePlus size={16} style={{ marginRight: '6px' }} />
                        Create New Quotation
                    </Button>
                )}
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                <StatCard label={stats.label1} value={stats.value1} color={stats.color1} icon={stats.icon1} />
                <StatCard label={stats.label2} value={stats.value2} color={stats.color2} icon={stats.icon2} />
                <StatCard label={stats.label3} value={stats.value3} color={stats.color3} icon={stats.icon3} />
                <StatCard label={stats.label4} value={stats.value4} color={stats.color4} icon={stats.icon4} />
                <StatCard label={stats.label5} value={stats.value5} color={stats.color5} icon={stats.icon5} />
            </div>

            <div className="panel">
                <div className="panel-header flex align-center gap-2">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search by RFQ No, Vessel, or Supplier..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            border: 'none',
                            background: 'transparent',
                            outline: 'none',
                            width: '100%',
                            fontSize: '13px'
                        }}
                    />
                </div>
                <div className="panel-body" style={{ padding: 0 }}>
                    <table className="data-table" style={{ border: 'none', borderTop: '1px solid var(--border-color)' }}>
                        <thead>
                            <tr>
                                {!isVendor && (
                                    <th style={{ width: '40px', textAlign: 'center' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={isAllSelected}
                                            ref={input => {
                                                if (input) input.indeterminate = isSomeSelected;
                                            }}
                                            onChange={handleSelectAll} 
                                        />
                                    </th>
                                )}
                                <th>RFQ No.</th>
                                <th>Vessel</th>
                                <th>Supplier</th>
                                <th>Buyer</th>
                                <th>Need By Date</th>
                                <th>Total Value</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center', borderRight: 'none', width: '120px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isVendor ? (
                                filteredQuotations.map(q => (
                                    <tr key={q.id}>
                                        <td style={{ fontWeight: 600, color: '#1e3a5f' }}>{q.rfqNo}</td>
                                        <td>{q.vessel}</td>
                                        <td>{q.supplier}</td>
                                        <td>{q.buyer}</td>
                                        <td>{q.needByDate}</td>
                                        <td>{q.currency} {q.overallTotal.toFixed(2)}</td>
                                        <td><StatusBadge status={q.status} role="vendor" /></td>
                                        <td style={{ textAlign: 'center', borderRight: 'none' }}>
                                                <div className="flex justify-center gap-2">
                                                    <Button variant="icon" onClick={() => onView(q.id)} title="View">
                                                        <Eye size={16} />
                                                    </Button>
                                                    {q.status === 'PO Issued' && (
                                                        <Button 
                                                            variant="icon" 
                                                            onClick={(e) => {
                                                                e?.stopPropagation();
                                                                generatePO(q);
                                                            }} 
                                                            title="Download PO"
                                                            style={{ color: '#0066cc' }}
                                                        >
                                                            <FileText size={16} />
                                                        </Button>
                                                    )}
                                                    {(['SentToVendor', 'Submitted'].includes(q.status) && q.status !== 'Closed' && (q.status !== 'Submitted' || (q.vendorEditCount || 0) < 1)) && (
                                                        <Button variant="icon" onClick={() => onEdit(q.id)} title="Edit">
                                                            <Edit size={16} />
                                                        </Button>
                                                    )}
                                                </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                // Admin Grouped View
                                Array.from(new Set(filteredQuotations.map(q => q.rfqNo))).map(rfqNo => {
                                    const group = filteredQuotations.filter(q => q.rfqNo === rfqNo);
                                    const isExpanded = expandedRfqNos.includes(rfqNo);
                                    const first = group[0];
                                    const isSomeSelectedInGroup = group.some(q => selectedIds.includes(q.id));
                                    const isAllSelectedInGroup = group.every(q => selectedIds.includes(q.id));

                                    return (
                                        <React.Fragment key={rfqNo}>
                                            {/* RFQ Group Header */}
                                            <tr style={{ backgroundColor: '#f8fafc', fontWeight: 600 }}>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isAllSelectedInGroup}
                                                        ref={input => {
                                                            if (input) input.indeterminate = isSomeSelectedInGroup && !isAllSelectedInGroup;
                                                        }}
                                                        onChange={(e) => {
                                                            const ids = group.map(q => q.id);
                                                            if (e.target.checked) {
                                                                setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
                                                            } else {
                                                                setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
                                                            }
                                                        }} 
                                                    />
                                                </td>
                                                <td colSpan={1} onClick={() => toggleRfqExpansion(rfqNo)} style={{ cursor: 'pointer', color: '#2563eb' }}>
                                                    <div className="flex align-center gap-2">
                                                        {isExpanded ? <MinusCircle size={14} /> : <PlusCircle size={14} />}
                                                        {rfqNo}
                                                    </div>
                                                </td>
                                                <td>{first.vessel}</td>
                                                <td style={{ color: '#64748b' }}>{group.length} Vendor(s)</td>
                                                <td>{first.buyer}</td>
                                                <td>{first.needByDate}</td>
                                                <td style={{ fontWeight: 700, color: '#1e293b' }}>
                                                    {(() => {
                                                        const approved = group.find(q => REVENUE_STATUSES.includes(q.status));
                                                        if (approved) {
                                                            return `${approved.currency} ${(approved.adminOverallTotal ?? approved.overallTotal).toFixed(2)}`;
                                                        }
                                                        return '';
                                                    })()}
                                                </td>
                                                <td>
                                                    {group.some(q => q.status === 'Invoice Raised') ? (
                                                        <StatusBadge status="Invoice Raised" />
                                                    ) : group.some(q => q.status === 'PO Issued') ? (
                                                        <StatusBadge status="PO Issued" />
                                                    ) : group.some(q => q.status === 'Approved') ? (
                                                        <StatusBadge status="Approved" />
                                                    ) : group.some(q => q.status === 'Submitted') ? (
                                                        <StatusBadge status="Submitted" />
                                                    ) : (
                                                        <StatusBadge status={first.status} />
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'center', borderRight: 'none' }}>
                                                    <div className="flex justify-center gap-1">
                                                        {onCompare && group.length > 1 && (
                                                            <Button variant="icon" onClick={() => onCompare(rfqNo)} title="Compare Quotations">
                                                                <ArrowLeftRight size={14} />
                                                            </Button>
                                                        )}
                                                        {(() => {
                                                            const approved = group.find(q => REVENUE_STATUSES.includes(q.status));
                                                            if (!approved) return null;
                                                            return (
                                                                <>
                                                                    <Button variant="icon" onClick={() => onView(approved.id)} title="View Approved">
                                                                        <Eye size={14} />
                                                                    </Button>
                                                                    {approved.status === 'PO Issued' && (
                                                                        <Button 
                                                                            variant="icon" 
                                                                            onClick={(e) => {
                                                                                e?.stopPropagation();
                                                                                generatePO(approved);
                                                                            }} 
                                                                            title="Download PO"
                                                                            style={{ color: '#0066cc' }}
                                                                        >
                                                                            <FileText size={14} />
                                                                        </Button>
                                                                    )}
                                                                    <Button variant="icon" onClick={() => onEdit(approved.id)} title="Edit">
                                                                        <Edit size={14} />
                                                                    </Button>
                                                                    {approved.status === 'Approved' && (
                                                                        <Button variant="icon" onClick={() => onEdit(approved.id)} title="Create PO" style={{ color: '#9d174d' }}>
                                                                            <FilePlus size={14} />
                                                                        </Button>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Individual Vendor Rows */}
                                            {isExpanded && group.map(q => (
                                                <tr key={q.id} style={{ backgroundColor: '#fff' }}>
                                                    <td style={{ textAlign: 'center', paddingLeft: '20px' }}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={selectedIds.includes(q.id)}
                                                            onChange={() => handleToggleSelect(q.id)} 
                                                        />
                                                    </td>
                                                    <td style={{ paddingLeft: '30px', color: '#64748b', fontSize: '12px' }}>└ {q.rfqNo}</td>
                                                    <td></td>
                                                    <td style={{ fontWeight: 500 }}>{q.supplier}</td>
                                                    <td></td>
                                                    <td></td>
                                                    <td>
                                                        {q.currency} {(q.adminOverallTotal ?? q.overallTotal).toFixed(2)}
                                                        {q.poNo && (
                                                            <div style={{ fontSize: '10px', color: '#9d174d', fontWeight: 700, marginTop: '2px' }}>
                                                                PO: {q.poNo}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td><StatusBadge status={q.status} /></td>
                                                    <td style={{ textAlign: 'center', borderRight: 'none' }}>
                                                        <div className="flex justify-center gap-1">
                                                            <Button variant="icon" onClick={() => onView(q.id)} title="View">
                                                                <Eye size={14} />
                                                            </Button>
                                                            {q.status === 'PO Issued' && (
                                                                <Button 
                                                                    variant="icon" 
                                                                    onClick={(e) => {
                                                                        e?.stopPropagation();
                                                                        generatePO(q);
                                                                    }} 
                                                                    title="Download PO"
                                                                    style={{ color: '#0066cc' }}
                                                                >
                                                                    <FileText size={14} />
                                                                </Button>
                                                            )}
                                                            {q.status !== 'Closed' && (
                                                                <Button variant="icon" onClick={() => onEdit(q.id)} title="Edit">
                                                                    <Edit size={14} />
                                                                </Button>
                                                            )}
                                                            {q.status === 'Approved' && !isVendor && (
                                                                <Button variant="icon" onClick={() => onEdit(q.id)} title="Create PO" style={{ color: '#9d174d' }}>
                                                                    <FilePlus size={14} />
                                                                </Button>
                                                            )}
                                                            <Button variant="icon" onClick={() => handleSingleDeleteInitiate(q.id)} title="Delete" style={{ color: 'var(--danger-color)' }}>
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })
                            )}
                            {filteredQuotations.length === 0 && (
                                <tr>
                                    <td colSpan={!isVendor ? 9 : 8} style={{ textAlign: 'center', padding: '30px' }}>
                                        No quotations found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
                confirmText="Delete"
                confirmVariant="danger"
            >
                <div>
                    {deleteSource === 'bulk' 
                        ? `Are you sure you want to delete ${selectedIds.length} selected quotations? This action cannot be undone.`
                        : `Are you sure you want to delete this quotation? This action cannot be undone.`
                    }
                </div>
            </Modal>
        </div>
    );
}
