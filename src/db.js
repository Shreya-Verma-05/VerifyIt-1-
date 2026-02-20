const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { drizzle } = require('drizzle-orm/node-postgres');
const { pgTable, text, timestamp, boolean, integer } = require('drizzle-orm/pg-core');
const { eq, inArray, sql } = require('drizzle-orm');

const connectionString = (process.env.DATABASE_URL || '').trim();
const pool = connectionString
    ? new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    })
    : null;
const db = pool ? drizzle(pool) : null;
const subscribersFilePath = path.join(__dirname, '../data/subscribers.json');
let storageMode = db ? 'postgres' : 'json';

const subscribers = pgTable('subscribers', {
    email: text('email').primaryKey(),
    subscribedAt: timestamp('subscribed_at', { withTimezone: true }).notNull().defaultNow(),
    active: boolean('active').notNull().default(true),
    alertsReceived: integer('alerts_received').notNull().default(0)
});

const alertState = pgTable('alert_state', {
    id: integer('id').primaryKey(),
    lastFraudAlertAt: timestamp('last_fraud_alert_at', { withTimezone: true }),
    lastFraudAlertSignature: text('last_fraud_alert_signature')
});

function getDb() {
    if (!db) {
        throw new Error('DATABASE_URL is required to use Neon + Drizzle storage');
    }
    return db;
}

function normalizeEmail(email) {
    return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function normalizeDate(value, fallback = null) {
    if (!value) return fallback;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? fallback : date;
}

function sanitizeSubscriberRecord(record) {
    const email = normalizeEmail(record && record.email);
    if (!email) return null;

    return {
        email,
        subscribedAt: normalizeDate(record.subscribedAt, new Date()).toISOString(),
        active: record && typeof record.active === 'boolean' ? record.active : true,
        alertsReceived: Number.isFinite(Number(record && record.alertsReceived)) ? Number(record.alertsReceived) : 0
    };
}

function buildEmptyJsonStore() {
    return {
        subscribers: [],
        lastUpdated: new Date().toISOString(),
        totalSubscribers: 0,
        lastFraudAlertAt: null,
        lastFraudAlertSignature: null
    };
}

async function readJsonStore() {
    try {
        const raw = await fs.promises.readFile(subscribersFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        const subscribers = Array.isArray(parsed && parsed.subscribers)
            ? parsed.subscribers.map(sanitizeSubscriberRecord).filter(Boolean)
            : [];

        return {
            subscribers,
            lastUpdated: parsed && parsed.lastUpdated ? parsed.lastUpdated : new Date().toISOString(),
            totalSubscribers: subscribers.length,
            lastFraudAlertAt: parsed && parsed.lastFraudAlertAt ? parsed.lastFraudAlertAt : null,
            lastFraudAlertSignature: parsed && parsed.lastFraudAlertSignature ? parsed.lastFraudAlertSignature : null
        };
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.warn('Failed to read subscribers.json, using empty fallback store:', error.message);
        }
        return buildEmptyJsonStore();
    }
}

async function writeJsonStore(store) {
    const nextStore = {
        ...buildEmptyJsonStore(),
        ...store,
        subscribers: Array.isArray(store && store.subscribers)
            ? store.subscribers.map(sanitizeSubscriberRecord).filter(Boolean)
            : [],
        lastUpdated: new Date().toISOString()
    };
    nextStore.totalSubscribers = nextStore.subscribers.length;

    await fs.promises.writeFile(subscribersFilePath, JSON.stringify(nextStore, null, 2), 'utf8');
    return nextStore;
}

async function backfillFromLegacyJson() {
    const legacyPath = path.join(__dirname, '../data/subscribers.json');
    let parsed;

    try {
        const raw = await fs.promises.readFile(legacyPath, 'utf8');
        parsed = JSON.parse(raw);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.warn('Legacy subscribers.json backfill skipped:', error.message);
        }
        return;
    }

    const legacySubscribers = Array.isArray(parsed && parsed.subscribers) ? parsed.subscribers : [];

    for (const subscriber of legacySubscribers) {
        const email = typeof subscriber.email === 'string' ? subscriber.email.trim().toLowerCase() : '';
        if (!email) continue;

        const subscribedAt = subscriber.subscribedAt ? new Date(subscriber.subscribedAt) : new Date();
        await getDb()
            .insert(subscribers)
            .values({
                email,
                subscribedAt: Number.isNaN(subscribedAt.getTime()) ? new Date() : subscribedAt,
                active: Boolean(subscriber.active),
                alertsReceived: Number.isFinite(Number(subscriber.alertsReceived)) ? Number(subscriber.alertsReceived) : 0
            })
            .onConflictDoNothing();
    }

    if (parsed && (parsed.lastFraudAlertAt || parsed.lastFraudAlertSignature)) {
        const lastFraudAlertAt = parsed.lastFraudAlertAt ? new Date(parsed.lastFraudAlertAt) : null;
        await getDb()
            .update(alertState)
            .set({
                lastFraudAlertAt: lastFraudAlertAt && !Number.isNaN(lastFraudAlertAt.getTime()) ? lastFraudAlertAt : null,
                lastFraudAlertSignature: parsed.lastFraudAlertSignature || null
            })
            .where(eq(alertState.id, 1));
    }
}

