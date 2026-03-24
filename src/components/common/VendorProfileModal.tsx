import React, { useState } from 'react';
import { AppUser } from '../../context/AuthContext';
import { Attachment } from '../../types';
import { Modal } from './Modal';
import { Button } from './Button';
import { Trash2, Upload } from 'lucide-react';

interface VendorProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: AppUser;
    onSave: (updatedUser: AppUser) => void;
    isAdminView?: boolean;
}

const CATEGORY_OPTIONS = ['Provisions', 'Spares', 'Stores', 'Underwater', 'Chemicals'];

// Simple stub for country list
const COUNTRY_OPTIONS = [
    'Singapore', 'United Arab Emirates', 'Netherlands', 'Mozambique', 'India', 'United Kingdom', 'United States'
];

export const VendorProfileModal = ({ isOpen, onClose, user, onSave, isAdminView }: VendorProfileModalProps) => {
    const [displayName, setDisplayName] = useState(user.displayName);
    const [email, setEmail] = useState(user.email);
    const [categories, setCategories] = useState<string[]>(user.categories || []);
    const [countries, setCountries] = useState<string[]>(user.countries || []);
    const [documents, setDocuments] = useState<Attachment[]>(user.documents || []);
    const [username, setUsername] = useState(user.username);
    const [password, setPassword] = useState(user.password);

    const toggleCategory = (cat: string) => {
        setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
    };

    const toggleCountry = (country: string) => {
        setCountries(prev => prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach((file) => {
            if (file.size > 2 * 1024 * 1024) {
                alert(`File ${file.name} is too large. Max size is 2MB.`);
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    const newAtt: Attachment = {
                        id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        fileName: file.name,
                        fileType: file.type,
                        base64Data: event.target.result as string
                    };
                    setDocuments(prev => [...prev, newAtt]);
                }
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const handleRemoveDoc = (id: string) => {
        setDocuments(prev => prev.filter(docs => docs.id !== id));
    };

    const handleSave = () => {
        onSave({
            ...user,
            displayName,
            email,
            username,
            password,
            categories,
            countries,
            documents
        });
        onClose();
    };

    const inputStyle: React.CSSProperties = {
        padding: '8px 10px',
        border: '1px solid #c7cfe4',
        borderRadius: '3px',
        fontSize: '13px',
        width: '100%',
        boxSizing: 'border-box',
        marginBottom: '16px'
    };

    const checkboxStyle: React.CSSProperties = {
        marginRight: '6px'
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={isAdminView ? "Edit Vendor Details" : "My Vendor Profile"}
            onConfirm={handleSave}
            confirmText="Save Details"
        >
            <div style={{ padding: '4px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e3a5f' }}>Company Name</label>
                <input 
                    style={inputStyle} 
                    value={displayName} 
                    onChange={e => setDisplayName(e.target.value)} 
                    placeholder="Company Name" 
                />

                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e3a5f' }}>Email Address</label>
                <input 
                    style={inputStyle} 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="Email" 
                />

                {isAdminView && (
                    <>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e3a5f' }}>Username</label>
                        <input 
                            style={inputStyle} 
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                            placeholder="Username" 
                        />

                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e3a5f' }}>Password (Reset)</label>
                        <input 
                            style={inputStyle} 
                            type="text"
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            placeholder="Set New Password" 
                        />
                    </>
                )}

                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e3a5f' }}>Categories</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                    {CATEGORY_OPTIONS.map(cat => (
                        <label key={cat} style={{ display: 'flex', alignItems: 'center', fontSize: '13px', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                style={checkboxStyle}
                                checked={categories.includes(cat)} 
                                onChange={() => toggleCategory(cat)} 
                            />
                            {cat}
                        </label>
                    ))}
                </div>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e3a5f' }}>Operating Countries</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px', maxHeight: '120px', overflowY: 'auto', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '4px' }}>
                    {COUNTRY_OPTIONS.map(country => (
                        <label key={country} style={{ display: 'flex', alignItems: 'center', fontSize: '13px', width: '45%', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                style={checkboxStyle}
                                checked={countries.includes(country)} 
                                onChange={() => toggleCountry(country)} 
                            />
                            {country}
                        </label>
                    ))}
                </div>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e3a5f' }}>Company Documents & Licenses</label>
                <div style={{ marginBottom: '16px' }}>
                    <input 
                        type="file" 
                        multiple 
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        id="vendor-doc-upload"
                    />
                    <Button variant="secondary" onClick={() => document.getElementById('vendor-doc-upload')?.click()}>
                        <Upload size={14} style={{ marginRight: '6px' }} />
                        Upload Document
                    </Button>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Accepted: PDF, Word, Images (Max 2MB each)</div>
                </div>

                {documents.length > 0 && (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        {documents.map((doc, i) => (
                            <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: i < documents.length - 1 ? '1px solid #e2e8f0' : 'none', backgroundColor: '#f8fafc' }}>
                                <span style={{ fontSize: '12px', color: '#1e293b', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {doc.fileName}
                                </span>
                                <Button variant="icon" onClick={() => handleRemoveDoc(doc.id)} style={{ color: '#dc2626' }}>
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};
