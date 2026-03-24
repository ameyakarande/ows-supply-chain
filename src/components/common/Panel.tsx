import React, { ReactNode } from 'react';

interface PanelProps {
    title?: ReactNode;
    children: ReactNode;
    className?: string;
    headerRight?: ReactNode; // For buttons in header
}

export const Panel: React.FC<PanelProps> = ({ title, children, className = '', headerRight }) => {
    return (
        <div className={`panel ${className}`}>
            {title && (
                <div className="panel-header flex justify-between align-center">
                    <div>{title}</div>
                    {headerRight && <div>{headerRight}</div>}
                </div>
            )}
            <div className="panel-body">
                {children}
            </div>
        </div>
    );
};
