import React, { useState, useMemo } from 'react';
import { MasterData } from '../types';
import { AppUser } from '../context/AuthContext';
import { 
    Users, 
    Search, 
    ArrowLeft, 
    Mail, 
    Phone, 
    Send, 
    ChevronLeft, 
    ChevronRight, 
    MapPin,
    Building2,
    Copy,
    ListFilter,
    UserPlus,
    Edit,
    LayoutGrid,
    List,
    Trash2,
    CheckSquare,
    Square
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { VendorProfileModal } from '../components/common/VendorProfileModal';
import { Modal } from '../components/common/Modal';

interface VendorDirectoryProps {
    users: AppUser[];
    masterData: MasterData;
    onBack: () => void;
    onSaveUsers: (users: AppUser[]) => void;
    onUpdateMasterData: (data: MasterData) => void;
}

export default function VendorDirectory({ users, masterData, onBack, onSaveUsers, onUpdateMasterData }: VendorDirectoryProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [copySuccess, setCopySuccess] = useState(false);
    const [editingVendor, setEditingVendor] = useState<AppUser | null>(null);
    const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteSource, setDeleteSource] = useState<'single' | 'bulk'>('bulk');
    const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);
    
    const vendorsPerPage = 50;

    const vendors = useMemo(() => {
        return users.filter(u => u.role === 'vendor');
    }, [users]);

    const filteredVendors = useMemo(() => {
        const query = searchTerm.toLowerCase();
        return vendors.filter(v => 
            v.displayName.toLowerCase().includes(query) ||
            v.username.toLowerCase().includes(query) ||
            v.email.toLowerCase().includes(query) ||
            v.categories?.some(c => c.toLowerCase().includes(query)) ||
            v.countries?.some(c => c.toLowerCase().includes(query))
        );
    }, [vendors, searchTerm]);

    const totalPages = Math.ceil(filteredVendors.length / vendorsPerPage);
    const paginatedVendors = filteredVendors.slice(
        (currentPage - 1) * vendorsPerPage,
        currentPage * vendorsPerPage
    );

    const copyRegistrationLink = () => {
        const url = `${window.location.origin}${window.location.pathname}?page=register`;
        navigator.clipboard.writeText(url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handleAddVendor = (newUser: AppUser) => {
        const updatedUsers = [...users, newUser];
        onSaveUsers(updatedUsers);

        // Sync with masterData suppliers
        if (!masterData.suppliers.some(s => s.email === newUser.email)) {
            onUpdateMasterData({
                ...masterData,
                suppliers: [...masterData.suppliers, { name: newUser.displayName, email: newUser.email }]
            });
        }
        setIsAddVendorOpen(false);
    };

    const handleUpdateVendor = (updated: AppUser) => {
        const original = users.find(u => u.id === updated.id);
        const updatedUsers = users.map(u => u.id === updated.id ? updated : u);
        onSaveUsers(updatedUsers);

        if (original && updated.role === 'vendor') {
            onUpdateMasterData({
                ...masterData,
                suppliers: masterData.suppliers.map(s => 
                    s.email === original.email ? { name: updated.displayName, email: updated.email } : s
                )
            });
        }
        setEditingVendor(null);
    };

    const handleToggleSelect = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(paginatedVendors.map(v => v.id));
        } else {
            setSelectedIds([]);
        }
    };

    const initiateSingleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSingleDeleteId(id);
        setDeleteSource('single');
        setIsDeleteModalOpen(true);
    };

    const initiateBulkDelete = () => {
        setDeleteSource('bulk');
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        let idsToDelete: string[] = [];
        if (deleteSource === 'single' && singleDeleteId) {
            idsToDelete = [singleDeleteId];
        } else if (deleteSource === 'bulk') {
            idsToDelete = selectedIds;
        }

        if (idsToDelete.length === 0) return;

        const emailsToDelete = users
            .filter(u => idsToDelete.includes(u.id))
            .map(u => u.email);

        const updatedUsers = users.filter(u => !idsToDelete.includes(u.id));
        onSaveUsers(updatedUsers);

        // Update Master Data Suppliers
        onUpdateMasterData({
            ...masterData,
            suppliers: masterData.suppliers.filter(s => !emailsToDelete.includes(s.email))
        });

        setSelectedIds(prev => prev.filter(id => !idsToDelete.includes(id)));
        setIsDeleteModalOpen(false);
        setSingleDeleteId(null);
    };

    const infoPillStyle: React.CSSProperties = {
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
            {/* Header section with refined search and stats */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Button variant="secondary" onClick={onBack} style={{ padding: '8px' }}>
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Vendor Directory</h1>
                        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>Manage and browse registered maritime service providers</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Button 
                        onClick={() => setIsAddVendorOpen(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1e3a8a' }}
                    >
                        <UserPlus size={16} />
                        Add Vendor
                    </Button>
                    <Button variant="secondary" onClick={copyRegistrationLink} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #3b82f6', color: '#2563eb' }}>
                        {copySuccess ? <ListFilter size={16} /> : <Copy size={16} />}
                        {copySuccess ? "Copied!" : "Copy Reg. Link"}
                    </Button>
                    {selectedIds.length > 0 && (
                        <Button 
                            variant="danger" 
                            onClick={initiateBulkDelete}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Trash2 size={16} />
                            Delete ({selectedIds.length})
                        </Button>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: '10px', padding: '4px' }}>
                        <button 
                            onClick={() => setViewMode('grid')}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                padding: '6px 12px', 
                                borderRadius: '7px', 
                                border: 'none',
                                backgroundColor: viewMode === 'grid' ? '#fff' : 'transparent',
                                color: viewMode === 'grid' ? '#1e40af' : '#64748b',
                                cursor: 'pointer',
                                boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                padding: '6px 12px', 
                                borderRadius: '7px', 
                                border: 'none',
                                backgroundColor: viewMode === 'list' ? '#fff' : 'transparent',
                                color: viewMode === 'list' ? '#1e40af' : '#64748b',
                                cursor: 'pointer',
                                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            <List size={16} />
                        </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#eff6ff', color: '#1e40af', padding: '8px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: 600 }}>
                        <Users size={18} />
                        {vendors.length} Total Vendors
                    </div>
                </div>
            </div>

            {/* Enhanced search bar UI */}
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search by vendor name, category, country or username..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        style={{
                            width: '100%',
                            padding: '14px 14px 14px 48px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            fontSize: '15px',
                            backgroundColor: '#f8fafc',
                            outline: 'none',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>
            </div>

            {/* Conditionally render Grid or List View */}
            {viewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px', alignItems: 'stretch' }}>
                    {paginatedVendors.map(vendor => (
                        <div key={vendor.id} style={{ 
                            backgroundColor: '#fff', 
                            borderRadius: '20px', 
                            border: '1px solid #e2e8f0', 
                            padding: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            height: '100%',
                            position: 'relative',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}>
                            {/* Header Align Fix */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
                                    <div 
                                        onClick={(e) => handleToggleSelect(vendor.id, e)}
                                        style={{ cursor: 'pointer', color: selectedIds.includes(vendor.id) ? '#2563eb' : '#cbd5e1', paddingTop: '4px' }}
                                    >
                                        {selectedIds.includes(vendor.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {vendor.displayName}
                                            </h3>
                                            <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Vendor</span>
                                        </div>
                                        <div style={{ color: '#64748b', fontSize: '12px', fontStyle: 'italic' }}>@{vendor.username}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Button 
                                        variant="icon" 
                                        onClick={() => setEditingVendor(vendor)}
                                        style={{ backgroundColor: '#f8fafc', color: '#64748b', height: '32px', width: '32px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #e2e8f0' }}
                                    >
                                        <Edit size={16} />
                                    </Button>
                                    <Button 
                                        variant="icon" 
                                        onClick={(e) => initiateSingleDelete(vendor.id, e)}
                                        style={{ backgroundColor: '#fff1f2', color: '#e11d48', height: '32px', width: '32px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #fecdd3' }}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>

                            {/* Contact details stack */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#334155', fontSize: '13px' }}>
                                    <div style={{ backgroundColor: '#f1f5f9', padding: '6px', borderRadius: '8px', display: 'flex' }}><Mail size={14} color="#64748b" /></div>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vendor.email}</span>
                                </div>
                                {vendor.whatsappNumber && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#334155', fontSize: '13px' }}>
                                        <div style={{ backgroundColor: '#f0fdf4', padding: '6px', borderRadius: '8px', display: 'flex' }}><Phone size={14} color="#16a34a" /></div>
                                        <span>{vendor.whatsappNumber}</span>
                                    </div>
                                )}
                                {vendor.telegramUsername && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#334155', fontSize: '13px' }}>
                                        <div style={{ backgroundColor: '#eff6ff', padding: '6px', borderRadius: '8px', display: 'flex' }}><Send size={14} color="#2563eb" /></div>
                                        <span>@{vendor.telegramUsername.replace(/^@/, '')}</span>
                                    </div>
                                )}
                            </div>

                            {/* Operating Countries Box */}
                            {(vendor.countries && vendor.countries.length > 0) && (
                                <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '12px', marginBottom: '20px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MapPin size={10} /> Operating Countries
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '60px', overflowY: 'auto' }}>
                                        {vendor.countries.map(country => (
                                            <span key={country} style={{ fontSize: '11px', color: '#475569', backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '6px' }}>
                                                {country}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Categories Box */}
                            <div style={{ marginTop: 'auto' }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Building2 size={10} /> Specialist Areas
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {vendor.categories && vendor.categories.length > 0 ? (
                                        vendor.categories.map(cat => (
                                            <span key={cat} style={{ ...infoPillStyle, backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                                                {cat}
                                            </span>
                                        ))
                                    ) : (
                                        <span style={{ ...infoPillStyle, backgroundColor: '#f1f5f9', color: '#94a3b8' }}>General Supplier</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '16px 24px', width: '40px' }}>
                                    <input 
                                        type="checkbox" 
                                        onChange={handleSelectAll}
                                        checked={paginatedVendors.length > 0 && selectedIds.length === paginatedVendors.length}
                                    />
                                </th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Vendor Name</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Contact Info</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Operating Countries</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Specialist Areas</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedVendors.map(vendor => (
                                <tr key={vendor.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s', backgroundColor: selectedIds.includes(vendor.id) ? '#f8fafc' : 'transparent' }}>
                                    <td style={{ padding: '16px 24px' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.includes(vendor.id)}
                                            onChange={() => handleToggleSelect(vendor.id)}
                                        />
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{vendor.displayName}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>@{vendor.username}</div>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#334155' }}>
                                                <Mail size={12} color="#94a3b8" /> {vendor.email}
                                            </div>
                                            {vendor.whatsappNumber && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#334155' }}>
                                                    <Phone size={12} color="#94a3b8" /> {vendor.whatsappNumber}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {vendor.countries?.slice(0, 3).map(c => (
                                                <span key={c} style={{ fontSize: '11px', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>{c}</span>
                                            ))}
                                            {(vendor.countries?.length || 0) > 3 && (
                                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>+{(vendor.countries?.length || 0) - 3} more</span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {vendor.categories?.slice(0, 2).map(cat => (
                                                <span key={cat} style={{ fontSize: '11px', backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{cat}</span>
                                            ))}
                                            {(vendor.categories?.length || 0) > 2 && (
                                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>+{(vendor.categories?.length || 0) - 2} more</span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                            <Button 
                                                variant="icon" 
                                                onClick={() => setEditingVendor(vendor)}
                                                style={{ backgroundColor: '#f8fafc', color: '#64748b', height: '32px', width: '32px', padding: 0, display: 'inline-flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #e2e8f0' }}
                                            >
                                                <Edit size={16} />
                                            </Button>
                                            <Button 
                                                variant="icon" 
                                                onClick={(e) => initiateSingleDelete(vendor.id, e)}
                                                style={{ backgroundColor: '#fff1f2', color: '#e11d48', height: '32px', width: '32px', padding: 0, display: 'inline-flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #fecdd3' }}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Standardized Pagination UI */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '32px' }}>
                    <Button
                        variant="secondary"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        style={{ padding: '8px 12px' }}
                    >
                        <ChevronLeft size={16} />
                    </Button>
                    {[...Array(totalPages)].map((_, i) => (
                        <Button
                            key={i}
                            variant={currentPage === i + 1 ? 'primary' : 'secondary'}
                            onClick={() => setCurrentPage(i + 1)}
                            style={{ padding: '8px 14px', borderRadius: '8px' }}
                        >
                            {i + 1}
                        </Button>
                    ))}
                    <Button
                        variant="secondary"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        style={{ padding: '8px 12px' }}
                    >
                        <ChevronRight size={16} />
                    </Button>
                </div>
            )}

            {/* Modals for Edit and Add Vendor */}
            {editingVendor && (
                <VendorProfileModal
                    isOpen={!!editingVendor}
                    onClose={() => setEditingVendor(null)}
                    user={editingVendor}
                    onSave={handleUpdateVendor}
                    isAdminView={true}
                />
            )}

            <VendorProfileModal
                isOpen={isAddVendorOpen}
                onClose={() => setIsAddVendorOpen(false)}
                user={{}}
                isCreateMode={true}
                onSave={handleAddVendor}
                isAdminView={true}
            />

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSingleDeleteId(null);
                }}
                onConfirm={confirmDelete}
                title={deleteSource === 'bulk' ? "Confirm Bulk Deletion" : "Confirm Vendor Deletion"}
                confirmText="Delete"
                confirmVariant="danger"
            >
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <div style={{ backgroundColor: '#fff1f2', color: '#e11d48', width: '60px', height: '60px', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <Trash2 size={30} />
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                        {deleteSource === 'bulk' 
                            ? `Are you sure you want to delete ${selectedIds.length} vendors?` 
                            : "Are you sure you want to delete this vendor?"
                        }
                    </p>
                    <p style={{ color: '#64748b' }}>
                        This action cannot be undone. Any master data association will also be removed.
                    </p>
                </div>
            </Modal>
        </div>
    );
}
