import React, { useRef } from 'react';
import { UploadCloud, File, Trash2, Download } from 'lucide-react';
import { Attachment } from '../../types';

interface AttachmentsPanelProps {
    attachments: Attachment[];
    onChange: (attachments: Attachment[]) => void;
    quotationAttachments: Attachment[];
    onQuotationChange: (attachments: Attachment[]) => void;
    disabled?: boolean;
    isVendor?: boolean;
}

export const AttachmentsPanel: React.FC<AttachmentsPanelProps> = ({ attachments = [], onChange, quotationAttachments = [], onQuotationChange, disabled, isVendor }) => {
    const reqFileInputRef = useRef<HTMLInputElement>(null);
    const quoFileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isQuotation: boolean) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
            const base64Data = event.target?.result as string;
            const newAttachment: Attachment = {
                id: `att-${Date.now()}`,
                fileName: file.name,
                fileType: file.type,
                base64Data
            };
            if (isQuotation) {
                onQuotationChange([...quotationAttachments, newAttachment]);
            } else {
                onChange([...attachments, newAttachment]);
            }
        };

        reader.readAsDataURL(file);

        // Reset input so the same file could be selected again if needed
        if (isQuotation) {
            if (quoFileInputRef.current) quoFileInputRef.current.value = '';
        } else {
            if (reqFileInputRef.current) reqFileInputRef.current.value = '';
        }
    };

    const handleDownload = (att: Attachment) => {
        const link = document.createElement('a');
        link.href = att.base64Data;
        link.download = att.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDelete = (idToRemove: string, isQuotation: boolean) => {
        if (isQuotation) {
            onQuotationChange(quotationAttachments.filter(a => a.id !== idToRemove));
        } else {
            onChange(attachments.filter(a => a.id !== idToRemove));
        }
    };

    return (
        <div className="flex w-full" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--rounded)', marginTop: '20px', backgroundColor: '#f0f4ff', minHeight: '100px' }}>
            <div style={{ flex: 1, padding: '15px', borderRight: '1px solid var(--border-color)' }}>
                <div className="flex justify-between align-center mb-2">
                    <h4 style={{ margin: 0, fontWeight: 600 }}>Requisition Attachments</h4>
                    {!disabled && !isVendor && (
                        <div>
                            <input
                                type="file"
                                ref={reqFileInputRef}
                                style={{ display: 'none' }}
                                onChange={(e) => handleFileSelect(e, false)}
                                accept=".pdf, .doc, .docx, .png, .jpg, .jpeg"
                            />
                            <button
                                className="btn btn-primary"
                                style={{ padding: '4px 8px', borderRadius: '4px' }}
                                onClick={() => reqFileInputRef.current?.click()}
                                type="button"
                            >
                                <UploadCloud size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {attachments.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {attachments.map(att => (
                            <li key={att.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                    <File size={14} color="#64748b" />
                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }} title={att.fileName}>
                                        {att.fileName}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleDownload(att)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: '2px' }}
                                        title="Download"
                                    >
                                        <Download size={14} />
                                    </button>
                                    {!disabled && !isVendor && (
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(att.id, false)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px' }}
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic', marginTop: '10px' }}>No attachments</div>
                )}
            </div>
            <div style={{ flex: 1, padding: '15px' }}>
                <div className="flex justify-between align-center mb-2">
                    <h4 style={{ margin: 0, fontWeight: 600 }}>Quotation Attachments</h4>
                    {!disabled && (
                        <div>
                            <input
                                type="file"
                                ref={quoFileInputRef}
                                style={{ display: 'none' }}
                                onChange={(e) => handleFileSelect(e, true)}
                                accept=".pdf, .doc, .docx, .xls, .xlsx"
                            />
                            <button
                                className="btn btn-primary"
                                style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#34d399', color: '#064e3b', border: 'none' }}
                                onClick={() => quoFileInputRef.current?.click()}
                                type="button"
                                title="Upload File (PDF, Word, Excel)"
                            >
                                <UploadCloud size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {quotationAttachments && quotationAttachments.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {quotationAttachments.map(att => (
                            <li key={att.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                    <File size={14} color="#64748b" />
                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }} title={att.fileName}>
                                        {att.fileName}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleDownload(att)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: '2px' }}
                                        title="Download"
                                    >
                                        <Download size={14} />
                                    </button>
                                    {!disabled && (
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(att.id, true)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px' }}
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic', marginTop: '10px' }}>Supplier uploaded attachments will appear here</div>
                )}
            </div>
        </div>
    );
};
