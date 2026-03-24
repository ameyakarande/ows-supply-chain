import { useState, useEffect } from 'react';
import QuotationList from './pages/QuotationList';
import QuotationEntry from './pages/QuotationEntry';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { QuotationComparison } from './pages/QuotationComparison';
import { VendorProfileModal } from './components/common/VendorProfileModal';
import { initialQuotations, initialMasterData } from './data/mockData';
import InvoiceEntry from './pages/InvoiceEntry';
import { Quotation, MasterData, Invoice } from './types';
import InvoiceDashboard from './pages/InvoiceDashboard';
import VendorDirectory from './pages/VendorDirectory';

type Page = 'list' | 'entry' | 'view' | 'admin' | 'compare' | 'invoice' | 'invoice-list' | 'vendors';

function AppInner() {
    const { currentUser, login, logout, users, saveUsers } = useAuth();
    const [currentPage, setCurrentPage] = useState<Page>('list');
    const [currentQuotationId, setCurrentQuotationId] = useState<string | null>(null);
    const [selectedRfq, setSelectedRfq] = useState<string | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
    const [masterData, setMasterData] = useState<MasterData>(() => {
        const saved = localStorage.getItem('marine-master-data');
        if (saved) {
            try {
                return { ...initialMasterData, ...JSON.parse(saved) };
            } catch (e) {
                console.error('Failed to parse saved master data', e);
            }
        }
        return initialMasterData;
    });

    useEffect(() => {
        localStorage.setItem('marine-master-data', JSON.stringify(masterData));
    }, [masterData]);
    const [quotations, setQuotations] = useState<Quotation[]>(() => {
        const saved = localStorage.getItem('marine-quotations');
        if (saved) {
            try {
                const parsed: Quotation[] = JSON.parse(saved);
                // Rehydrate attachments from their dedicated keys
                return parsed.map(q => {
                    const attKey = `marine-attachments-${q.id}`;
                    const attData = localStorage.getItem(attKey);
                    if (attData) {
                        try {
                            const { reqAtts, quoAtts } = JSON.parse(attData);
                            return { ...q, requisitionAttachments: reqAtts ?? [], quotationAttachments: quoAtts ?? [] };
                        } catch (_) { /* ignore */ }
                    }
                    return q;
                });
            } catch (e) {
                console.error('Failed to parse saved quotations', e);
            }
        }
        return initialQuotations;
    });

    useEffect(() => {
        // Save quotation metadata WITHOUT the large base64 attachment data
        const slim = quotations.map(q => ({
            ...q,
            requisitionAttachments: [],
            quotationAttachments: []
        }));
        try {
            localStorage.setItem('marine-quotations', JSON.stringify(slim));
        } catch (e) {
            console.error('Failed to save quotations metadata', e);
        }

        // Save each quotation's attachments in a separate, dedicated key
        quotations.forEach(q => {
            const attKey = `marine-attachments-${q.id}`;
            try {
                localStorage.setItem(attKey, JSON.stringify({
                    reqAtts: q.requisitionAttachments ?? [],
                    quoAtts: q.quotationAttachments ?? []
                }));
            } catch (e: any) {
                if (e.name === 'QuotaExceededError') {
                    alert(`Storage limit reached while saving attachments for quotation ${q.id}. Please remove large attachments to free up space.`);
                } else {
                    console.error('Failed to save attachments', e);
                }
            }
        });
    }, [quotations]);

    const [invoices, setInvoices] = useState<Invoice[]>(() => {
        const saved = localStorage.getItem('marine-invoices');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('marine-invoices', JSON.stringify(invoices));
    }, [invoices]);

    const handleCreateNew = () => {
        setCurrentQuotationId(null);
        setCurrentPage('entry');
    };

    const handleEdit = (id: string) => {
        setCurrentQuotationId(id);
        setCurrentPage('entry');
    };

    const handleView = (id: string) => {
        setCurrentQuotationId(id);
        setCurrentPage('view');
    };

    const handleBackToList = () => {
        setCurrentPage('list');
    };

    const handleCompare = (rfqNo: string) => {
        setSelectedRfq(rfqNo);
        setCurrentPage('compare');
    };

    const handleSaveQuotation = (quotation: Quotation) => {
        setQuotations((prev) => {
            const existingIndex = prev.findIndex((q) => q.id === quotation.id);
            if (existingIndex >= 0) {
                const next = [...prev];
                next[existingIndex] = quotation;
                return next;
            }
            return [...prev, quotation];
        });
        // In a real app we'd save to an API or local storage here
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this quotation?")) {
            setQuotations((prev) => prev.filter(q => q.id !== id));
        }
    };

    const handleBulkDelete = (ids: string[]) => {
        setQuotations((prev) => prev.filter(q => !ids.includes(q.id)));
    };

    if (!currentUser) {
        return <LoginPage onLogin={() => setCurrentPage('list')} />;
    }

    const isVendor = currentUser.role === 'vendor';

    return (
        <div className="app-container">
            {/* Top Navigation Bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 20px',
                backgroundColor: '#1e3a5f',
                color: '#fff',
                fontSize: '13px',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src="/logo.png" alt="Logo" style={{ height: '32px', width: '32px' }} />
                    <div style={{ fontWeight: 700, letterSpacing: '-0.3px', fontSize: '14px' }}>OceanWharf Marine Procurement</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ color: '#94a3b8' }}>
                        Logged in as: <strong style={{ color: '#fff' }}>{currentUser.displayName}</strong>
                        <span style={{
                            marginLeft: '8px',
                            padding: '1px 7px',
                            borderRadius: '10px',
                            backgroundColor: isVendor ? '#dcfce7' : '#dbeafe',
                            color: isVendor ? '#166534' : '#1e40af',
                            fontSize: '11px',
                            fontWeight: 600
                        }}>{isVendor ? 'Vendor' : 'Company'}</span>
                    </span>
                    {isVendor && (
                        <button
                            onClick={() => setIsProfileModalOpen(true)}
                            style={{ background: 'none', border: '1px solid #94a3b8', color: '#fff', padding: '3px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                        >
                            Profile
                        </button>
                    )}
                    {!isVendor && (
                        <button
                            onClick={() => {
                                setCurrentInvoice(null);
                                setCurrentPage('invoice-list');
                            }}
                            style={{ background: 'none', border: '1px solid #94a3b8', color: '#fff', padding: '3px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                        >
                            Invoices
                        </button>
                    )}
                    {!isVendor && (
                        <button
                            onClick={() => setCurrentPage('vendors')}
                            style={{ background: 'none', border: '1px solid #94a3b8', color: '#fff', padding: '3px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                        >
                            Vendors
                        </button>
                    )}
                    {!isVendor && (
                        <button
                            onClick={() => setCurrentPage('admin')}
                            style={{ background: 'none', border: '1px solid #94a3b8', color: '#fff', padding: '3px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                        >
                            ⚙ Admin
                        </button>
                    )}
                    <button
                        onClick={logout}
                        style={{ background: 'none', border: '1px solid #94a3b8', color: '#fff', padding: '3px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Page Content */}
            <div style={{ padding: '20px' }}>
                {currentPage === 'invoice-list' && !isVendor && (
                    <InvoiceDashboard 
                        invoices={invoices}
                        onBack={() => setCurrentPage('list')}
                        onNewInvoice={() => {
                            setCurrentInvoice(null);
                            setCurrentPage('invoice');
                        }}
                        onEditInvoice={(inv) => {
                            setCurrentInvoice(inv);
                            setCurrentPage('invoice');
                        }}
                        onViewInvoice={(inv) => console.log('View Invoice', inv)}
                        onDeleteInvoice={(inv) => {
                            if (!window.confirm(`Are you sure you want to delete invoice ${inv.invoiceNo}?`)) {
                                return;
                            }

                            const remainingInvoices = invoices.filter(existing => existing.id !== inv.id);
                            setInvoices(remainingInvoices);

                            if (inv.poId && !remainingInvoices.some(existing => existing.poId === inv.poId)) {
                                setQuotations((prev) => prev.map(q =>
                                    q.id === inv.poId && q.status === 'Invoice Raised'
                                        ? { ...q, status: 'PO Issued' }
                                        : q
                                ));
                            }
                        }}
                    />
                )}
                {currentPage === 'invoice' && !isVendor && (
                    <InvoiceEntry 
                        onBack={() => setCurrentPage('invoice-list')} 
                        editInvoice={currentInvoice}
                        onSave={(inv) => {
                            setInvoices((prev) => {
                                const idx = prev.findIndex(i => i.id === inv.id);
                                if (idx >= 0) {
                                    const next = [...prev];
                                    next[idx] = inv;
                                    return next;
                                }
                                return [...prev, inv];
                            });
                            
                            // Update PO status if applicable
                            if (inv.poId) {
                                setQuotations((prev) => prev.map(q => 
                                    q.id === inv.poId ? { ...q, status: 'Invoice Raised' } : q
                                ));
                            }
                        }}
                        masterData={masterData}
                        quotations={quotations}
                    />
                )}
                {currentPage === 'admin' && !isVendor && (
                    <AdminPage 
                        onBack={() => setCurrentPage('list')} 
                        quotations={quotations}
                        masterData={masterData}
                        onUpdateMasterData={setMasterData}
                    />
                )}
                {currentPage === 'vendors' && !isVendor && (
                    <VendorDirectory
                        users={users}
                        onBack={() => setCurrentPage('list')}
                    />
                )}
                {currentPage === 'list' && (
                    <QuotationList
                        quotations={quotations}
                        onCreate={handleCreateNew}
                        onEdit={handleEdit}
                        onView={handleView}
                        onDelete={handleDelete}
                        onBulkDelete={handleBulkDelete}
                        onCompare={handleCompare}
                        isVendor={isVendor}
                        currentUserEmail={currentUser.email}
                    />
                )}
                {currentPage === 'compare' && selectedRfq && (
                    <QuotationComparison 
                        rfqNo={selectedRfq}
                        quotations={quotations.filter(q => q.rfqNo === selectedRfq)}
                        onBack={handleBackToList}
                    />
                )}
                {(currentPage === 'entry' || currentPage === 'view') && (
                    <QuotationEntry
                        quotationId={currentQuotationId}
                        quotations={quotations}
                        onBack={handleBackToList}
                        onSave={handleSaveQuotation}
                        isViewMode={currentPage === 'view'}
                        isVendor={isVendor}
                        currentUserEmail={currentUser.email}
                        users={users}
                        saveUsers={saveUsers}
                        masterData={masterData}
                        onUpdateMasterData={setMasterData}
                    />
                )}
                {isProfileModalOpen && currentUser && isVendor && (
                    <VendorProfileModal
                        isOpen={isProfileModalOpen}
                        onClose={() => setIsProfileModalOpen(false)}
                        user={currentUser}
                        onSave={(updated) => {
                            const updatedUsers = users.map(u => u.id === updated.id ? updated : u);
                            saveUsers(updatedUsers);
                            login(updated.username, updated.password);
                        }}
                    />
                )}
            </div>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppInner />
        </AuthProvider>
    );
}

export default App;
