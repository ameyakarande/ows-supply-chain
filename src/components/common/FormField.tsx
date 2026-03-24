import React, { ReactNode } from 'react';

interface FormFieldProps {
    label: string;
    required?: boolean;
    children: ReactNode;
    className?: string; // Additional classes for the row
    labelWidth?: string; // Optional custom width for the label
}

export const FormField: React.FC<FormFieldProps> = ({
    label,
    required,
    children,
    className = '',
    labelWidth
}) => {
    return (
        <div className={`form-row ${className}`}>
            <label
                className="form-label"
                style={labelWidth ? { flex: `0 0 ${labelWidth}` } : undefined}
            >
                {label}: {required && <span className="required-mark">*</span>}
            </label>
            <div className="form-value" style={{ minWidth: 0 }}>
                {children}
            </div>
        </div>
    );
};

// Input wrapper to handle common classes and required styling
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> { }
export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>((props, ref) => (
    <input
        ref={ref}
        className={`form-input ${props.className || ''}`}
        {...props}
    />
));
FormInput.displayName = 'FormInput';

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    options: { label: string; value: string | number }[] | string[];
    optionLabels?: Record<string, string>;
}
export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(({ options, className, optionLabels, ...props }, ref) => (
    <select
        ref={ref}
        className={`form-select ${className || ''}`}
        {...props}
    >
        <option value=""></option>
        {options.map((opt, i) => {
            const isString = typeof opt === 'string';
            const value = isString ? opt : opt.value;
            const label = isString ? (optionLabels?.[opt] || opt) : opt.label;
            return <option key={i} value={value}>{label}</option>;
        })}
    </select>
));
FormSelect.displayName = 'FormSelect';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }
export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>((props, ref) => (
    <textarea
        ref={ref}
        className={`form-textarea ${props.className || ''}`}
        {...props}
    />
));
FormTextarea.displayName = 'FormTextarea';
interface FormMultiSelectProps {
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    onAddNew?: () => void;
    disabled?: boolean;
}
export const FormMultiSelect: React.FC<FormMultiSelectProps> = ({ options, selected, onChange, onAddNew, disabled }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const toggle = (opt: string) => {
        if (selected.includes(opt)) {
            onChange(selected.filter(s => s !== opt));
        } else {
            onChange([...selected, opt]);
        }
    };

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef} style={{ position: 'relative', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            <div 
                className={`form-input flex items-center justify-between cursor-pointer ${disabled ? 'disabled' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '0 8px', // Center text vertically
                    height: '28px', // Match exactly
                    minWidth: 0,
                    boxSizing: 'border-box'
                }}
            >
                <div style={{ 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap', 
                    flex: '1 1 0%', 
                    minWidth: 0 
                }}>
                    {selected.length === 0 ? 'Select Suppliers...' : selected.join(', ')}
                </div>
                <span style={{ fontSize: '8px', color: 'var(--text-secondary)', flexShrink: 0, marginLeft: '4px' }}>{isOpen ? '▲' : '▼'}</span>
            </div>

            {isOpen && (
                <div 
                    style={{ 
                        position: 'absolute', 
                        top: '100%', 
                        left: 0, 
                        right: 0, 
                        zIndex: 1000, 
                        backgroundColor: 'white', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '4px',
                        marginTop: '4px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        maxHeight: '200px',
                        overflowY: 'auto'
                    }}
                >
                    {options.map(opt => (
                        <label 
                            key={opt} 
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                padding: '8px 12px', 
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                            className="hover:bg-gray-50"
                        >
                            <input
                                type="checkbox"
                                checked={selected.includes(opt)}
                                onChange={() => toggle(opt)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            {opt}
                        </label>
                    ))}
                    {options.length === 0 && !onAddNew && (
                        <div style={{ padding: '8px 12px', fontSize: '14px', color: '#94a3b8' }}>No options available</div>
                    )}
                    {onAddNew && (
                        <div 
                            style={{ 
                                padding: '8px 12px', 
                                borderTop: '1px solid var(--border-color)',
                                backgroundColor: '#f9fafb'
                            }}
                        >
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddNew();
                                }}
                                style={{
                                    width: '100%',
                                    padding: '6px',
                                    backgroundColor: 'white',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '3px',
                                    fontSize: '12px',
                                    color: 'var(--primary-color)',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                                + Add New
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
