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
import { Quotation, MasterData, Invoice, NotificationRecord, EmailDraft, EmailSignature, EmailMessageRecord, EmailTemplate } from './types';
import InvoiceDashboard from './pages/InvoiceDashboard';
import VendorDirectory from './pages/VendorDirectory';
import { appDataService } from './services/appData';
import { isSupabaseConfigured } from './services/supabase';
import { NotificationBell } from './components/common/NotificationBell';
import VendorEmailPage from './pages/VendorEmailPage';
import VendorRegistration from './pages/VendorRegistration';
import { AppUser } from './context/AuthContext';

type Page = 'list' | 'entry' | 'view' | 'admin' | 'compare' | 'invoice' | 'invoice-list' | 'vendors' | 'vendor-email' | 'registration';
const EMAIL_STATE_VERSION = '2';
const EMAIL_STATE_VERSION_KEY = 'marine-email-state-version';

function readLocalJson<T>(key: string, fallback: T): T {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) as T : fallback;
    } catch (error) {
        console.error(`Failed to parse local storage key ${key}`, error);
        localStorage.removeItem(key);
        return fallback;
    }
}

function sanitizeAttachments<T extends { attachments?: Array<{ base64Data?: string }> }>(items: T[]): T[] {
    return items.map(item => ({
        ...item,
        attachments: (item.attachments || []).map(attachment => ({
            ...attachment,
            base64Data: attachment.base64Data || ''
        }))
    }));
}

function sanitizeEmailDrafts(drafts: EmailDraft[]): EmailDraft[] {
    return sanitizeAttachments(drafts).filter(draft => draft.status === 'draft');
}

function sanitizeEmailMessages(messages: EmailMessageRecord[]): EmailMessageRecord[] {
    return sanitizeAttachments(messages);
}

