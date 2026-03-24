import React from 'react';
import { QuotationLineItem } from '../../types';
import { FormInput, FormTextarea } from '../common/FormField';
import { Trash2 } from 'lucide-react';

interface LineItemsTableProps {
    items: QuotationLineItem[];
    onChange: (index: number, field: keyof QuotationLineItem, value: any) => void;
    disabled?: boolean;
    discountType?: string;
    isVendor?: boolean;
    onRemove?: (index: number) => void;
}

export const LineItemsTable: React.FC<LineItemsTableProps> = ({ items, onChange, onRemove, disabled, discountType, isVendor }) => {
    return (
        <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
            <table className="data-table">
                <thead>
                    <tr>
                        <th style={{ width: '40px' }}>Line No.</th>
                        <th style={{ width: '120px' }}>Item Code</th>
                        <th style={{ width: '250px' }}>Item Description</th>
                        <th style={{ width: '300px' }}>Specification</th>
                        <th style={{ width: '80px' }}>Primary Unit</th>
                        <th style={{ width: '80px', textAlign: 'right' }}>Quantity</th>
                        <th style={{ width: '100px', textAlign: 'right' }}>Unit Price</th>
                        <th style={{ width: '80px', textAlign: 'right' }}>Discount %</th>
                        <th style={{ width: '100px', textAlign: 'right' }}>Net Unit Price</th>
                        <th style={{ width: '100px', textAlign: 'right' }}>Net Total</th>
                        {!disabled && !isVendor && <th style={{ width: '40px' }}></th>}
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <React.Fragment key={item.id}>
                            <tr>
                                <td style={{ textAlign: 'center' }}>{item.lineNo}</td>
                                <td>
                                    {disabled || isVendor ? (
                                        <span>{item.itemCode}</span>
                                    ) : (
                                        <div className="table-input-container">
                                            <FormInput
                                                type="text"
                                                value={item.itemCode}
                                                onChange={(e) => onChange(index, 'itemCode', e.target.value)}
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                    )}
                                </td>
                                <td>
                                    {disabled || isVendor ? (
                                        <span>{item.itemDescription}</span>
                                    ) : (
                                        <div className="table-input-container">
                                            <FormInput
                                                type="text"
                                                value={item.itemDescription}
                                                onChange={(e) => onChange(index, 'itemDescription', e.target.value)}
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                    )}
                                </td>
                                <td>
                                    {disabled || isVendor ? (
                                        <div style={{ whiteSpace: 'pre-wrap', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                            {item.specification}
                                        </div>
                                    ) : (
                                        <FormTextarea
                                            value={item.specification}
                                            onChange={(e) => onChange(index, 'specification', e.target.value)}
                                            style={{ width: '100%', fontSize: '11px', minHeight: '36px', padding: '2px 4px' }}
                                        />
                                    )}
                                </td>
                                <td>
                                    {disabled || isVendor ? (
                                        <span>{item.primaryUnit}</span>
                                    ) : (
                                        <div className="table-input-container">
                                            <FormInput
                                                type="text"
                                                value={item.primaryUnit}
                                                onChange={(e) => onChange(index, 'primaryUnit', e.target.value)}
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                    )}
                                </td>
                                <td>
                                    {disabled || isVendor ? (
                                        <div className="text-right">{item.quantity.toFixed(2)}</div>
                                    ) : (
                                        <div className="table-input-container">
                                            <FormInput
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.quantity}
                                                onChange={(e) => onChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                style={{ textAlign: 'right', width: '100%' }}
                                            />
                                        </div>
                                    )}
                                </td>
                                <td>
                                    {disabled ? (
                                        <div className="text-right">
                                            {!isVendor && item.adminUnitPrice !== undefined ? (
                                                <>
                                                    <div style={{ fontWeight: 600 }}>{item.adminUnitPrice.toFixed(2)}</div>
                                                    <div style={{ fontSize: '10px', color: '#64748b', textDecoration: 'line-through' }}>
                                                        {item.unitPrice.toFixed(2)}
                                                    </div>
                                                </>
                                            ) : (
                                                item.unitPrice.toFixed(2)
                                            )}
                                        </div>
                                    ) : (
                                        <div className="table-input-container">
                                            <FormInput
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.unitPrice}
                                                onChange={(e) => onChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                style={{ textAlign: 'right', width: '100%' }}
                                                disabled={disabled}
                                            />
                                        </div>
                                    )}
                                </td>
                                <td>
                                    {disabled ? (
                                        <div className="text-right">{item.discountPercentage.toFixed(2)}</div>
                                    ) : (
                                        <div className="table-input-container">
                                            <FormInput
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={item.discountPercentage}
                                                onChange={(e) => onChange(index, 'discountPercentage', parseFloat(e.target.value) || 0)}
                                                style={{ textAlign: 'right', width: '100%' }}
                                                disabled={disabled || discountType === 'Overall Discount'}
                                            />
                                        </div>
                                    )}
                                </td>
                                 <td style={{ textAlign: 'right', backgroundColor: '#f9fafb' }}>
                                    {(() => {
                                        const effectiveUnit = (isVendor || item.adminUnitPrice === undefined) ? item.unitPrice : item.adminUnitPrice;
                                        // Note: item.netUnitPrice coming from props is role-dependent based on who last calculated it.
                                        // We recalculate here to be safe.
                                        const netUnit = item.discountPercentage > 0 ? effectiveUnit * (1 - (item.discountPercentage / 100)) : effectiveUnit;
                                        return netUnit.toFixed(2);
                                    })()}
                                </td>
                                <td style={{ textAlign: 'right', backgroundColor: '#f9fafb', fontWeight: 600 }}>
                                    {(() => {
                                        const effectiveUnit = (isVendor || item.adminUnitPrice === undefined) ? item.unitPrice : item.adminUnitPrice;
                                        const netUnit = item.discountPercentage > 0 ? effectiveUnit * (1 - (item.discountPercentage / 100)) : effectiveUnit;
                                        return (netUnit * item.quantity).toFixed(2);
                                    })()}
                                </td>
                                {!disabled && !isVendor && (
                                    <td style={{ textAlign: 'center' }}>
                                        <button 
                                            onClick={() => onRemove?.(index)}
                                            style={{ 
                                                background: 'none', 
                                                border: 'none', 
                                                color: '#ef4444', 
                                                cursor: 'pointer',
                                                padding: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            title="Remove item"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                )}
                            </tr>
                            <tr>
                                <td colSpan={!disabled && !isVendor ? 11 : 10} style={{ padding: '4px 8px', borderTop: 'none' }}>
                                    <div className="flex align-center gap-2">
                                        <span style={{ fontWeight: 600, fontSize: '11px' }}>Remark:</span>
                                        {disabled || isVendor ? (
                                            <span style={{ fontSize: '11px' }}>{item.remark}</span>
                                        ) : (
                                            <FormTextarea
                                                value={item.remark}
                                                onChange={(e) => onChange(index, 'remark', e.target.value)}
                                                style={{ flex: 1, minHeight: '24px', padding: '2px 6px', fontSize: '11px' }}
                                                disabled={disabled}
                                            />
                                        )}
                                    </div>
                                </td>
                            </tr>
                        </React.Fragment>
                    ))}
                    {items.length === 0 && (
                        <tr>
                            <td colSpan={!disabled && !isVendor ? 11 : 10} style={{ textAlign: 'center', padding: '20px' }}>No items added</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
