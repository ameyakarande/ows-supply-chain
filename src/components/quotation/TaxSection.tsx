import { TaxRow, MasterData } from '../../types';
import { FormInput, FormSelect } from '../common/FormField';

interface TaxSectionProps {
    taxes: TaxRow[];
    onChange: (index: number, field: keyof TaxRow, value: any) => void;
    disabled?: boolean;
    masterData: MasterData;
    isVendor?: boolean;
}

export const TaxSection: React.FC<TaxSectionProps> = ({ taxes, onChange, disabled, masterData }) => {
    return (
        <div style={{ flex: 1, marginRight: '20px' }}>
            <table className="data-table">
                <thead>
                    <tr>
                        <th style={{ width: '30px', textAlign: 'center' }}>#</th>
                        <th style={{ width: '120px' }}>Tax Type</th>
                        <th style={{ width: '150px' }}>Tax Code <span style={{ fontWeight: 'normal' }}>(for reference only)</span></th>
                        <th style={{ width: '100px', textAlign: 'right' }}>Amount</th>
                        <th style={{ width: '60px', textAlign: 'center' }}>%</th>
                        <th>Remark</th>
                    </tr>
                </thead>
                <tbody>
                    {taxes.map((tax, index) => (
                        <tr key={tax.id}>
                            <td style={{ textAlign: 'center' }}>{index + 1}</td>
                            <td>
                                {disabled ? (
                                    <span>{tax.taxType}</span>
                                ) : (
                                    <div className="table-input-container">
                                        <FormSelect
                                            value={tax.taxType}
                                            onChange={(e) => onChange(index, 'taxType', e.target.value)}
                                            options={masterData.taxTypes}
                                            disabled={disabled}
                                        />
                                    </div>
                                )}
                            </td>
                            <td>
                                {disabled ? (
                                    <span>{tax.taxCode}</span>
                                ) : (
                                    <div className="table-input-container">
                                        <FormInput
                                            value={tax.taxCode}
                                            onChange={(e) => onChange(index, 'taxCode', e.target.value)}
                                            disabled={disabled}
                                        />
                                    </div>
                                )}
                            </td>
                            <td>
                                {disabled ? (
                                    <div className="text-right">{tax.amount.toFixed(2)}</div>
                                ) : (
                                    <div className="table-input-container">
                                        <FormInput
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={tax.amount}
                                            onChange={(e) => onChange(index, 'amount', parseFloat(e.target.value) || 0)}
                                            disabled={disabled}
                                            style={{ textAlign: 'right' }}
                                        />
                                    </div>
                                )}
                            </td>
                            <td>
                                {disabled ? (
                                    <div className="text-center">{tax.percentage.toFixed(2)}</div>
                                ) : (
                                    <div className="table-input-container">
                                        <FormInput
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={tax.percentage}
                                            onChange={(e) => onChange(index, 'percentage', parseFloat(e.target.value) || 0)}
                                            disabled={disabled}
                                            style={{ textAlign: 'center' }}
                                        />
                                    </div>
                                )}
                            </td>
                            <td>
                                {disabled ? (
                                    <span>{tax.remark}</span>
                                ) : (
                                    <div className="table-input-container">
                                        <FormInput
                                            value={tax.remark}
                                            onChange={(e) => onChange(index, 'remark', e.target.value)}
                                            disabled={disabled}
                                        />
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
