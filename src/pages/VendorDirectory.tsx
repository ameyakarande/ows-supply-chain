import React, { useMemo, useState } from 'react';
import { AppUser } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { ArrowLeft, Building2, FileText, Globe2, ListFilter, Mail } from 'lucide-react';

interface VendorDirectoryProps {
    users: AppUser[];
    onBack: () => void;
}

type AlphabeticalOrder = 'A-Z' | 'Z-A';

export default function VendorDirectory({ users, onBack }: VendorDirectoryProps) {
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [countryFilter, setCountryFilter] = useState('All');
    const [alphabeticalOrder, setAlphabeticalOrder] = useState<AlphabeticalOrder>('A-Z');

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
                <div style={{ ...infoPillStyle, backgroundColor: '#dcfce7', color: '#166534' }}>
                    {filteredVendors.length} Vendor{filteredVendors.length === 1 ? '' : 's'}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {filteredVendors.map(vendor => (
                        <div key={vendor.id} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                                <div>
                                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '16px' }}>{vendor.displayName}</h3>
                                    <div style={{ marginTop: '6px', fontSize: '12px', color: '#64748b' }}>{vendor.username}</div>
                                </div>
                                <span style={{ ...infoPillStyle, backgroundColor: '#eff6ff', color: '#1d4ed8' }}>Vendor</span>
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
            )}
        </div>
    );
}
