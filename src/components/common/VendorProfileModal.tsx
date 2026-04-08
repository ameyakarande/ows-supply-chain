import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppUser } from '../../context/AuthContext';
import { Attachment } from '../../types';
import { Modal } from './Modal';
import { Button } from './Button';
import { Trash2, Upload, Search, X, Check, ChevronDown, Globe2 } from 'lucide-react';
import { ALL_COUNTRIES } from '../../data/countries';

interface VendorProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: AppUser | Partial<AppUser>;
    onSave: (updatedUser: AppUser) => void;
    isAdminView?: boolean;
    isCreateMode?: boolean;
}

const CATEGORY_OPTIONS = ['Provisions', 'Spares', 'Stores', 'Underwater', 'Chemicals'];

export const VendorProfileModal = ({ isOpen, onClose, user, onSave, isAdminView, isCreateMode }: VendorProfileModalProps) => {
    const [displayName, setDisplayName] = useState(user.displayName || '');
    const [email, setEmail] = useState(user.email || '');
    const [username, setUsername] = useState(user.username || '');
    const [password, setPassword] = useState(user.password || '');
    const [whatsappNumber, setWhatsappNumber] = useState(user.whatsappNumber || '');
    const [telegramUsername, setTelegramUsername] = useState(user.telegramUsername || '');
    const [telephoneNumber, setTelephoneNumber] = useState(user.telephoneNumber || '');
    const [mobileNumber, setMobileNumber] = useState(user.mobileNumber || '');
    const [fullAddress, setFullAddress] = useState(user.fullAddress || '');
    const [categories, setCategories] = useState<string[]>(user.categories || []);
    const [countries, setCountries] = useState<string[]>(user.countries || []);
    const [documents, setDocuments] = useState<Attachment[]>(user.documents || []);
    
    // New state for searchable multiselect dropdown
    const [countrySearch, setCountrySearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sync state if user prop changes (important for modal reuse)
    useEffect(() => {
        setDisplayName(user.displayName || '');
        setEmail(user.email || '');
        setUsername(user.username || '');
        setPassword(user.password || '');
        setWhatsappNumber(user.whatsappNumber || '');
        setTelegramUsername(user.telegramUsername || '');
        setTelephoneNumber(user.telephoneNumber || '');
        setMobileNumber(user.mobileNumber || '');
        setFullAddress(user.fullAddress || '');
        setCategories(user.categories || []);
        setCountries(user.countries || []);
        setDocuments(user.documents || []);
    }, [user, isOpen]);

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredCountries = useMemo(() => {
        const query = countrySearch.toLowerCase().trim();
        if (!query) return ALL_COUNTRIES;
        return ALL_COUNTRIES.filter(c => c.toLowerCase().includes(query));
    }, [countrySearch]);

    const toggleCategory = (cat: string) => {
        setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
    };

    const toggleCountry = (country: string) => {
        setCountries(prev => prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]);
    };

    const removeCountry = (e: React.MouseEvent, country: string) => {
        e.stopPropagation();
        toggleCountry(country);
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
        if (isCreateMode && (!username || !email || !displayName)) {
            alert('Username, Email, and Company Name are required.');
            return;
        }

        onSave({
            ...(user as AppUser),
            id: user.id || `u-${Date.now()}`,
            displayName: displayName.trim(),
            email: email.trim(),
            whatsappNumber: whatsappNumber.trim() || undefined,
            telegramUsername: telegramUsername.trim() || undefined,
            telephoneNumber: telephoneNumber.trim() || undefined,
            mobileNumber: mobileNumber.trim() || undefined,
            fullAddress: fullAddress.trim() || undefined,
            username: username.trim(),
            password: password.trim() || Math.random().toString(36).slice(-8),
            role: user.role || 'vendor',
            categories: user.role === 'company' ? undefined : categories,
            countries: user.role === 'company' ? undefined : countries,
            documents: user.role === 'company' ? undefined : documents
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
            title={isCreateMode ? "Add New Vendor" : (isAdminView ? "Edit Details" : `My ${user.role === 'company' ? 'Admin' : 'Vendor'} Profile`)}
            onConfirm={handleSave}
            confirmText={isCreateMode ? "Create" : "Save Details"}
        >
            <div style={{ padding: '4px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e3a5f' }}>Company Name</label>
                        <input 
                            style={inputStyle} 
                            value={displayName} 
                            onChange={e => setDisplayName(e.target.value)} 
                            placeholder="e.g. Aqua Provisions Inc." 
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e3a5f' }}>Contact Email</label>
                        <input 
                            style={inputStyle} 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            placeholder="e.g. sales@company.com" 
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e3a5f' }}>System Username</label>
                        <input 
                            style={inputStyle} 
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                            placeholder="e.g. aquapro" 
                            disabled={!isCreateMode && !isAdminView}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e3a5f' }}>
                            {isCreateMode ? "Initial Password" : "Password (Reset)"}
                        </label>
                        <input 
                            style={inputStyle} 
                            type="text"
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            placeholder={isCreateMode ? "Leave empty for auto-gen" : "Set New Password"} 
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e3a5f' }}>WhatsApp Number</label>
                        <input
                            style={inputStyle}
                            value={whatsappNumber}
                            onChange={e => setWhatsappNumber(e.target.value)}
                            placeholder="e.g. 919876543210"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e3a5f' }}>Telegram Username</label>
                        <input
                            style={inputStyle}
                            value={telegramUsername}
                            onChange={e => setTelegramUsername(e.target.value)}
                            placeholder="e.g. vendor_updates"
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e3a5f' }}>Telephone Number</label>
                        <input
                            style={inputStyle}
                            value={telephoneNumber}
                            onChange={e => setTelephoneNumber(e.target.value)}
                            placeholder="e.g. +91 22 12345678"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e3a5f' }}>Mobile Number</label>
                        <input
                            style={inputStyle}
                            value={mobileNumber}
                            onChange={e => setMobileNumber(e.target.value)}
                            placeholder="e.g. +91 98765 43210"
                        />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e3a5f' }}>Full Office Address</label>
                    <textarea
                        style={{ ...inputStyle, minHeight: '60px', fontFamily: 'inherit', resize: 'vertical' }}
                        value={fullAddress}
                        onChange={e => setFullAddress(e.target.value)}
                        placeholder="Street, Building, City, ZIP, Country"
                    />
                </div>

                {user.role !== 'company' && (
                    <>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e3a5f' }}>Categories</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                            {CATEGORY_OPTIONS.map(cat => (
                                <label key={cat} style={{ display: 'flex', alignItems: 'center', fontSize: '12px', cursor: 'pointer', fontWeight: categories.includes(cat) ? 600 : 400, color: categories.includes(cat) ? '#2563eb' : '#475569' }}>
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

                        <div style={{ marginBottom: '16px', position: 'relative' }} ref={dropdownRef}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1e3a5f' }}>
                                <Globe2 size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                Operating Countries
                            </label>
                            
                            {/* Multiselect Dropdown Trigger */}
                            <div 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                style={{
                                    minHeight: '38px',
                                    padding: '4px 8px',
                                    paddingRight: '32px',
                                    borderRadius: '3px',
                                    border: '1px solid #c7cfe4',
                                    backgroundColor: '#fff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '4px',
                                    alignItems: 'center',
                                    position: 'relative',
                                    boxShadow: isDropdownOpen ? '0 0 0 1px #2563eb' : 'none'
                                }}
                            >
                                {countries.length === 0 ? (
                                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>Select operating countries...</span>
                                ) : (
                                    countries.map(c => (
                                        <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '1px 6px', borderRadius: '3px', backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: 600, border: '1px solid #dbeafe' }}>
                                            {c}
                                            <X size={12} style={{ cursor: 'pointer', color: '#3b82f6' }} onClick={(e) => removeCountry(e, c)} />
                                        </span>
                                    ))
                                )}
                                <ChevronDown size={16} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', transition: 'transform 0.2s', rotate: isDropdownOpen ? '180deg' : '0deg' }} />
                            </div>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 2px)',
                                    left: 0,
                                    right: 0,
                                    backgroundColor: '#fff',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                    zIndex: 1000,
                                    padding: '8px',
                                    animation: 'fadeIn 0.1s ease-out'
                                }}>
                                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                                        <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={countrySearch}
                                            onChange={e => setCountrySearch(e.target.value)}
                                            onClick={e => e.stopPropagation()}
                                            autoFocus
                                            style={{ width: '100%', padding: '6px 6px 6px 28px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px', outline: 'none' }}
                                        />
                                    </div>

                                    <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                        {filteredCountries.length > 0 ? (
                                            filteredCountries.map(country => {
                                                const isSelected = countries.includes(country);
                                                return (
                                                    <div
                                                        key={country}
                                                        onClick={(e) => { e.stopPropagation(); toggleCountry(country); }}
                                                        style={{
                                                            padding: '6px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            backgroundColor: isSelected ? '#f0f9ff' : 'transparent',
                                                            color: isSelected ? '#1d4ed8' : '#334155',
                                                            fontWeight: isSelected ? 600 : 400
                                                        }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isSelected ? '#e0f2fe' : '#f8fafc'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isSelected ? '#f0f9ff' : 'transparent'; }}
                                                    >
                                                        <span>{country}</span>
                                                        {isSelected && <Check size={12} color="#2563eb" />}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '10px', color: '#64748b', fontSize: '12px' }}>
                                                No results
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
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
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
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
                    </>
                )}
            </div>
            
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </Modal>
    );
};
