import { useState, useEffect, useRef } from 'react';
import { Quotation, QuotationLineItem, TaxRow } from '../types';
import { createEmptyQuotation, initialQuotations } from '../data/mockData';
import { HeaderForm } from '../components/quotation/HeaderForm';
import { AttachmentsPanel } from '../components/quotation/AttachmentsPanel';
import { LineItemsTable } from '../components/quotation/LineItemsTable';
import { TaxSection } from '../components/quotation/TaxSection';
import { TotalsPanel } from '../components/quotation/TotalsPanel';
import { Panel } from '../components/common/Panel';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { Printer, Copy, ArrowLeft, Send, Download, FileUp, FileText } from 'lucide-react';
import { generatePO } from '../utils/poPdfUtils';
import { sendVendorMultiChannelNotification } from '../utils/vendorNotificationService';
import { downloadTemplate, parseExcelFile, exportToExcel } from '../utils/excelUtils';
import { MasterData } from '../types';
import type { AppUser } from '../context/AuthContext';

interface QuotationEntryProps {
    quotationId?: string | null; // null means new
    quotations?: Quotation[]; // Pass the global list
    isViewMode?: boolean;
    isVendor?: boolean;
    currentUserEmail?: string;
    users?: AppUser[];
    saveUsers?: (users: AppUser[]) => void;
    masterData: MasterData;
    onUpdateMasterData: (data: MasterData) => void;
    onBack: () => void;
    onSave: (q: Quotation) => void;
}

