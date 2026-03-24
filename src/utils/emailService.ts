import { Quotation } from '../types';

export const sendVendorNotification = async (quotation: Quotation): Promise<boolean> => {
    // In a real app, this would be an API call to a backend service.
    // Here we simulate the process with logging and a small delay.
    console.log(`[EmailService] Sending notification to vendor: ${quotation.supplier} (${quotation.supplierEmail})`);
    console.log(`[EmailService] Subject: New Quotation Request - ${quotation.rfqNo}`);
    console.log(`[EmailService] Body: A new quotation request has been created for vessel ${quotation.vessel} at port ${quotation.port}. Please log in to view and submit your quote.`);
    
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`[EmailService] Notification successfully sent to ${quotation.supplierEmail}`);
            resolve(true);
        }, 800);
    });
};
