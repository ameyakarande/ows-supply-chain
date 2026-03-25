import { useState } from 'react';
import { useAuth, AppUser, UserRole, DEFAULT_USERS } from '../context/AuthContext';
import { VendorProfileModal } from '../components/common/VendorProfileModal';
import { Edit, Trash2 } from 'lucide-react';

import { Quotation, MasterData } from '../types';
import { createVendorWithUserManagementLogic } from '../utils/vendorUtils';

interface AdminPageProps {
    onBack: () => void;
    quotations: Quotation[];
    masterData: MasterData;
    onUpdateMasterData: (data: MasterData) => void;
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

export default function AdminPage({ onBack, quotations, masterData, onUpdateMasterData }: AdminPageProps) {
    const { users, saveUsers } = useAuth();
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newDisplayName, setNewDisplayName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState<UserRole>('vendor');
    const [addError, setAddError] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AppUser | null>(null);
    const [createdCredentials, setCreatedCredentials] = useState<{username: string, password: string} | null>(null);

    const handleAddUser = () => {
        if (newRole === 'vendor') {
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

            saveUsers([...users, result.user]);
            onUpdateMasterData(result.masterData);
            setCreatedCredentials(result.credentials);
        } else {
            if (!newUsername.trim() || !newDisplayName.trim() || !newEmail.trim()) {
                setAddError('All fields are required except password.');
                return;
            }
            if (users.find(u => u.username === newUsername.trim())) {
                setAddError('Username already exists.');
                return;
            }

            let finalPassword = newPassword.trim();
            if (!finalPassword) {
                finalPassword = Math.random().toString(36).slice(-8); // Auto-generate securely enough
            }

            const newUser: AppUser = {
                id: `u-${Date.now()}`,
                username: newUsername.trim(),
                password: finalPassword,
                role: newRole,
                displayName: newDisplayName.trim(),
                email: newEmail.trim()
            };
        saveUsers([...users, newUser]);
            setCreatedCredentials({ username: newUser.username, password: finalPassword });
        }
        setNewUsername('');
        setNewPassword('');
        setNewDisplayName('');
        setNewEmail('');
        setNewRole('vendor');
        setAddError('');
    };

    const handleDelete = (id: string) => {
        if (!window.confirm('Are you sure you want to remove this user?')) return;
        const userToRemove = users.find(u => u.id === id);
        saveUsers(users.filter(u => u.id !== id));

        // Sync with masterData if it's a vendor
        if (userToRemove?.role === 'vendor') {
            onUpdateMasterData({
                ...masterData,
                suppliers: masterData.suppliers.filter(s => s.email !== userToRemove.email)
            });
        }
    };

    const handleReset = () => {
        if (!window.confirm('Reset all users to defaults?')) return;
        saveUsers(DEFAULT_USERS);
    };

    const inputStyle: React.CSSProperties = {
        padding: '6px 8px',
        border: '1px solid #c7cfe4',
        borderRadius: '3px',
        fontSize: '12px',
        width: '100%',
        boxSizing: 'border-box'
    };

    const getRevenueString = (userEmail: string) => {
        const approved = quotations.filter(q => q.supplierEmail === userEmail && REVENUE_STATUSES.includes(q.status));
        const byCurrency = approved.reduce((acc, q) => {
            acc[q.currency] = (acc[q.currency] || 0) + (q.adminOverallTotal ?? q.overallTotal);
            return acc;
        }, {} as Record<string, number>);
        const parts = Object.entries(byCurrency).map(([curr, amt]) => `${CURRENCY_SYMBOLS[curr] || curr} ${amt.toFixed(2)}`);
        return parts.length > 0 ? parts.join(' | ') : '-';
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid #1e3a5f', paddingBottom: '12px' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#1e3a5f', fontSize: '18px' }}>User Management</h2>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Manage system users and their access roles</div>
                </div>
                <button
                    onClick={onBack}
                    style={{ padding: '6px 14px', border: '1px solid #c7cfe4', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                >
                    ← Back
                </button>
            </div>

            {/* Current Users Table */}
            <div style={{ border: '1px solid #c7cfe4', borderRadius: '4px', marginBottom: '28px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#1e3a5f', color: '#fff' }}>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Display Name</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Username</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Email Address</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Role</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Total Revenue</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, i) => (
                            <tr key={user.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '9px 12px' }}>{user.displayName}</td>
                                <td style={{ padding: '9px 12px', fontFamily: 'monospace' }}>{user.username}</td>
                                <td style={{ padding: '9px 12px' }}>{user.email}</td>
                                <td style={{ padding: '9px 12px' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        backgroundColor: user.role === 'company' ? '#dbeafe' : '#dcfce7',
                                        color: user.role === 'company' ? '#1e40af' : '#166534'
                                    }}>
                                        {user.role === 'company' ? '⚙ Company' : '📦 Vendor'}
                                    </span>
                                </td>
                                <td style={{ padding: '9px 12px', fontWeight: 600, color: '#0f172a' }}>
                                    {user.role === 'vendor' ? getRevenueString(user.email) : '-'}
                                </td>
                                <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                        {user.role === 'vendor' && (
                                            <button
                                                onClick={() => { setEditingUser(user); setIsEditModalOpen(true); }}
                                                title="Edit"
                                                style={{ background: 'none', border: '1px solid #3b82f6', color: '#2563eb', padding: '4px', borderRadius: '3px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                            >
                                                <Edit size={14} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            title="Remove"
                                            style={{ background: 'none', border: '1px solid #fca5a5', color: '#dc2626', padding: '4px', borderRadius: '3px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add New User Form */}
            <div style={{ border: '1px solid #c7cfe4', borderRadius: '4px', padding: '20px', backgroundColor: '#f8fafc' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#1e3a5f' }}>Add New User</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 130px', gap: '12px', marginBottom: '12px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: '#374151' }}>Display Name</label>
                        <input style={inputStyle} value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} placeholder="e.g. Aqua Provisions" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: '#374151' }}>Username</label>
                        <input style={inputStyle} value={newUsername} onChange={e => { setNewUsername(e.target.value); setAddError(''); }} placeholder="e.g. vendor2" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: '#374151' }}>Email Address</label>
                        <input style={inputStyle} value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="e.g. vendor@example.com" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: '#374151' }}>Password (auto-generated if empty)</label>
                        <input style={inputStyle} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Set or leave empty" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: '#374151' }}>Role</label>
                        <select style={{ ...inputStyle }} value={newRole} onChange={e => setNewRole(e.target.value as UserRole)}>
                            <option value="vendor">Vendor</option>
                            <option value="company">Company</option>
                        </select>
                    </div>
                </div>
                {addError && <div style={{ color: '#dc2626', fontSize: '12px', marginBottom: '10px' }}>{addError}</div>}
                
                {createdCredentials && (
                    <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '10px', borderRadius: '4px', fontSize: '13px', marginBottom: '12px', border: '1px solid #bbf7d0' }}>
                        <strong>User created successfully!</strong><br />
                        Username: {createdCredentials.username}<br />
                        Password: {createdCredentials.password}<br />
                    </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={handleAddUser}
                        style={{ padding: '7px 18px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                    >
                        Add User
                    </button>
                    <button
                        onClick={handleReset}
                        style={{ padding: '7px 14px', background: '#fff', border: '1px solid #c7cfe4', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}
                    >
                        Reset to Defaults
                    </button>
                </div>
            </div>

            {editingUser && (
                <VendorProfileModal
                    isOpen={isEditModalOpen}
                    onClose={() => { setIsEditModalOpen(false); setEditingUser(null); }}
                    user={editingUser}
                    onSave={(updated) => {
                        saveUsers(users.map(u => u.id === updated.id ? updated : u));
                        
                        // Sync with masterData if it's a vendor
                        if (updated.role === 'vendor') {
                            const original = users.find(u => u.id === updated.id);
                            if (original) {
                                onUpdateMasterData({
                                    ...masterData,
                                    suppliers: masterData.suppliers.map(s => 
                                        s.email === original.email ? { name: updated.displayName, email: updated.email } : s
                                    )
                                });
                            }
                        }
                    }}
                    isAdminView={true}
                />
            )}
        </div>
    );
}