function AppInner() {
    const { currentUser, login, logout, users, saveUsers } = useAuth();
    const [currentPage, setCurrentPage] = useState<Page>('list');
    const [currentQuotationId, setCurrentQuotationId] = useState<string | null>(null);
    const [selectedRfq, setSelectedRfq] = useState<string | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
    const [notifications, setNotifications] = useState<NotificationRecord[]>(() => readLocalJson('marine-notifications', []));
    const [emailDrafts, setEmailDrafts] = useState<EmailDraft[]>(() => sanitizeEmailDrafts(readLocalJson('marine-email-drafts', [])));
    const [emailSignatures, setEmailSignatures] = useState<EmailSignature[]>(() => readLocalJson('marine-email-signatures', []));
    const [emailMessages, setEmailMessages] = useState<EmailMessageRecord[]>(() => sanitizeEmailMessages(readLocalJson('marine-email-messages', [])));
    const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(() => readLocalJson('marine-email-templates', []));
    const [hasHydratedSupabaseData, setHasHydratedSupabaseData] = useState(!isSupabaseConfigured);
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
        const currentVersion = localStorage.getItem(EMAIL_STATE_VERSION_KEY);
        if (currentVersion !== EMAIL_STATE_VERSION) {
            localStorage.removeItem('marine-email-drafts');
            localStorage.removeItem('marine-email-messages');
            localStorage.setItem(EMAIL_STATE_VERSION_KEY, EMAIL_STATE_VERSION);
            setEmailDrafts([]);
            setEmailMessages([]);
        }

        const params = new URLSearchParams(window.location.search);
        if (params.get('page') === 'register') {
            setCurrentPage('registration');
        }
    }, []);

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

    const [invoices, setInvoices] = useState<Invoice[]>(() => readLocalJson('marine-invoices', []));

    useEffect(() => {
        try {
            localStorage.setItem('marine-invoices', JSON.stringify(invoices));
        } catch (e) {
            console.error('Failed to save invoices', e);
        }
    }, [invoices]);

    useEffect(() => {
        try {
            localStorage.setItem('marine-notifications', JSON.stringify(notifications));
        } catch (e) {
            console.error('Failed to save notifications', e);
        }
    }, [notifications]);

    useEffect(() => {
        try {
            localStorage.setItem('marine-email-drafts', JSON.stringify(emailDrafts));
        } catch (e) {
            console.error('Failed to save email drafts', e);
        }
    }, [emailDrafts]);

    useEffect(() => {
        try {
            localStorage.setItem('marine-email-signatures', JSON.stringify(emailSignatures));
        } catch (e) {
            console.error('Failed to save email signatures', e);
        }
    }, [emailSignatures]);

    useEffect(() => {
        try {
            localStorage.setItem('marine-email-messages', JSON.stringify(emailMessages));
        } catch (e) {
            console.error('Failed to save email messages', e);
        }
    }, [emailMessages]);

    useEffect(() => {
        try {
            localStorage.setItem('marine-email-templates', JSON.stringify(emailTemplates));
        } catch (e) {
            console.error('Failed to save email templates', e);
        }
    }, [emailTemplates]);

    useEffect(() => {
        let isMounted = true;

        const hydrateSupabaseData = async () => {
            if (!isSupabaseConfigured) {
                setHasHydratedSupabaseData(true);
                return;
            }

            const [remoteMasterData, remoteQuotations, remoteInvoices, remoteNotifications, remoteEmailDrafts, remoteEmailSignatures, remoteEmailMessages, remoteEmailTemplates] = await Promise.all([
                appDataService.loadMasterData(),
                appDataService.loadQuotations(),
                appDataService.loadInvoices(),
                appDataService.loadNotifications(),
                appDataService.loadEmailDrafts(),
                appDataService.loadEmailSignatures(),
                appDataService.loadEmailMessages(),
                appDataService.loadEmailTemplates()
            ]);

            if (!isMounted) return;

            if (remoteMasterData) {
                setMasterData(remoteMasterData);
                localStorage.setItem('marine-master-data', JSON.stringify(remoteMasterData));
            } else {
                await appDataService.saveMasterData(masterData);
            }

            if (remoteQuotations && remoteQuotations.length > 0) {
                setQuotations(remoteQuotations);

                const slim = remoteQuotations.map(q => ({
                    ...q,
                    requisitionAttachments: [],
                    quotationAttachments: []
                }));
                localStorage.setItem('marine-quotations', JSON.stringify(slim));

                remoteQuotations.forEach(q => {
                    localStorage.setItem(`marine-attachments-${q.id}`, JSON.stringify({
                        reqAtts: q.requisitionAttachments ?? [],
                        quoAtts: q.quotationAttachments ?? []
                    }));
                });
            } else {
                await appDataService.saveQuotations(quotations);
            }

            if (remoteInvoices) {
                setInvoices(remoteInvoices);
                localStorage.setItem('marine-invoices', JSON.stringify(remoteInvoices));
            } else {
                await appDataService.saveInvoices(invoices);
            }

            if (remoteNotifications) {
                setNotifications(remoteNotifications);
                localStorage.setItem('marine-notifications', JSON.stringify(remoteNotifications));
            } else {
                await appDataService.saveNotifications(notifications);
            }

            if (remoteEmailDrafts) {
                const sanitizedDrafts = sanitizeEmailDrafts(remoteEmailDrafts);
                setEmailDrafts(sanitizedDrafts);
                localStorage.setItem('marine-email-drafts', JSON.stringify(sanitizedDrafts));
            } else {
                await appDataService.saveEmailDrafts(emailDrafts);
            }

            if (remoteEmailSignatures) {
                setEmailSignatures(remoteEmailSignatures);
                localStorage.setItem('marine-email-signatures', JSON.stringify(remoteEmailSignatures));
            } else {
                await appDataService.saveEmailSignatures(emailSignatures);
            }

            if (remoteEmailMessages) {
                const sanitizedMessages = sanitizeEmailMessages(remoteEmailMessages);
                setEmailMessages(sanitizedMessages);
                localStorage.setItem('marine-email-messages', JSON.stringify(sanitizedMessages));
            } else {
                await appDataService.saveEmailMessages(emailMessages);
            }

            if (remoteEmailTemplates) {
                setEmailTemplates(remoteEmailTemplates);
                localStorage.setItem('marine-email-templates', JSON.stringify(remoteEmailTemplates));
            } else {
                await appDataService.saveEmailTemplates(emailTemplates);
            }

            setHasHydratedSupabaseData(true);
        };

        void hydrateSupabaseData();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!hasHydratedSupabaseData) return;
        void appDataService.saveMasterData(masterData);
    }, [masterData, hasHydratedSupabaseData]);

    useEffect(() => {
        if (!hasHydratedSupabaseData) return;
        void appDataService.saveQuotations(quotations);
    }, [quotations, hasHydratedSupabaseData]);

    useEffect(() => {
        if (!hasHydratedSupabaseData) return;
        void appDataService.saveInvoices(invoices);
    }, [invoices, hasHydratedSupabaseData]);

    useEffect(() => {
        if (!hasHydratedSupabaseData) return;
        void appDataService.saveNotifications(notifications);
    }, [notifications, hasHydratedSupabaseData]);

    useEffect(() => {
        if (!hasHydratedSupabaseData) return;
        void appDataService.saveEmailDrafts(emailDrafts);
    }, [emailDrafts, hasHydratedSupabaseData]);

    useEffect(() => {
        if (!hasHydratedSupabaseData) return;
        void appDataService.saveEmailSignatures(emailSignatures);
    }, [emailSignatures, hasHydratedSupabaseData]);

    useEffect(() => {
        if (!hasHydratedSupabaseData) return;
        void appDataService.saveEmailMessages(emailMessages);
    }, [emailMessages, hasHydratedSupabaseData]);

    useEffect(() => {
        if (!hasHydratedSupabaseData) return;
        void appDataService.saveEmailTemplates(emailTemplates);
    }, [emailTemplates, hasHydratedSupabaseData]);

    const createNotification = (recipientEmail: string, title: string, message: string, relatedQuotationId?: string) => {
        setNotifications(prev => [
            {
                id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                recipientEmail,
                title,
                message,
                createdAt: new Date().toISOString(),
                isRead: false,
                relatedQuotationId
            },
            ...prev
        ]);
    };

    const markCurrentUserNotificationsRead = () => {
        if (!currentUser) return;

        setNotifications(prev => prev.map(notification =>
            notification.recipientEmail === currentUser.email
                ? { ...notification, isRead: true }
                : notification
        ));
    };

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

            if (existingIndex === -1 && currentUser?.role === 'company' && quotation.status === 'SentToVendor' && quotation.supplierEmail) {
                createNotification(
                    quotation.supplierEmail,
                    'New quotation request',
                    `You have a new quotation request for RFQ ${quotation.rfqNo}.`,
                    quotation.id
                );
            }

            if (
                existingIndex >= 0 &&
                currentUser?.role === 'vendor' &&
                quotation.status === 'Submitted' &&
                prev[existingIndex].status !== 'Submitted'
            ) {
                users
                    .filter(user => user.role === 'company')
                    .forEach(adminUser => {
                        createNotification(
                            adminUser.email,
                            'Vendor submission received',
                            `You have received a submission from ${currentUser?.displayName || 'a vendor'}.`,
                            quotation.id
                        );
                    });
            }

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

    const handleRegisterSubmit = async (vendorData: Partial<AppUser>) => {
        if (!vendorData.email || !vendorData.displayName) return false;
        
        const exists = users.some(u => u.email === vendorData.email || u.username === vendorData.username);
        if (exists) return false;

        const newUser: AppUser = {
            id: `u-${Date.now()}`,
            username: vendorData.username || vendorData.email,
            password: vendorData.password || 'welcome@123',
            role: 'vendor',
            displayName: vendorData.displayName,
            email: vendorData.email,
            whatsappNumber: vendorData.whatsappNumber,
            telegramUsername: vendorData.telegramUsername,
            telephoneNumber: vendorData.telephoneNumber,
            mobileNumber: vendorData.mobileNumber,
            fullAddress: vendorData.fullAddress,
            countries: vendorData.countries || [],
            categories: vendorData.categories || []
        };

        saveUsers([...users, newUser]);

        // Add to master data suppliers if not present
        if (!masterData.suppliers.some(s => s.email === newUser.email)) {
            setMasterData(prev => ({
                ...prev,
                suppliers: [...prev.suppliers, { name: newUser.displayName, email: newUser.email }]
            }));
        }

        return true;
    };

    if (currentPage === 'registration') {
        return (
            <div className="app-container" style={{ backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
                <VendorRegistration 
                    masterData={masterData}
                    onRegister={handleRegisterSubmit}
                    onBackToLogin={() => {
                        window.history.replaceState({}, '', window.location.pathname);
                        setCurrentPage('list');
                        window.location.reload(); 
                    }}
                />
            </div>
        );
    }

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
                position: 'sticky',
                top: '10px',
                zIndex: 1000,
                padding: '8px 20px',
                backgroundColor: '#1e3a5f',
                color: '#fff',
                fontSize: '13px',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                borderRadius: '10px',
                margin: '0 20px 20px 20px'
            }}>
                <div 
                    onClick={() => setCurrentPage('list')}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                >
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
                    {currentUser && (
                        <button
                            onClick={() => setIsProfileModalOpen(true)}
                            style={{ background: 'none', border: '1px solid #94a3b8', color: '#fff', padding: '3px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                        >
                            Profile
                        </button>
                    )}
                    <NotificationBell
                        notifications={notifications.filter(notification => notification.recipientEmail === currentUser.email)}
                        onMarkAllRead={markCurrentUserNotificationsRead}
                    />
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
                            onClick={() => setCurrentPage('vendor-email')}
                            style={{ background: 'none', border: '1px solid #94a3b8', color: '#fff', padding: '3px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                        >
                            Vendor Mail
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
                        masterData={masterData}
                        onBack={() => setCurrentPage('list')}
                        onSaveUsers={saveUsers}
                        onUpdateMasterData={setMasterData}
                    />
                )}
                {currentPage === 'vendor-email' && !isVendor && currentUser && (
                    <VendorEmailPage
                        currentUser={currentUser}
                        users={users}
                        drafts={emailDrafts}
                        signatures={emailSignatures}
                        messages={emailMessages}
                        templates={emailTemplates}
                        onBack={() => setCurrentPage('list')}
                        onSaveDrafts={setEmailDrafts}
                        onSaveSignatures={setEmailSignatures}
                        onSaveMessages={setEmailMessages}
                        onSaveTemplates={setEmailTemplates}
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
