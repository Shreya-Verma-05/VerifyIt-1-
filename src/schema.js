const { pgTable, text, timestamp, boolean, integer } = require('drizzle-orm/pg-core');

const subscribers = pgTable('subscribers', {
  email: text('email').primaryKey(),
  subscribedAt: timestamp('subscribed_at', { withTimezone: true }).notNull().defaultNow(),
  active: boolean('active').notNull().default(true),
  alertsReceived: integer('alerts_received').notNull().default(0),
});

const alertState = pgTable('alert_state', {
  id: integer('id').primaryKey(),
  lastFraudAlertAt: timestamp('last_fraud_alert_at', { withTimezone: true }),
  lastFraudAlertSignature: text('last_fraud_alert_signature'),
});

module.exports = {
  subscribers,
  alertState,
};