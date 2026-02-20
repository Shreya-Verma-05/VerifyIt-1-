import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const subscribers = pgTable("subscribers", {
	email: text().primaryKey().notNull(),
	subscribedAt: timestamp("subscribed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	active: boolean().default(true).notNull(),
	alertsReceived: integer("alerts_received").default(0).notNull(),
});

export const alertState = pgTable("alert_state", {
	id: integer().primaryKey().notNull(),
	lastFraudAlertAt: timestamp("last_fraud_alert_at", { withTimezone: true, mode: 'string' }),
	lastFraudAlertSignature: text("last_fraud_alert_signature"),
});
