CREATE TABLE "subscribers" (
	"email" text PRIMARY KEY NOT NULL,
	"subscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"alerts_received" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_state" (
	"id" integer PRIMARY KEY NOT NULL,
	"last_fraud_alert_at" timestamp with time zone,
	"last_fraud_alert_signature" text
);
