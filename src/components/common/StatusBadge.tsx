import React from 'react';

interface StatusBadgeProps {
    status: string;
    role?: 'company' | 'vendor';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, role = 'company' }) => {
    const getDisplayInfo = (s: string, r: 'company' | 'vendor') => {
        const lowerStatus = s.toLowerCase();
        
        if (lowerStatus === 'new') {
            return {
                label: 'New',
                className: 'badge-new'
            };
        }

        if (lowerStatus === 'senttovendor') {
            return {
                label: r === 'company' ? 'Quotes Pending' : 'Open',
                className: 'badge-new'
            };
        }
        
        if (lowerStatus === 'submitted') {
            return {
                label: r === 'company' ? 'Quotation Received' : 'Submitted',
                className: 'badge-submitted'
            };
        }
        
        if (lowerStatus === 'approved') {
            return {
                label: 'Approved',
                className: 'badge-approved'
            };
        }

        if (lowerStatus === 'rejected') {
            return {
                label: 'Unapproved',
                className: 'badge-draft' // Using draft style for rejected/unapproved
            };
        }

        if (lowerStatus === 'closed') {
            return {
                label: 'Closed',
                className: 'badge-draft'
            };
        }
        
        if (lowerStatus === 'po issued') {
            return {
                label: 'PO Issued',
                className: 'badge-po'
            };
        }

        return {
            label: s,
            className: 'badge-new'
        };
    };

    const { label, className } = getDisplayInfo(status, role);

    return (
        <span className={`badge ${className}`}>
            {label}
        </span>
    );
};
