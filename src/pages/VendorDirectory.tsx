import React, { useEffect, useMemo, useState } from 'react';
import { AppUser } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { ArrowLeft, Building2, ChevronLeft, ChevronRight, FileText, Globe2, ListFilter, Mail, Pencil, Plus } from 'lucide-react';
import { VendorProfileModal } from '../components/common/VendorProfileModal';
import { Modal } from '../components/common/Modal';
import { MasterData } from '../types';
import { createVendorWithUserManagementLogic } from '../utils/vendorUtils';

interface VendorDirectoryProps {
    users: AppUser[];
    masterData: MasterData;
    onBack: () => void;
    onSaveUsers: (users: AppUser[]) => void;
    onUpdateMasterData: (data: MasterData) => void;
}

type AlphabeticalOrder = 'A-Z' | 'Z-A';

const CARDS_PER_PAGE = 30;

export default function VendorDirectory({
    users,
    masterData,
    onBack,
    onSaveUsers,
    onUpdateMasterData
}: VendorDirectoryProps) {
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [countryFilter, setCountryFilter] = useState('All');
    const [alphabeticalOrder, setAlphabeticalOrder] = useState<AlphabeticalOrder>('A-Z');
    const [currentPage, setCurrentPage] = useState(1);
    const [editingVendor, setEditingVendor] = useState<AppUser | null>(null);
    const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newDisplayName, setNewDisplayName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [addError, setAddError] = useState('');
    const [createdCredentials, setCreatedCredentials] = useState<{ username: string; password: string } | null>(null);

    const vendors = useMemo(
        () => users.filter(user => user.role === 'vendor'),
        [users]
    );

    const categoryOptions = useMemo(() => {
        const categories = vendors.flatMap(vendor => vendor.categories || []);
        return ['All', ...Array.from(new Set(categories)).sort((a, b) => a.localeCompare(b))];
    }, [vendors]);

    const countryOptions = useMemo(() => {
        const countries = vendors.flatMap(vendor => vendor.countries || []);
        return ['All', ...Array.from(new Set(countries)).sort((a, b) => a.localeCompare(b))];
    }, [vendors]);

    const filteredVendors = useMemo(() => {
        const next = vendors.filter(vendor => {
            const matchesCategory = categoryFilter === 'All' || (vendor.categories || []).includes(categoryFilter);
            const matchesCountry = countryFilter === 'All' || (vendor.countries || []).includes(countryFilter);
            return matchesCategory && matchesCountry;
        });

        next.sort((a, b) => {
            const direction = alphabeticalOrder === 'A-Z' ? 1 : -1;
            return a.displayName.localeCompare(b.displayName) * direction;
        });

        return next;
    }, [vendors, categoryFilter, countryFilter, alphabeticalOrder]);

    const totalPages = Math.max(1, Math.ceil(filteredVendors.length / CARDS_PER_PAGE));
    const paginatedVendors = filteredVendors.slice((currentPage - 1) * CARDS_PER_PAGE, currentPage * CARDS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [categoryFilter, countryFilter, alphabeticalOrder]);

    useEffect(() => {
        setCurrentPage(prev => Math.min(prev, totalPages));
    }, [totalPages]);

    const filterBoxStyle: React.CSSProperties = {
        padding: '10px 12px',
        border: '1px solid #dbe2f0',
        borderRadius: '8px',
        fontSize: '13px',
        backgroundColor: '#fff',
        minWidth: '190px'
    };

    const infoPillStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 8px',
        borderRadius: '999px',
        backgroundColor: '#eef2ff',
        color: '#334155',
        fontSize: '12px',
        fontWeight: 600
    };

    const inputStyle: React.CSSProperties = {
        padding: '9px 10px',
        border: '1px solid #c7cfe4',
        borderRadius: '6px',
        fontSize: '13px',
        width: '100%',
        boxSizing: 'border-box'
    };

    const resetAddVendorForm = () => {
        setNewUsername('');
        setNewPassword('');
        setNewDisplayName('');
        setNewEmail('');
        setAddError('');
        setCreatedCredentials(null);
    };

    const handleAddVendor = () => {
        const result = createVendorWithUserManagementLogic({
            users,
            masterData,
            username: newUsername,
            password: newPassword,
            displayName: newDisplayName,
            email: newEmail
        });

        if ('error' in result) {
            setAddError(result.error);
            return;
        }

        onSaveUsers([...users, result.user]);
        onUpdateMasterData(result.masterData);
        setCreatedCredentials(result.credentials);
        setAddError('');
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #dbe2f0', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Button variant="secondary" onClick={onBack}>
                        <ArrowLeft size={16} style={{ marginRight: '6px' }} />
                        Back
                    </Button>
                    <div style={{ padding: '10px', borderRadius: '12px', background: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)', color: '#1d4ed8' }}>
                        <Building2 size={22} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '22px', color: '#0f172a' }}>Vendor Directory</h2>
                        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>Admin-only directory of all registered vendors.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ ...infoPillStyle, backgroundColor: '#dcfce7', color: '#166534' }}>
                        {filteredVendors.length} Vendor{filteredVendors.length === 1 ? '' : 's'}
                    </div>
                    <Button variant="primary" onClick={() => setIsAddVendorModalOpen(true)}>
                        <Plus size={16} style={{ marginRight: '6px' }} />
                        Add Vendor
                    </Button>
                </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px', padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: 600, fontSize: '13px', marginRight: '4px' }}>
                    <ListFilter size={16} />
                    Filters
                </div>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={filterBoxStyle}>
                    {categoryOptions.map(option => (
                        <option key={option} value={option}>
                            {option === 'All' ? 'All Categories' : option}
                        </option>
                    ))}
                </select>
                <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} style={filterBoxStyle}>
                    {countryOptions.map(option => (
                        <option key={option} value={option}>
                            {option === 'All' ? 'All Countries' : option}
                        </option>
                    ))}
                </select>
                <select value={alphabeticalOrder} onChange={e => setAlphabeticalOrder(e.target.value as AlphabeticalOrder)} style={filterBoxStyle}>
                    <option value="A-Z">Alphabetical: A to Z</option>
                    <option value="Z-A">Alphabetical: Z to A</option>
                </select>
            </div>

            {filteredVendors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', border: '1px dashed #cbd5e1', borderRadius: '12px', backgroundColor: '#fff' }}>
                    <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>No vendors match these filters</h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Try a different category, country, or alphabetical sort.</p>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        {paginatedVendors.map(vendor => (
                            <div key={vendor.id} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: '#0f172a', fontSize: '16px' }}>{vendor.displayName}</h3>
                                        <div style={{ marginTop: '6px', fontSize: '12px', color: '#64748b' }}>{vendor.username}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ ...infoPillStyle, backgroundColor: '#eff6ff', color: '#1d4ed8' }}>Vendor</span>
                                        <Button variant="icon" onClick={() => setEditingVendor(vendor)} title="Edit Vendor" style={{ color: '#2563eb' }}>
                                            <Pencil size={14} />
                                        </Button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px' }}>
                                        <Mail size={14} color="#64748b" />
                                        <span>{vendor.email}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px' }}>
                                        <Globe2 size={14} color="#64748b" />
                                        <span>{vendor.countries?.length ? vendor.countries.join(', ') : 'No countries added'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px' }}>
                                        <FileText size={14} color="#64748b" />
                                        <span>{vendor.documents?.length || 0} document{vendor.documents?.length === 1 ? '' : 's'}</span>
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                                        Categories
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {(vendor.categories?.length ? vendor.categories : ['Unassigned']).map(category => (
                                            <span key={category} style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 9px', borderRadius: '999px', backgroundColor: category === 'Unassigned' ? '#f1f5f9' : '#fef3c7', color: category === 'Unassigned' ? '#64748b' : '#92400e', fontSize: '12px', fontWeight: 600 }}>
                                                {category}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', padding: '12px 16px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                            Showing {(currentPage - 1) * CARDS_PER_PAGE + 1}-
                            {Math.min(currentPage * CARDS_PER_PAGE, filteredVendors.length)} of {filteredVendors.length}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Button variant="secondary" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                                <ChevronLeft size={14} style={{ marginRight: '6px' }} />
                                Prev
                            </Button>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button variant="secondary" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                                Next
                                <ChevronRight size={14} style={{ marginLeft: '6px' }} />
                            </Button>
                        </div>
                    </div>
                </>
            )}

            <Modal
                isOpen={isAddVendorModalOpen}
                onClose={() => {
                    setIsAddVendorModalOpen(false);
                    resetAddVendorForm();
                }}
                onConfirm={handleAddVendor}
                title="Add New Vendor"
                confirmText="Create Vendor"
            >
                <div style={{ display: 'grid', gap: '14px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>Display Name</label>
                        <input style={inputStyle} value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} placeholder="e.g. Aqua Provisions" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>Username</label>
                        <input style={inputStyle} value={newUsername} onChange={e => { setNewUsername(e.target.value); setAddError(''); }} placeholder="e.g. vendor2" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>Email Address</label>
                        <input style={inputStyle} value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="e.g. vendor@example.com" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>Password (auto-generated if empty)</label>
                        <input style={inputStyle} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Set or leave empty" />
                    </div>
                    {addError && <div style={{ color: '#dc2626', fontSize: '12px' }}>{addError}</div>}
                    {createdCredentials && (
                        <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '10px', borderRadius: '8px', fontSize: '13px', border: '1px solid #bbf7d0' }}>
                            <strong>Vendor created successfully.</strong><br />
                            Username: {createdCredentials.username}<br />
                            Password: {createdCredentials.password}
                        </div>
                    )}
                </div>
            </Modal>

            {editingVendor && (
                <VendorProfileModal
                    isOpen={Boolean(editingVendor)}
                    onClose={() => setEditingVendor(null)}
                    user={editingVendor}
                    onSave={(updated) => {
                        const original = users.find(user => user.id === updated.id);
                        onSaveUsers(users.map(user => user.id === updated.id ? updated : user));

                        if (original) {
                            const supplierExists = masterData.suppliers.some(supplier => supplier.email === original.email);
                            const updatedSuppliers = supplierExists
                                ? masterData.suppliers.map(supplier =>
                                    supplier.email === original.email
                                        ? { name: updated.displayName, email: updated.email }
                                        : supplier
                                )
                                : [...masterData.suppliers, { name: updated.displayName, email: updated.email }];

                            onUpdateMasterData({
                                ...masterData,
                                suppliers: updatedSuppliers
                            });
                        }
                    }}
                    isAdminView={true}
                />
            )}
        </div>
    );
}
