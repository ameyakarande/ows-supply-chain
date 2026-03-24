import React from 'react';
import { Quotation } from '../../types';
import { FormInput } from '../common/FormField';

interface TotalsPanelProps {
    data: Quotation;
    onChange: (field: keyof Quotation, value: any) => void;
    disabled?: boolean;
    isVendor?: boolean;
}

export const TotalsPanel: React.FC<TotalsPanelProps> = ({ data, onChange, disabled }) => {
    return (
        <div className="totals-panel">
            <div className="totals-row">
                <span className="font-semibold text-right w-full" style={{ paddingRight: '20px' }}>Gross Total :</span>
                <span style={{ width: '100px', textAlign: 'right', display: 'inline-block', backgroundColor: '#e5e7eb', padding: '2px 8px', borderRadius: '3px' }}>
                    {data.grossTotal.toFixed(2)}
                </span>
            </div>

            <div className="totals-row">
                <span className="font-semibold text-right w-full" style={{ paddingRight: '20px' }}>Total Discount :</span>
                <span style={{ width: '100px', textAlign: 'right', display: 'inline-block', backgroundColor: '#e5e7eb', padding: '2px 8px', borderRadius: '3px' }}>
                    {data.totalDiscount.toFixed(2)}
                </span>
            </div>

            <div className="totals-row">
                <span className="font-semibold text-right w-full" style={{ paddingRight: '20px' }}>Tax Total :</span>
                <span style={{ width: '100px', textAlign: 'right', display: 'inline-block', backgroundColor: '#e5e7eb', padding: '2px 8px', borderRadius: '3px' }}>
                    {data.taxTotal.toFixed(2)}
                </span>
            </div>

            <div className="totals-row">
                <span className="font-semibold text-right w-full" style={{ paddingRight: '20px' }}>Delivery Charge :</span>
                <div style={{ width: '100px' }}>
                    {disabled ? (
                        <div style={{ textAlign: 'right', padding: '2px 8px' }}>{data.deliveryCharge.toFixed(2)}</div>
                    ) : (
                        <FormInput
                            type="number"
                            min="0"
                            step="0.01"
                            value={data.deliveryCharge}
                            onChange={(e) => onChange('deliveryCharge', parseFloat(e.target.value) || 0)}
                            style={{ textAlign: 'right' }}
                            disabled={disabled}
                        />
                    )}
                </div>
            </div>

            <div className="totals-row align-center">
                <div className="flex justify-end gap-2 w-full" style={{ paddingRight: '10px' }}>
                    {disabled ? <span>{data.additionalCharge1Label}</span> :
                        <FormInput
                            value={data.additionalCharge1Label}
                            onChange={(e) => onChange('additionalCharge1Label', e.target.value)}
                            placeholder="Add. Charge 1"
                            disabled={disabled}
                            style={{ width: '120px' }}
                        />
                    }
                    <span>:</span>
                </div>
                <div style={{ width: '100px' }}>
                    {disabled ? (
                        <div style={{ textAlign: 'right', padding: '2px 8px' }}>{data.additionalCharge1Amount.toFixed(2)}</div>
                    ) : (
                        <FormInput
                            type="number"
                            min="0"
                            step="0.01"
                            value={data.additionalCharge1Amount}
                            onChange={(e) => onChange('additionalCharge1Amount', parseFloat(e.target.value) || 0)}
                            style={{ textAlign: 'right' }}
                            disabled={disabled}
                        />
                    )}
                </div>
            </div>

            <div className="totals-row align-center">
                <div className="flex justify-end gap-2 w-full" style={{ paddingRight: '10px' }}>
                    {disabled ? <span>{data.additionalCharge2Label}</span> :
                        <FormInput
                            value={data.additionalCharge2Label}
                            onChange={(e) => onChange('additionalCharge2Label', e.target.value)}
                            placeholder="Add. Charge 2"
                            disabled={disabled}
                            style={{ width: '120px' }}
                        />
                    }
                    <span>:</span>
                </div>
                <div style={{ width: '100px' }}>
                    {disabled ? (
                        <div style={{ textAlign: 'right', padding: '2px 8px' }}>{data.additionalCharge2Amount.toFixed(2)}</div>
                    ) : (
                        <FormInput
                            type="number"
                            min="0"
                            step="0.01"
                            value={data.additionalCharge2Amount}
                            onChange={(e) => onChange('additionalCharge2Amount', parseFloat(e.target.value) || 0)}
                            style={{ textAlign: 'right' }}
                            disabled={disabled}
                        />
                    )}
                </div>
            </div>

            <div className="totals-row" style={{ marginTop: '10px' }}>
                <span className="font-semibold text-right w-full" style={{ paddingRight: '20px', fontSize: '15px' }}>Overall Total :</span>
                <span style={{ width: '100px', textAlign: 'right', display: 'inline-block', backgroundColor: '#e0e7ff', padding: '2px 8px', borderRadius: '3px', color: '#1e40af', fontSize: '15px' }}>
                    {data.overallTotal.toFixed(2)}
                </span>
            </div>
        </div>
    );
};