async function initializeDatabase() {
    if (!db) {
        storageMode = 'json';
        const existing = await readJsonStore();
        await writeJsonStore(existing);
        return;
    }

    const database = getDb();

    try {
        await database.execute(sql`
            CREATE TABLE IF NOT EXISTS subscribers (
                email TEXT PRIMARY KEY,
                subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                active BOOLEAN NOT NULL DEFAULT TRUE,
                alerts_received INTEGER NOT NULL DEFAULT 0
            );
        `);

        await database.execute(sql`
            CREATE TABLE IF NOT EXISTS alert_state (
                id INTEGER PRIMARY KEY,
                last_fraud_alert_at TIMESTAMPTZ,
                last_fraud_alert_signature TEXT
            );
        `);

        await database.execute(sql`
            INSERT INTO alert_state (id)
            VALUES (1)
            ON CONFLICT (id) DO NOTHING;
        `);

        await backfillFromLegacyJson();
        storageMode = 'postgres';
    } catch (error) {
        storageMode = 'json';
        console.warn('Neon database unavailable. Falling back to JSON storage:', error.message);
        const existing = await readJsonStore();
        await writeJsonStore(existing);
    }
}

async function getSubscriberByEmail(email) {
    const normalized = normalizeEmail(email);
    if (!normalized) return null;

    if (storageMode === 'postgres') {
        const rows = await getDb().select().from(subscribers).where(eq(subscribers.email, normalized)).limit(1);
        return rows[0] || null;
    }

    const store = await readJsonStore();
    return store.subscribers.find(item => item.email === normalized) || null;
}

async function createSubscriber(email) {
    const normalized = normalizeEmail(email);
    if (!normalized) return;

    if (storageMode === 'postgres') {
        const now = new Date();
        await getDb().insert(subscribers).values({
            email: normalized,
            subscribedAt: now,
            active: true,
            alertsReceived: 0
        });
        return;
    }

    const store = await readJsonStore();
    const alreadyExists = store.subscribers.some(item => item.email === normalized);
    if (!alreadyExists) {
        store.subscribers.push({
            email: normalized,
            subscribedAt: new Date().toISOString(),
            active: true,
            alertsReceived: 0
        });
        await writeJsonStore(store);
    }
}

async function reactivateSubscriber(email) {
    const normalized = normalizeEmail(email);
    if (!normalized) return;

    if (storageMode === 'postgres') {
        const now = new Date();
        await getDb()
            .update(subscribers)
            .set({
                active: true,
                subscribedAt: now
            })
            .where(eq(subscribers.email, normalized));
        return;
    }

    const store = await readJsonStore();
    const index = store.subscribers.findIndex(item => item.email === normalized);
    if (index >= 0) {
        store.subscribers[index].active = true;
        store.subscribers[index].subscribedAt = new Date().toISOString();
        await writeJsonStore(store);
    }
}

async function getActiveSubscribers() {
    if (storageMode === 'postgres') {
        return getDb().select().from(subscribers).where(eq(subscribers.active, true));
    }

    const store = await readJsonStore();
    return store.subscribers.filter(item => item.active === true);
}

async function incrementAlertsForSubscribers(emails) {
    if (!emails || emails.length === 0) return;

    const normalizedEmails = emails
        .map(normalizeEmail)
        .filter(Boolean);

    if (normalizedEmails.length === 0) return;

    if (storageMode === 'postgres') {
        await getDb()
            .update(subscribers)
            .set({
                alertsReceived: sql`${subscribers.alertsReceived} + 1`
            })
            .where(inArray(subscribers.email, normalizedEmails));
        return;
    }

    const store = await readJsonStore();
    const target = new Set(normalizedEmails);
    let changed = false;

    store.subscribers = store.subscribers.map(item => {
        if (!target.has(item.email)) return item;
        changed = true;
        return {
            ...item,
            alertsReceived: Number.isFinite(Number(item.alertsReceived)) ? Number(item.alertsReceived) + 1 : 1
        };
    });

    if (changed) {
        await writeJsonStore(store);
    }
}

async function getAlertState() {
    if (storageMode === 'postgres') {
        const rows = await getDb().select().from(alertState).where(eq(alertState.id, 1)).limit(1);
        return rows[0] || { id: 1, lastFraudAlertAt: null, lastFraudAlertSignature: null };
    }

    const store = await readJsonStore();
    return {
        id: 1,
        lastFraudAlertAt: store.lastFraudAlertAt || null,
        lastFraudAlertSignature: store.lastFraudAlertSignature || null
    };
}

async function updateAlertState({ lastFraudAlertAt, lastFraudAlertSignature }) {
    if (storageMode === 'postgres') {
        await getDb()
            .update(alertState)
            .set({
                lastFraudAlertAt,
                lastFraudAlertSignature
            })
            .where(eq(alertState.id, 1));
        return;
    }

    const store = await readJsonStore();
    store.lastFraudAlertAt = normalizeDate(lastFraudAlertAt, null);
    store.lastFraudAlertSignature = lastFraudAlertSignature || null;
    if (store.lastFraudAlertAt instanceof Date) {
        store.lastFraudAlertAt = store.lastFraudAlertAt.toISOString();
    }
    await writeJsonStore(store);
}

function getStorageMode() {
    return storageMode;
}

module.exports = {
    initializeDatabase,
    getSubscriberByEmail,
    createSubscriber,
    reactivateSubscriber,
    getActiveSubscribers,
    incrementAlertsForSubscribers,
    getAlertState,
    updateAlertState,
    getStorageMode
};