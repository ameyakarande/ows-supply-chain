import type { AppUser } from '../context/AuthContext';
import type { MasterData } from '../types';

interface VendorCreationInput {
    users: AppUser[];
    masterData: MasterData;
    username: string;
    password: string;
    displayName: string;
    email: string;
    whatsappNumber?: string;
    telegramUsername?: string;
}

interface VendorCreationSuccess {
    user: AppUser;
    masterData: MasterData;
    credentials: {
        username: string;
        password: string;
    };
}

interface VendorCreationError {
    error: string;
}

export function createVendorWithUserManagementLogic({
    users,
    masterData,
    username,
    password,
    displayName,
    email,
    whatsappNumber,
    telegramUsername
}: VendorCreationInput): VendorCreationSuccess | VendorCreationError {
    if (!username.trim() || !displayName.trim() || !email.trim()) {
        return { error: 'All fields are required except password.' };
    }

    if (users.find(user => user.username === username.trim())) {
        return { error: 'Username already exists.' };
    }

    let finalPassword = password.trim();
    if (!finalPassword) {
        finalPassword = Math.random().toString(36).slice(-8);
    }

    const user: AppUser = {
        id: `u-${Date.now()}`,
        username: username.trim(),
        password: finalPassword,
        role: 'vendor',
        displayName: displayName.trim(),
        email: email.trim(),
        whatsappNumber: whatsappNumber?.trim() || undefined,
        telegramUsername: telegramUsername?.trim() || undefined
    };

    const supplierExists = masterData.suppliers.some(supplier => supplier.email === user.email);
    const nextMasterData = supplierExists
        ? masterData
        : {
            ...masterData,
            suppliers: [...masterData.suppliers, { name: user.displayName, email: user.email }]
        };

    return {
        user,
        masterData: nextMasterData,
        credentials: {
            username: user.username,
            password: finalPassword
        }
    };
}
