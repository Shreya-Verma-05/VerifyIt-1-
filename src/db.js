const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { drizzle } = require('drizzle-orm/node-postgres');
const { pgTable, text, timestamp, boolean, integer } = require('drizzle-orm/pg-core');
const { eq, inArray, sql } = require('drizzle-orm');

const connectionString = process.env.DATABASE_URL;
const pool = connectionString
    ? new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    })
    : null;
const db = pool ? drizzle(pool) : null;

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
    const database = getDb();

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
}

async function getSubscriberByEmail(email) {
    const rows = await getDb().select().from(subscribers).where(eq(subscribers.email, email)).limit(1);
    return rows[0] || null;
}

async function createSubscriber(email) {
    const now = new Date();
    await getDb().insert(subscribers).values({
        email,
        subscribedAt: now,
        active: true,
        alertsReceived: 0
    });
}

async function reactivateSubscriber(email) {
    const now = new Date();
    await getDb()
        .update(subscribers)
        .set({
            active: true,
            subscribedAt: now
        })
        .where(eq(subscribers.email, email));
}

async function getActiveSubscribers() {
    return getDb().select().from(subscribers).where(eq(subscribers.active, true));
}

async function incrementAlertsForSubscribers(emails) {
    if (!emails || emails.length === 0) return;

    await getDb()
        .update(subscribers)
        .set({
            alertsReceived: sql`${subscribers.alertsReceived} + 1`
        })
        .where(inArray(subscribers.email, emails));
}

async function getAlertState() {
    const rows = await getDb().select().from(alertState).where(eq(alertState.id, 1)).limit(1);
    return rows[0] || { id: 1, lastFraudAlertAt: null, lastFraudAlertSignature: null };
}

async function updateAlertState({ lastFraudAlertAt, lastFraudAlertSignature }) {
    await getDb()
        .update(alertState)
        .set({
            lastFraudAlertAt,
            lastFraudAlertSignature
        })
        .where(eq(alertState.id, 1));
}

module.exports = {
    initializeDatabase,
    getSubscriberByEmail,
    createSubscriber,
    reactivateSubscriber,
    getActiveSubscribers,
    incrementAlertsForSubscribers,
    getAlertState,
    updateAlertState
};