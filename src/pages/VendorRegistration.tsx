import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { Building2, Globe2, Mail, Lock, Phone, User, Check, AlertCircle, Search, X, ChevronDown, MapPin } from 'lucide-react';
import { MasterData } from '../types';
import { AppUser } from '../context/AuthContext';
import { ALL_COUNTRIES } from '../data/countries';

interface VendorRegistrationProps {
    masterData: MasterData;
    onRegister: (vendorData: Partial<AppUser>) => Promise<boolean>;
    onBackToLogin: () => void;
}

export default function VendorRegistration({ masterData, onRegister, onBackToLogin }: VendorRegistrationProps) {
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
        whatsappNumber: '',
        telegramUsername: '',
        telephoneNumber: '',
        mobileNumber: '',
        fullAddress: '',
        countries: [] as string[],
        categories: [] as string[]
    });
    const [countrySearch, setCountrySearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.countries.length === 0) {
            setError('Please select at least one operating country');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await onRegister({
                displayName: formData.displayName,
                email: formData.email,
                username: formData.email,
                password: formData.password,
                whatsappNumber: formData.whatsappNumber,
                telegramUsername: formData.telegramUsername,
                telephoneNumber: formData.telephoneNumber,
                mobileNumber: formData.mobileNumber,
                fullAddress: formData.fullAddress,
                countries: formData.countries,
                categories: formData.categories,
                role: 'vendor'
            });

            if (result) {
                setSuccess(true);
            } else {
                setError('Registration failed. Email might already be in use.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleCountry = (country: string) => {
        setFormData(prev => ({
            ...prev,
            countries: prev.countries.includes(country)
                ? prev.countries.filter(c => c !== country)
                : [...prev.countries, country]
        }));
    };

    const removeCountry = (e: React.MouseEvent, country: string) => {
        e.stopPropagation();
        toggleCountry(country);
    };

    const toggleCategory = (category: string) => {
        setFormData(prev => ({
            ...prev,
            categories: prev.categories.includes(category)
                ? prev.categories.filter(c => c !== category)
                : [...prev.categories, category]
        }));
    };

    if (success) {
        return (
            <div style={{ maxWidth: '500px', margin: '60px auto', padding: '40px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#166534', marginBottom: '24px' }}>
                    <Check size={40} />
                </div>
                <h2 style={{ fontSize: '24px', color: '#0f172a', marginBottom: '12px' }}>Registration Successful!</h2>
                <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '32px' }}>
                    Your vendor account has been created. You can now log in using your email and password to start receiving RFQs.
                </p>
                <Button variant="primary" onClick={onBackToLogin} style={{ width: '100%', padding: '12px' }}>
                    Go to Login
                </Button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', color: '#fff', marginBottom: '16px' }}>
                    <Building2 size={32} />
                </div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>Join OceanWharf Network</h1>
                <p style={{ color: '#64748b', fontSize: '16px' }}>Register your company to receive procurement requests</p>
            </div>

            <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
                {error && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px', marginBottom: '24px' }}>
                    <div className="field-group">
                        <label style={{ fontWeight: 700, fontSize: '13px', color: '#334155' }}>Company Name</label>
                        <div style={{ position: 'relative' }}>
                            <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                className="form-input"
                                style={{ paddingLeft: '38px', width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                required
                                value={formData.displayName}
                                onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                placeholder="Legal Company Name"
                            />
                        </div>
                    </div>
                    <div className="field-group">
                        <label style={{ fontWeight: 700, fontSize: '13px', color: '#334155' }}>Contact Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                className="form-input"
                                style={{ paddingLeft: '38px', width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                type="email"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="vendor@company.com"
                            />
                        </div>
                    </div>
                    <div className="field-group">
                        <label style={{ fontWeight: 700, fontSize: '13px', color: '#334155' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                className="form-input"
                                style={{ paddingLeft: '38px', width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                type="password"
                                required
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <div className="field-group">
                        <label style={{ fontWeight: 700, fontSize: '13px', color: '#334155' }}>Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                className="form-input"
                                style={{ paddingLeft: '38px', width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                type="password"
                                required
                                value={formData.confirmPassword}
                                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <div className="field-group">
                        <label style={{ fontWeight: 700, fontSize: '13px', color: '#334155' }}>WhatsApp (Optional)</label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                className="form-input"
                                style={{ paddingLeft: '38px', width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                value={formData.whatsappNumber}
                                onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                                placeholder="+1..."
                            />
                        </div>
                    </div>
                    <div className="field-group">
                        <label style={{ fontWeight: 700, fontSize: '13px', color: '#334155' }}>Telegram (Optional)</label>
                        <div style={{ position: 'relative' }}>
                            <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                className="form-input"
                                style={{ paddingLeft: '38px', width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                value={formData.telegramUsername}
                                onChange={e => setFormData({ ...formData, telegramUsername: e.target.value })}
                                placeholder="@username"
                            />
                        </div>
                    </div>
                    <div className="field-group">
                        <label style={{ fontWeight: 700, fontSize: '13px', color: '#334155' }}>Telephone Number</label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                className="form-input"
                                style={{ paddingLeft: '38px', width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                value={formData.telephoneNumber}
                                onChange={e => setFormData({ ...formData, telephoneNumber: e.target.value })}
                                placeholder="Fixed line number"
                            />
                        </div>
                    </div>
                    <div className="field-group">
                        <label style={{ fontWeight: 700, fontSize: '13px', color: '#334155' }}>Mobile Number</label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                className="form-input"
                                style={{ paddingLeft: '38px', width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                value={formData.mobileNumber}
                                onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })}
                                placeholder="Contact mobile"
                            />
                        </div>
                    </div>
                </div>

                <div className="field-group" style={{ marginBottom: '24px' }}>
                    <label style={{ fontWeight: 700, fontSize: '13px', color: '#334155' }}>Full Office Address</label>
                    <div style={{ position: 'relative' }}>
                        <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#94a3b8' }} />
                        <textarea
                            className="form-input"
                            style={{ paddingLeft: '38px', width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '80px', fontFamily: 'inherit' }}
                            value={formData.fullAddress}
                            onChange={e => setFormData({ ...formData, fullAddress: e.target.value })}
                            placeholder="Street, Building, City, ZIP, Country"
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '24px', position: 'relative' }} ref={dropdownRef}>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#334155', marginBottom: '8px' }}>
                        <Globe2 size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                        Operating Countries
                    </label>
                    
                    {/* Multiselect Dropdown Trigger */}
                    <div 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        style={{
                            minHeight: '42px',
                            padding: '6px 12px',
                            paddingRight: '36px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '6px',
                            alignItems: 'center',
                            position: 'relative',
                            boxShadow: isDropdownOpen ? '0 0 0 2px rgba(37, 99, 235, 0.1)' : 'none',
                            borderColor: isDropdownOpen ? '#2563eb' : '#e2e8f0'
                        }}
                    >
                        {formData.countries.length === 0 ? (
                            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Select operating countries...</span>
                        ) : (
                            formData.countries.map(c => (
                                <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '12px', fontWeight: 600, border: '1px solid #dbeafe' }}>
                                    {c}
                                    <X size={14} style={{ cursor: 'pointer', color: '#3b82f6' }} onClick={(e) => removeCountry(e, c)} />
                                </span>
                            ))
                        )}
                        <ChevronDown size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', transition: 'transform 0.2s', transformOrigin: 'center', rotate: isDropdownOpen ? '180deg' : '0deg' }} />
                    </div>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            right: 0,
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                            zIndex: 1000,
                            padding: '12px',
                            animation: 'fadeIn 0.15s ease-out'
                        }}>
                            {/* Search Input inside Dropdown */}
                            <div style={{ position: 'relative', marginBottom: '10px' }}>
                                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="text"
                                    placeholder="Search countries..."
                                    value={countrySearch}
                                    onChange={e => setCountrySearch(e.target.value)}
                                    onClick={e => e.stopPropagation()}
                                    autoFocus
                                    style={{ width: '100%', padding: '8px 8px 8px 32px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                                />
                            </div>

                            <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {filteredCountries.length > 0 ? (
                                    filteredCountries.map(country => {
                                        const isSelected = formData.countries.includes(country);
                                        return (
                                            <div
                                                key={country}
                                                onClick={(e) => { e.stopPropagation(); toggleCountry(country); }}
                                                style={{
                                                    padding: '8px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '13px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    backgroundColor: isSelected ? '#f0f9ff' : 'transparent',
                                                    color: isSelected ? '#1d4ed8' : '#334155',
                                                    fontWeight: isSelected ? 600 : 400,
                                                    transition: 'all 0.1s'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isSelected ? '#e0f2fe' : '#f8fafc'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isSelected ? '#f0f9ff' : 'transparent'; }}
                                            >
                                                <span>{country}</span>
                                                {isSelected && <Check size={14} color="#2563eb" />}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '12px', color: '#64748b', fontSize: '13px' }}>
                                        No results found
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#334155', marginBottom: '12px' }}>
                        Product/Service Categories
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '150px', overflowY: 'auto', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        {masterData.categories.map(category => (
                            <button
                                key={category}
                                type="button"
                                onClick={() => toggleCategory(category)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '999px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    border: '1px solid',
                                    borderColor: formData.categories.includes(category) ? '#10b981' : '#cbd5e1',
                                    backgroundColor: formData.categories.includes(category) ? '#ecfdf5' : '#fff',
                                    color: formData.categories.includes(category) ? '#047857' : '#475569'
                                }}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button
                        type="submit"
                        variant="primary"
                        style={{ flex: 1, padding: '14px' }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Processing...' : 'Register Company'}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onBackToLogin}
                        style={{ flex: 1, padding: '14px' }}
                    >
                        Cancel
                    </Button>
                </div>
            </form>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .form-input:focus {
                    border-color: #2563eb !important;
                    outline: none;
                    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
                }
            `}</style>
        </div>
    );
}
