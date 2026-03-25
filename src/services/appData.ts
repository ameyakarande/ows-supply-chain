import type { AppUser } from '../context/AuthContext';
import type { Invoice, MasterData, NotificationRecord, Quotation } from '../types';
import { isSupabaseConfigured, supabase } from './supabase';

const USERS_TABLE = 'app_users';
const MASTER_DATA_TABLE = 'app_master_data';
const QUOTATIONS_TABLE = 'app_quotations';
const INVOICES_TABLE = 'app_invoices';
const NOTIFICATIONS_TABLE = 'app_notifications';
const MASTER_DATA_ROW_ID = 'default';

type PayloadRow<T> = {
    id: string;
    payload: T;
};

async function fetchCollection<T>(table: string): Promise<T[] | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase!
        .from(table)
        .select('payload')
        .order('updated_at', { ascending: false });

    if (error) {
        console.error(`Failed to load ${table} from Supabase`, error);
        return null;
    }

    return (data ?? []).map(row => row.payload as T);
}

async function syncCollection<T extends { id: string }>(table: string, items: T[]): Promise<void> {
    if (!isSupabaseConfigured) return;

    const rows: PayloadRow<T>[] = items.map(item => ({
        id: item.id,
        payload: item
    }));

    const { error: upsertError } = await supabase!.from(table).upsert(rows, {
        onConflict: 'id'
    });

    if (upsertError) {
        console.error(`Failed to upsert ${table} to Supabase`, upsertError);
        return;
    }

    const { data: existingRows, error: fetchError } = await supabase!
        .from(table)
        .select('id');

    if (fetchError) {
        console.error(`Failed to inspect ${table} rows in Supabase`, fetchError);
        return;
    }

    const currentIds = new Set(items.map(item => item.id));
    const idsToDelete = (existingRows ?? [])
        .map(row => row.id as string)
        .filter(id => !currentIds.has(id));

    if (idsToDelete.length === 0) return;

    const { error: deleteError } = await supabase!.from(table).delete().in('id', idsToDelete);
    if (deleteError) {
        console.error(`Failed to delete stale ${table} rows from Supabase`, deleteError);
    }
}

async function fetchSingleton<T>(table: string, id: string): Promise<T | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase!
        .from(table)
        .select('payload')
        .eq('id', id)
        .maybeSingle();

    if (error) {
        console.error(`Failed to load ${table}.${id} from Supabase`, error);
        return null;
    }

    return (data?.payload as T | undefined) ?? null;
}

async function syncSingleton<T>(table: string, id: string, payload: T): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase!.from(table).upsert({ id, payload }, { onConflict: 'id' });
    if (error) {
        console.error(`Failed to save ${table}.${id} to Supabase`, error);
    }
}

export const appDataService = {
    async loadUsers() {
        return fetchCollection<AppUser>(USERS_TABLE);
    },
    async saveUsers(users: AppUser[]) {
        await syncCollection(USERS_TABLE, users);
    },
    async loadMasterData() {
        return fetchSingleton<MasterData>(MASTER_DATA_TABLE, MASTER_DATA_ROW_ID);
    },
    async saveMasterData(masterData: MasterData) {
        await syncSingleton(MASTER_DATA_TABLE, MASTER_DATA_ROW_ID, masterData);
    },
    async loadQuotations() {
        return fetchCollection<Quotation>(QUOTATIONS_TABLE);
    },
    async saveQuotations(quotations: Quotation[]) {
        await syncCollection(QUOTATIONS_TABLE, quotations);
    },
    async loadInvoices() {
        return fetchCollection<Invoice>(INVOICES_TABLE);
    },
    async saveInvoices(invoices: Invoice[]) {
        await syncCollection(INVOICES_TABLE, invoices);
    },
    async loadNotifications() {
        return fetchCollection<NotificationRecord>(NOTIFICATIONS_TABLE);
    },
    async saveNotifications(notifications: NotificationRecord[]) {
        await syncCollection(NOTIFICATIONS_TABLE, notifications);
    }
};
