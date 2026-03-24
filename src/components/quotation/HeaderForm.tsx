import React from 'react';
import { Quotation, MasterData } from '../../types';
import { FormField, FormInput, FormSelect, FormTextarea, FormMultiSelect } from '../common/FormField';
import { StatusBadge } from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';

interface HeaderFormProps {
    data: Quotation;
    onChange: (field: keyof Quotation, value: any) => void;
    onAddNew?: (field: string) => void;
    disabled?: boolean;
    isAdmin?: boolean;
    isNew?: boolean;
    selectedSuppliers?: string[];
    onSuppliersChange?: (suppliers: string[]) => void;
    masterData: MasterData;
}

export const HeaderForm: React.FC<HeaderFormProps> = ({ 
    data, 
    onChange, 
    onAddNew, 
    disabled = false, 
    isAdmin = false,
    isNew = false,
    selectedSuppliers = [],
    onSuppliersChange,
    masterData
}) => {
    const { users } = useAuth();
    const isVendor = !isAdmin;
    
    // Filter supplierOptions based on selected categories
    const selectedCategories = data.categories || [];
    let filteredSuppliers = masterData.suppliers;
    
    if (selectedCategories.length > 0) {
        filteredSuppliers = masterData.suppliers.filter(supplier => {
            const user = users.find(u => u.email === supplier.email);
            if (!user || user.role !== 'vendor') return false; 
            const vendorCats = user.categories || [];
            return selectedCategories.some(c => vendorCats.includes(c));
        });
    }

    const supplierOptions = filteredSuppliers.map(s => s.name);
    const CATEGORY_OPTIONS = ['Provisions', 'Spares', 'Stores', 'Underwater', 'Chemicals'];

    return (
        <div className="quotation-header-grid">
            {/* Left Column */}
            <div style={{ minWidth: 0 }}>
                <FormField label="Operating Unit">
                    {disabled || isVendor ? <span className="p-2 block">{data.operatingUnit}</span> :
                        <FormSelect
                            value={data.operatingUnit}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                if (e.target.value === 'ADD_NEW') {
                                    onAddNew?.('operatingUnit');
                                } else {
                                    onChange('operatingUnit', e.target.value);
                                }
                            }}
                            options={[...masterData.operatingUnits, ...(isAdmin ? ['ADD_NEW'] : [])]}
                            optionLabels={{ 'ADD_NEW': '+ Add New Operating Unit...' }}
                            disabled={disabled}
                        />
                    }
                </FormField>

                <FormField label="Category">
                    {disabled || isVendor ? <span className="p-2 block">{(data.categories || []).join(', ') || '-'}</span> :
                        <FormMultiSelect
                            options={CATEGORY_OPTIONS}
                            selected={data.categories || []}
                            onChange={(selected) => onChange('categories', selected)}
                            disabled={disabled}
                        />
                    }
                </FormField>

                <FormField label="Supplier(s)">
                    {disabled || isVendor ? <span className="p-2 block">{data.supplier}</span> :
                        (isNew && isAdmin && onSuppliersChange) ? (
                            <FormMultiSelect
                                options={supplierOptions}
                                selected={selectedSuppliers}
                                onChange={onSuppliersChange}
                                onAddNew={() => onAddNew?.('supplier')}
                                disabled={disabled}
                            />
                        ) : (
                            <FormSelect
                                value={data.supplier}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                    if (e.target.value === 'ADD_NEW') {
                                        onAddNew?.('supplier');
                                    } else {
                                        const selectedSupplier = masterData.suppliers.find(s => s.name === e.target.value);
                                        onChange('supplier', e.target.value);
                                        if (selectedSupplier) {
                                            onChange('supplierEmail', selectedSupplier.email);
                                        }
                                    }
                                }}
                                options={[...supplierOptions, ...(isAdmin ? ['ADD_NEW'] : [])]}
                                optionLabels={{ 'ADD_NEW': '+ Add New Supplier...' }}
                                disabled={disabled}
                            />
                        )
                    }
                </FormField>

                {!isNew && (
                    <FormField label="Supplier Email">
                        {disabled || isVendor ? <span>{data.supplierEmail}</span> :
                            <FormInput
                                value={data.supplierEmail}
                                onChange={e => onChange('supplierEmail', e.target.value)}
                                disabled={disabled}
                            />
                        }
                    </FormField>
                )}

                <FormField label="Vessel">
                    {disabled || isVendor ? <span className="p-2 block">{data.vessel}</span> :
                        <FormSelect
                            value={data.vessel}
                            onChange={e => {
                                if (e.target.value === 'ADD_NEW') {
                                    onAddNew?.('vessel');
                                } else {
                                    onChange('vessel', e.target.value);
                                }
                            }}
                            options={[...masterData.vessels, ...(isAdmin ? ['ADD_NEW'] : [])]}
                            optionLabels={{ 'ADD_NEW': '+ Add New Vessel...' }}
                            disabled={disabled}
                        />
                    }
                </FormField>

                <FormField label="Port">
                    {disabled || isVendor ? <span className="p-2 block">{data.port}</span> :
                        <FormSelect
                            value={data.port}
                            onChange={e => {
                                if (e.target.value === 'ADD_NEW') {
                                    onAddNew?.('port');
                                } else {
                                    onChange('port', e.target.value);
                                }
                            }}
                            options={[...masterData.ports, ...(isAdmin ? ['ADD_NEW'] : [])]}
                            optionLabels={{ 'ADD_NEW': '+ Add New Port...' }}
                            disabled={disabled}
                        />
                    }
                </FormField>

                <FormField label="Status">
                    <StatusBadge status={data.status} role={isAdmin ? 'company' : 'vendor'} />
                </FormField>

                <FormField label="Buyer">
                    {disabled ? <span>{data.buyer}</span> :
                        <span>{data.buyer}</span>
                    }
                </FormField>

                <FormField label="RFQ Creation date">
                    {disabled ? <span>{data.rfqCreationDate}</span> :
                        <span>{data.rfqCreationDate}</span>
                    }
                </FormField>

                <FormField label="RFQ No.">
                    {disabled ? <span>{data.rfqNo}</span> :
                        <span>{data.rfqNo}</span>
                    }
                </FormField>

                <FormField label="Requisition No.">
                    {disabled ? <span>{data.requisitionNo}</span> :
                        <span>{data.requisitionNo}</span>
                    }
                </FormField>



                <FormField label="Comments">
                    {disabled ? <span>{data.comments}</span> :
                        <FormTextarea
                            value={data.comments}
                            onChange={e => onChange('comments', e.target.value)}
                            disabled={disabled}
                        />
                    }
                </FormField>


            </div>

            {/* Right Column */}
            <div style={{ minWidth: 0 }}>




                <FormField label="Need By Date">
                    {disabled || isVendor ? <span>{data.needByDate}</span> :
                        <FormInput
                            type="date"
                            value={data.needByDate}
                            onChange={e => onChange('needByDate', e.target.value)}
                            disabled={disabled}
                        />
                    }
                </FormField>

                <FormField label="Payment Terms">
                    {disabled ? <span>{data.paymentTerms}</span> :
                        <FormSelect
                            value={data.paymentTerms}
                            onChange={e => onChange('paymentTerms', e.target.value)}
                            options={masterData.paymentTerms}
                            disabled={disabled}
                        />
                    }
                </FormField>

                <FormField label="Currency" required>
                    {disabled ? <span>{data.currency}</span> :
                        <FormSelect
                            value={data.currency}
                            onChange={e => onChange('currency', e.target.value)}
                            options={masterData.currencies}
                            required
                            disabled={disabled}
                        />
                    }
                </FormField>

                <FormField label="Supplier Quotation No." required>
                    {disabled ? <span>{data.supplierQuotationNo}</span> :
                        <FormInput
                            value={data.supplierQuotationNo}
                            onChange={e => onChange('supplierQuotationNo', e.target.value)}
                            required
                            disabled={disabled}
                        />
                    }
                </FormField>

                <FormField label="Header Discount %">
                    {disabled ? <span>{data.headerDiscountPercentage} ({data.discountType})</span> :
                        <div className="flex gap-2">
                            <FormInput
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={data.headerDiscountPercentage}
                                onChange={e => onChange('headerDiscountPercentage', parseFloat(e.target.value) || 0)}
                                disabled={disabled}
                                style={{ width: '60%' }}
                            />
                            <FormSelect
                                value={data.discountType}
                                onChange={e => onChange('discountType', e.target.value)}
                                options={['Overall Discount', 'Line Item Discount']}
                                disabled={disabled}
                                style={{ width: '40%' }}
                            />
                        </div>
                    }
                </FormField>







                <FormField label="Delivery Time">
                    {disabled ? <span>{data.deliveryTimeDays} Day(s)</span> :
                        <div className="flex align-center gap-2">
                            <FormInput
                                type="number"
                                min="0"
                                value={data.deliveryTimeDays}
                                onChange={e => onChange('deliveryTimeDays', parseInt(e.target.value, 10) || 0)}
                                disabled={disabled}
                                style={{ width: '80px' }}
                            />
                            <span>Day</span>
                        </div>
                    }
                </FormField>

                <FormField label="Effective From">
                    {disabled ? <span>{data.effectiveFrom}</span> :
                        <FormInput
                            type="date"
                            value={data.effectiveFrom}
                            onChange={e => onChange('effectiveFrom', e.target.value)}
                            disabled={disabled}
                        />
                    }
                </FormField>

                <FormField label="Effective To">
                    {disabled ? <span>{data.effectiveTo}</span> :
                        <FormInput
                            type="date"
                            value={data.effectiveTo}
                            onChange={e => onChange('effectiveTo', e.target.value)}
                            disabled={disabled}
                        />
                    }
                </FormField>

                {data.poNo && (
                    <FormField label="PO No.">
                        <span className="font-bold" style={{ color: '#9d174d' }}>{data.poNo}</span>
                    </FormField>
                )}

                {data.poDate && (
                    <FormField label="PO Date">
                        <span className="font-semibold">{data.poDate}</span>
                    </FormField>
                )}
            </div>
        </div>
    );
};
