import { useState } from 'react';
import { useAuth, AppUser, UserRole, DEFAULT_USERS } from '../context/AuthContext';
import { VendorProfileModal } from '../components/common/VendorProfileModal';
import { Edit, Trash2, UserPlus, Settings, Package, Mail, Phone, Send, RotateCcw, ArrowLeft } from 'lucide-react';

import { Quotation, MasterData } from '../types';
import { createVendorWithUserManagementLogic } from '../utils/vendorUtils';
import { Button } from '../components/common/Button';

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
    const [newWhatsappNumber, setNewWhatsappNumber] = useState('');
    const [newTelegramUsername, setNewTelegramUsername] = useState('');
    const [newRole, setNewRole] = useState<UserRole>('vendor');
    const [newTelephoneNumber, setNewTelephoneNumber] = useState('');
    const [newMobileNumber, setNewMobileNumber] = useState('');
    const [newFullAddress, setNewFullAddress] = useState('');
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
                email: newEmail,
                whatsappNumber: newWhatsappNumber,
                telegramUsername: newTelegramUsername
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
                finalPassword = Math.random().toString(36).slice(-8);
            }

            const newUser: AppUser = {
                id: `u-${Date.now()}`,
                username: newUsername.trim(),
                password: finalPassword,
                role: newRole,
                displayName: newDisplayName.trim(),
                email: newEmail.trim(),
                whatsappNumber: newWhatsappNumber.trim() || undefined,
                telegramUsername: newTelegramUsername.trim() || undefined,
                telephoneNumber: newTelephoneNumber.trim() || undefined,
                mobileNumber: newMobileNumber.trim() || undefined,
                fullAddress: newFullAddress.trim() || undefined
            };
            saveUsers([...users, newUser]);
            setCreatedCredentials({ username: newUser.username, password: finalPassword });
        }
        setNewUsername('');
        setNewPassword('');
        setNewDisplayName('');
        setNewEmail('');
        setNewWhatsappNumber('');
        setNewTelegramUsername('');
        setNewTelephoneNumber('');
        setNewMobileNumber('');
        setNewFullAddress('');
        setNewRole('vendor');
        setAddError('');
    };

    const handleDelete = (id: string) => {
        if (!window.confirm('Are you sure you want to remove this user?')) return;
        const userToRemove = users.find(u => u.id === id);
        saveUsers(users.filter(u => u.id !== id));

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
        padding: '10px 12px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '13px',
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: '#fff',
        outline: 'none'
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
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Button variant="secondary" onClick={onBack} style={{ padding: '8px' }}>
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>User Management</h1>
                        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>Overview and settings for system users</p>
                    </div>
                </div>
                <Button variant="secondary" onClick={handleReset} style={{ color: '#64748b', border: '1px solid #e2e8f0' }}>
                    <RotateCcw size={16} style={{ marginRight: '8px' }} />
                    Reset Defaults
                </Button>
            </div>

            {/* Current Users Table Section */}
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden', marginBottom: '32px' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#1e3a8a', color: '#fff' }}>
                                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>User / Display Name</th>
                                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Credentials</th>
                                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email / Contact</th>
                                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Role</th>
                                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue (Approved)</th>
                                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, i) => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: i % 2 === 0 ? 'transparent' : '#f8fafc' }}>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{user.displayName}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>ID: {user.id}</div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', color: '#1e40af' }}>{user.username}</code>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '13px' }}>
                                            <Mail size={14} /> {user.email}
                                        </div>
                                        {(user.whatsappNumber || user.telegramUsername) && (
                                            <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                                                {user.whatsappNumber && <div style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a' }}><Phone size={12} /> {user.whatsappNumber}</div>}
                                                {user.telegramUsername && <div style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: '#0284c7' }}><Send size={12} /> @{user.telegramUsername.replace(/^@/, '')}</div>}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '999px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            backgroundColor: user.role === 'company' ? '#eff6ff' : '#ecfdf5',
                                            color: user.role === 'company' ? '#1e40af' : '#047857',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            {user.role === 'company' ? <Settings size={12} /> : <Package size={12} />}
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                                        {user.role === 'vendor' ? getRevenueString(user.email) : 'N/A'}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                            <button
                                                onClick={() => { setEditingUser(user); setIsEditModalOpen(true); }}
                                                style={{ backgroundColor: 'transparent', border: '1px solid #e2e8f0', color: '#2563eb', borderRadius: '8px', cursor: 'pointer', display: 'flex', padding: '6px' }}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                style={{ backgroundColor: 'transparent', border: '1px solid #fee2e2', color: '#dc2626', borderRadius: '8px', cursor: 'pointer', display: 'flex', padding: '6px' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add New User Redesigned Form */}
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '10px', borderRadius: '12px' }}>
                        <UserPlus size={20} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Register New User</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Full Name / Company Name</label>
                        <input style={inputStyle} value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} placeholder="e.g. John Doe / OceanWharf Ltd" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Username</label>
                        <input style={inputStyle} value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="e.g. user123" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Email Address</label>
                        <input style={inputStyle} value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="e.g. contact@example.com" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>WhatsApp (Optional)</label>
                        <input style={inputStyle} value={newWhatsappNumber} onChange={e => setNewWhatsappNumber(e.target.value)} placeholder="e.g. 919876543210" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Telegram Username (Optional)</label>
                        <input style={inputStyle} value={newTelegramUsername} onChange={e => setNewTelegramUsername(e.target.value)} placeholder="e.g. username" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Access Role</label>
                        <select style={inputStyle} value={newRole} onChange={e => setNewRole(e.target.value as UserRole)}>
                            <option value="vendor">📦 Vendor</option>
                            <option value="company">⚙ Admin / Company</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Telephone Number</label>
                        <input style={inputStyle} value={newTelephoneNumber} onChange={e => setNewTelephoneNumber(e.target.value)} placeholder="e.g. +91 22 12345678" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Mobile Number</label>
                        <input style={inputStyle} value={newMobileNumber} onChange={e => setNewMobileNumber(e.target.value)} placeholder="e.g. +91 98765 43210" />
                    </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Full Office Address</label>
                    <textarea 
                        style={{ ...inputStyle, minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }} 
                        value={newFullAddress} 
                        onChange={e => setNewFullAddress(e.target.value)} 
                        placeholder="Street, Building, City, ZIP, Country" 
                    />
                </div>

                <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Secure Password</label>
                    <input style={inputStyle} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Set manually or leave empty for auto-generation" />
                </div>

                {addError && (
                    <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1px solid #fee2e2' }}>
                        {addError}
                    </div>
                )}

                {createdCredentials && (
                    <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#ecfdf5', color: '#047857', borderRadius: '12px', border: '1px solid #d1fae5' }}>
                        <div style={{ fontWeight: 700, marginBottom: '8px' }}>User created successfully!</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                            Username: <strong>{createdCredentials.username}</strong><br />
                            Password: <strong>{createdCredentials.password}</strong>
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '32px' }}>
                    <Button onClick={handleAddUser} style={{ width: '100%', padding: '14px', fontSize: '15px' }}>
                        Create User Account
                    </Button>
                </div>
            </div>

            {editingUser && (
                <VendorProfileModal
                    isOpen={isEditModalOpen}
                    onClose={() => { setIsEditModalOpen(false); setEditingUser(null); }}
                    user={editingUser}
                    onSave={(updated) => {
                        saveUsers(users.map(u => u.id === updated.id ? updated : u));
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