export default function QuotationEntry({ 
    quotationId, 
    quotations = initialQuotations, 
    isViewMode = false, 
    isVendor = false, 
    currentUserEmail, 
    users = [],
    saveUsers,
    masterData,
    onUpdateMasterData,
    onBack, 
    onSave 
}: QuotationEntryProps) {
    const [data, setData] = useState<Quotation>(createEmptyQuotation());
    const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (quotationId) {
            const found = quotations.find(q => q.id === quotationId);
            if (found) {
                // Access check for vendors
                if (isVendor && found.supplierEmail !== currentUserEmail) {
                    alert("Unauthorized access to this quotation.");
                    onBack();
                    return;
                }
                setData(calculateQuotationTotals(JSON.parse(JSON.stringify(found))));
            }
        } else {
            setData(calculateQuotationTotals(createEmptyQuotation()));
        }
    }, [quotationId, quotations, isVendor, currentUserEmail, onBack]);

    // Recalculate totals whenever items, taxes, charges or header discounts change
    // Removed useEffect loop, now handled in state updaters

    const calculateQuotationTotals = (prev: Quotation): Quotation => {
        let vendorGrossTotal = 0;
        let vendorLineItemDiscounts = 0;
        let adminGrossTotal = 0;
        let adminLineItemDiscounts = 0;

        const isOverallDiscount = prev.discountType === 'Overall Discount';

        const updatedLines = prev.lineItems.map(item => {
            let activeDiscountPct = isOverallDiscount ? (prev.headerDiscountPercentage || 0) : item.discountPercentage;

            // We always store the vendor's original net price/total in the item for consistency.
            // Admin-specific display is handled in LineItemsTable.tsx.
            const vendorEffectiveUnit = item.unitPrice;
            const vendorNetUnit = activeDiscountPct > 0 ? vendorEffectiveUnit * (1 - (activeDiscountPct / 100)) : vendorEffectiveUnit;
            const vendorNetTotal = vendorNetUnit * item.quantity;
            
            vendorGrossTotal += (vendorEffectiveUnit * item.quantity);
            vendorLineItemDiscounts += ((vendorEffectiveUnit * item.quantity) - vendorNetTotal);

            // Admin calculation uses adminUnitPrice if available, otherwise unitPrice
            const adminEffectiveUnit = item.adminUnitPrice !== undefined ? item.adminUnitPrice : item.unitPrice;
            const adminNetUnit = activeDiscountPct > 0 ? adminEffectiveUnit * (1 - (activeDiscountPct / 100)) : adminEffectiveUnit;
            const adminNetTotal = adminNetUnit * item.quantity;

            adminGrossTotal += (adminEffectiveUnit * item.quantity);
            adminLineItemDiscounts += ((adminEffectiveUnit * item.quantity) - adminNetTotal);

            return { ...item, discountPercentage: activeDiscountPct, netUnitPrice: vendorNetUnit, netTotal: vendorNetTotal };
        });

        // Tax calculation helper
        const calculateTaxes = (amountAfterDisc: number) => {
            let taxTotal = 0;
            prev.taxes.forEach(t => {
                if (t.percentage > 0) { taxTotal += amountAfterDisc * (t.percentage / 100); }
                else if (t.amount > 0) { taxTotal += t.amount; }
            });
            return taxTotal;
        };

        const vendorAmountAfterDiscount = vendorGrossTotal - vendorLineItemDiscounts;
        const vendorTaxTotal = calculateTaxes(vendorAmountAfterDiscount);
        const overallTotal = vendorAmountAfterDiscount + vendorTaxTotal + (prev.deliveryCharge || 0) + (prev.additionalCharge1Amount || 0) + (prev.additionalCharge2Amount || 0);

        const adminAmountAfterDiscount = adminGrossTotal - adminLineItemDiscounts;
        const adminTaxTotal = calculateTaxes(adminAmountAfterDiscount);
        const adminOverallTotal = adminAmountAfterDiscount + adminTaxTotal + (prev.deliveryCharge || 0) + (prev.additionalCharge1Amount || 0) + (prev.additionalCharge2Amount || 0);

        return {
            ...prev,
            lineItems: updatedLines,
            grossTotal: vendorGrossTotal,
            totalDiscount: vendorLineItemDiscounts,
            taxTotal: vendorTaxTotal,
            overallTotal,
            adminGrossTotal: adminGrossTotal,
            adminTotalDiscount: adminLineItemDiscounts,
            adminTaxTotal: adminTaxTotal,
            adminOverallTotal: adminOverallTotal
        };
    };

    const handleHeaderChange = (field: keyof Quotation, value: any) => {
        setData(prev => {
            let next = { ...prev, [field]: value };
            // Synchronize buyer with operating unit as per user request
            if (field === 'operatingUnit') {
                next.buyer = value;
            }
            return calculateQuotationTotals(next);
        });
    };

    const handleLineItemChange = (index: number, field: keyof QuotationLineItem, value: any) => {
        setData(prev => {
            const newItems = [...prev.lineItems];
            newItems[index] = { ...newItems[index], [field]: value };
            return calculateQuotationTotals({ ...prev, lineItems: newItems });
        });
    };

    const handleTaxChange = (index: number, field: keyof TaxRow, value: any) => {
        setData(prev => {
            const newTaxes = [...prev.taxes];
            newTaxes[index] = { ...newTaxes[index], [field]: value };
            return calculateQuotationTotals({ ...prev, taxes: newTaxes });
        });
    };

    const handleAddNewMasterData = (field: string) => {
        const newValue = prompt(`Enter new ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}:`);
        if (newValue && newValue.trim()) {
            const trimmedValue = newValue.trim();
            if (field === 'supplier') {
                const email = prompt(`Enter email for ${trimmedValue}:`);
                if (email && email.trim()) {
                    const trimmedEmail = email.trim();
                    
                    // Update persistent master data
                    const newSuppliers = [...masterData.suppliers, { name: trimmedValue, email: trimmedEmail }];
                    onUpdateMasterData({ ...masterData, suppliers: newSuppliers });
                    
                    // Automatically create a vendor user if saveUsers is available
                    if (saveUsers) {
                        const newUser: AppUser = {
                            id: `u-vendor-${Date.now()}`,
                            username: trimmedEmail,
                            password: 'vendor123',
                            role: 'vendor',
                            displayName: trimmedValue,
                            email: trimmedEmail
                        };
                        saveUsers([...users, newUser]);
                        alert(`Vendor user created successfully.\nUsername: ${trimmedEmail}\nPassword: vendor123`);
                    }

                    setData(prev => ({ ...prev, supplier: trimmedValue, supplierEmail: trimmedEmail }));
                }
            } else {
                const listKey = field === 'operatingUnit' ? 'operatingUnits' : (field + 's') as keyof MasterData;
                const targetList = masterData[listKey];
                
                if (Array.isArray(targetList)) {
                    const newList = [...(targetList as any), trimmedValue];
                    onUpdateMasterData({ ...masterData, [listKey]: newList });
                    setData(prev => ({ ...prev, [field]: trimmedValue }));
                }
            }
        }
    };

    const validate = (): boolean => {
        const errs = [];
        if (!data.currency) errs.push('Currency is required.');
        if (isVendor && !data.supplierQuotationNo) errs.push('Supplier Quotation No. is required.');

        data.lineItems.forEach(item => {
            if (item.unitPrice < 0) errs.push(`Line ${item.lineNo}: Unit Price cannot be negative.`);
            if (item.discountPercentage > 100 || item.discountPercentage < 0) errs.push(`Line ${item.lineNo}: Invalid Discount %.`);
        });

        if (data.deliveryTimeDays < 0) errs.push('Delivery Time cannot be negative.');

        setErrors(errs);
        return errs.length === 0;
    };


    const handleSubmit = async () => {
        if (!validate()) return;

        const isNew = !quotationId;
        const nextStatus: Quotation['status'] = isVendor ? 'Submitted' : 'SentToVendor';

        if (isNew && !isVendor && selectedSuppliers.length > 0) {
            // Bulk create for multiple suppliers
            const dispatchTasks = selectedSuppliers.map(async (supplierName, index) => {
                const supplierObj = masterData.suppliers.find(s => s.name === supplierName);
                const supplierEmail = supplierObj?.email || '';
                
                const newQuotation: Quotation = {
                    ...data,
                    id: `q-${Date.now()}-${index}`,
                    supplier: supplierName,
                    supplierEmail: supplierEmail,
                    status: nextStatus,
                    lastModifiedAt: new Date().toISOString()
                };

                onSave(newQuotation);
                const vendorUser = users.find(user => user.role === 'vendor' && user.email === supplierEmail);
                return sendVendorMultiChannelNotification(newQuotation, vendorUser);
            });
            const results = await Promise.all(dispatchTasks);
            const whatsappCount = results.filter(result => result.whatsapp !== 'skipped').length;
            const telegramCount = results.filter(result => result.telegram !== 'skipped').length;
            alert(`Quotation(s) created. Email notifications were triggered for ${results.length} vendor(s), WhatsApp for ${whatsappCount}, and Telegram for ${telegramCount}.`);
            onBack();
        } else {
            // Single submission
            const updatedQuotation: Quotation = {
                ...data,
                status: nextStatus,
                lastModifiedAt: new Date().toISOString(),
                vendorEditCount: (isVendor && data.status === 'Submitted') 
                    ? (data.vendorEditCount || 0) + 1 
                    : (data.vendorEditCount || 0)
            };

            if (!isVendor && nextStatus === 'SentToVendor') {
                const vendorUser = users.find(user => user.role === 'vendor' && user.email === updatedQuotation.supplierEmail);
                const result = await sendVendorMultiChannelNotification(updatedQuotation, vendorUser);
                alert(`Vendor notifications triggered. Email: ${result.email}. WhatsApp: ${result.whatsapp}. Telegram: ${result.telegram}.`);
            }

            onSave(updatedQuotation);
            onBack();
        }
    };

    const handleDuplicate = () => {
        const duplicated: Quotation = {
            ...data,
            id: `q-${Date.now()}-dup`,
            status: 'New',
            lastModifiedAt: new Date().toISOString(),
            supplierQuotationNo: '', // Clear vendor info
            quotationAttachments: []
        };
        setData(duplicated);
        setSelectedSuppliers([]);
        alert("Quotation duplicated. You are now editing the copy.");
    };

    const handleApprove = () => {
        let finalData = { ...data };
        
        const wantMargin = window.confirm("Would you like to increase the prices by a certain percentage before approving?");
        
        if (wantMargin) {
            const pctStr = window.prompt("Enter the percentage to increase prices by (e.g. 10):", "0");
            const pct = parseFloat(pctStr || "0");
            
            if (!isNaN(pct) && pct > 0) {
                const updatedItems = finalData.lineItems.map(item => ({
                    ...item,
                    adminUnitPrice: item.unitPrice * (1 + (pct / 100))
                }));
                finalData = { ...finalData, lineItems: updatedItems };
            }
        }

        onSave(calculateQuotationTotals({ ...finalData, status: 'Approved', lastModifiedAt: new Date().toISOString() }));
        onBack();
    };

    const handleReject = () => {
        onSave({ ...data, status: 'Rejected', lastModifiedAt: new Date().toISOString() });
        onBack();
    };

    const handleCreatePO = () => {
        const poNo = prompt("Enter PO Number (or leave blank to auto-generate):", `PO-${data.rfqNo}-${Date.now().toString().slice(-4)}`);
        if (poNo === null) return; // Cancelled

        const finalPoNo = poNo.trim() || `PO-${data.rfqNo}-${Date.now().toString().slice(-4)}`;
        
        onSave(calculateQuotationTotals({ 
            ...data, 
            status: 'PO Issued', 
            poNo: finalPoNo, 
            poDate: new Date().toISOString().split('T')[0],
            lastModifiedAt: new Date().toISOString() 
        }));
        alert(`PO ${finalPoNo} created successfully.`);
        onBack();
    };

    const handleClose = () => {
        if (window.confirm("Are you sure you want to CLOSE this quotation? This will finalize it for both you and the vendor.")) {
            onSave(calculateQuotationTotals({ ...data, status: 'Closed', lastModifiedAt: new Date().toISOString() }));
            onBack();
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const addLineItem = () => {
        setData(prev => calculateQuotationTotals({
            ...prev,
            lineItems: [
                ...prev.lineItems,
                {
                    id: `li-${Date.now()}`,
                    lineNo: prev.lineItems.length + 1,
                    itemCode: '',
                    itemDescription: '',
                    specification: '',
                    primaryUnit: 'EA',
                    quantity: 1,
                    unitPrice: 0,
                    discountPercentage: 0,
                    netUnitPrice: 0,
                    netTotal: 0,
                    remark: ''
                }
            ]
        }));
    };

    const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const importedItems = await parseExcelFile(file);
            const itemsWithIds: QuotationLineItem[] = importedItems.map((item, idx) => ({
                id: `li-imp-${Date.now()}-${idx}`,
                lineNo: item.lineNo || (data.lineItems.length + idx + 1),
                itemCode: item.itemCode || '',
                itemDescription: item.itemDescription || '',
                specification: item.specification || '',
                primaryUnit: item.primaryUnit || 'EA',
                quantity: item.quantity || 0,
                unitPrice: item.unitPrice || 0,
                discountPercentage: item.discountPercentage || 0,
                netUnitPrice: 0,
                netTotal: 0,
                remark: item.remark || ''
            }));

            setData(prev => calculateQuotationTotals({
                ...prev,
                lineItems: [...prev.lineItems, ...itemsWithIds]
            }));
            
            // Clear input
            e.target.value = '';
        } catch (error) {
            console.error('Error importing Excel:', error);
            alert('Failed to import Excel file. Please ensure the format is correct.');
        }
    };

    const removeLineItem = (index: number) => {
        setData(prev => calculateQuotationTotals({
            ...prev,
            lineItems: prev.lineItems.filter((_, i) => i !== index)
        }));
    };

    // For vendors, edits are allowed in SentToVendor or ONCE in Submitted status.
    // Edits are strictly removed for vendors once Approved or Rejected.
    const canVendorEdit = isVendor && (
        data.status === 'SentToVendor' || 
        (data.status === 'Submitted' && (data.vendorEditCount || 0) < 1)
    );
    
    const canAdminEdit = !isVendor && ['New', 'SentToVendor', 'Submitted'].includes(data.status);
    const isActuallyDisabled = isViewMode || !(isVendor ? canVendorEdit : canAdminEdit);

    return (
        <div>
            {/* Action Bar */}
            <div className="flex justify-between align-center border-b pb-4 mb-4 no-print" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
                <div className="flex align-center gap-4">
                    <Button variant="icon" onClick={onBack} title="Back to List">
                        <ArrowLeft size={20} />
                    </Button>
                    <h2 style={{ margin: 0 }}>
                        {isViewMode ? 'View Quotation' : (quotationId ? 'Edit Quotation' : 'New Quotation')}
                    </h2>
                    <StatusBadge status={data.status} role={isVendor ? 'vendor' : 'company'} />
                </div>
                <div className="flex gap-2">
                        {data.status === 'PO Issued' && (
                            <Button
                                variant="secondary"
                                onClick={() => generatePO(data)}
                                style={{ color: '#0066cc' }}
                            >
                                <FileText size={16} style={{ marginRight: '6px' }} />
                                Download PO
                            </Button>
                        )}
                        {isViewMode ? (
                        <>
                            <Button onClick={handlePrint}><Printer size={14} className="mr-1" style={{ marginRight: '6px' }} /> Print</Button>
                            <Button onClick={handleDuplicate}><Copy size={14} className="mr-1" style={{ marginRight: '6px' }} /> Duplicate Quotation</Button>
                            
                            {/* Actions allowed in view mode for Company Admin */}
                            {!isVendor && data.status === 'Approved' && (
                                <Button variant="primary" onClick={handleCreatePO} style={{ backgroundColor: '#9d174d' }}>
                                    Create PO
                                </Button>
                            )}

                            {!isVendor && !['New', 'Closed'].includes(data.status) && (
                                <Button variant="secondary" onClick={handleClose} style={{ marginLeft: '8px' }}>
                                    Close Quotation
                                </Button>
                            )}
                        </>
                    ) : (
                        <>
                            {!isActuallyDisabled && (
                                <Button variant="primary" onClick={handleSubmit} style={{ backgroundColor: '#2563eb' }}>
                                    <Send size={14} className="mr-1" style={{ marginRight: '6px' }} />
                                    {isVendor 
                                        ? (data.status === 'Submitted' ? 'Update Quotation' : 'Submit Quotation') 
                                        : (data.status === 'New' ? 'Submit to Vendor' : 'Save Changes')
                                    }
                                </Button>
                            )}
                            
                            {!isVendor && data.status === 'Submitted' && (
                                <>
                                    <Button variant="primary" onClick={handleApprove} style={{ backgroundColor: '#059669' }}>
                                        Approve
                                    </Button>
                                    <Button variant="danger" onClick={handleReject}>
                                        Unapprove
                                    </Button>
                                </>
                            )}

                            {!isVendor && data.status === 'Approved' && (
                                <Button variant="primary" onClick={handleCreatePO} style={{ backgroundColor: '#9d174d' }}>
                                    Create PO
                                </Button>
                            )}

                            {!isVendor && !['New', 'Closed'].includes(data.status) && (
                                <Button variant="secondary" onClick={handleClose} style={{ marginLeft: '8px' }}>
                                    Close Quotation
                                </Button>
                            )}
                            
                            <Button onClick={onBack}>{isActuallyDisabled ? 'Back' : 'Cancel'}</Button>
                        </>
                    )}
                </div>
            </div>

            {errors.length > 0 && (
                <div className="panel p-4 mb-4 no-print" style={{ backgroundColor: '#fef2f2', borderColor: '#f87171' }}>
                    <div className="text-danger font-semibold mb-2">Please fix the following errors:</div>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--danger-color)' }}>
                        {errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                </div>
            )}

            {/* Main Form Content */}
            <Panel title="Header Information">
                <HeaderForm 
                    data={data} 
                    onChange={handleHeaderChange} 
                    onAddNew={handleAddNewMasterData}
                    disabled={isActuallyDisabled} 
                    isAdmin={!isVendor}
                    isNew={!quotationId}
                    selectedSuppliers={selectedSuppliers}
                    onSuppliersChange={setSelectedSuppliers}
                    masterData={masterData}
                />
                <AttachmentsPanel
                    attachments={data.requisitionAttachments}
                    onChange={(attachments) => handleHeaderChange('requisitionAttachments', attachments)}
                    quotationAttachments={data.quotationAttachments || []}
                    onQuotationChange={(attachments) => handleHeaderChange('quotationAttachments', attachments)}
                    disabled={isActuallyDisabled}
                    isVendor={isVendor}
                />
            </Panel>

            <Panel
                title="Quotation Items"
                headerRight={
                    <div className="flex gap-2 no-print">
                        {!isActuallyDisabled && (
                            <>
                                {!isVendor && (
                                    <>
                                        <Button onClick={downloadTemplate} style={{ padding: '2px 8px' }}>
                                            <Download size={14} style={{ marginRight: '6px' }} /> Template
                                        </Button>
                                        <Button onClick={() => fileInputRef.current?.click()} style={{ padding: '2px 8px' }}>
                                            <FileUp size={14} style={{ marginRight: '6px' }} /> Import
                                        </Button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            style={{ display: 'none' }}
                                            accept=".xlsx, .xls"
                                            onChange={handleExcelUpload}
                                        />
                                        <Button onClick={addLineItem} style={{ padding: '2px 8px' }}>+ Add Item</Button>
                                    </>
                                )}
                                <Button onClick={() => exportToExcel(data.lineItems, `Quotation_${data.rfqNo}.xlsx`)} style={{ padding: '2px 8px' }}>
                                    <Download size={14} style={{ marginRight: '6px' }} /> Download Excel
                                </Button>
                            </>
                        )}
                    </div>
                }
            >
                <LineItemsTable
                    items={data.lineItems}
                    onChange={handleLineItemChange}
                    onRemove={removeLineItem}
                    disabled={isActuallyDisabled}
                    discountType={data.discountType}
                    isVendor={isVendor}
                />

                <div className="flex" style={{ marginTop: '20px' }}>
                    <TaxSection taxes={data.taxes} onChange={handleTaxChange} disabled={isActuallyDisabled} masterData={masterData} isVendor={isVendor} />
                    <TotalsPanel 
                        data={{
                            ...data,
                            grossTotal: isVendor ? data.grossTotal : (data.adminGrossTotal ?? data.grossTotal),
                            totalDiscount: isVendor ? data.totalDiscount : (data.adminTotalDiscount ?? data.totalDiscount),
                            taxTotal: isVendor ? data.taxTotal : (data.adminTaxTotal ?? data.taxTotal),
                            overallTotal: isVendor ? data.overallTotal : (data.adminOverallTotal ?? data.overallTotal)
                        }} 
                        onChange={handleHeaderChange} 
                        disabled={isActuallyDisabled} 
                        isVendor={isVendor}
                    />
                </div>
            </Panel>
        </div>
    );
}
