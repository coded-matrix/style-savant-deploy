CREATE TYPE "public"."payment_purpose" AS ENUM('subscription', 'tokens');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed');--> statement-breakpoint
CREATE TYPE "public"."video_request_status" AS ENUM('pending', 'accepted', 'in_progress', 'delivered', 'rejected');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"purpose" "payment_purpose" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"tokens_granted" integer DEFAULT 0 NOT NULL,
	"client_reference" text NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"checkout_url" text,
	"hubtel_transaction_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_client_reference_unique" UNIQUE("client_reference")
);
--> statement-breakpoint
CREATE TABLE "video_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"product_id" uuid,
	"brief" text NOT NULL,
	"reference_image_url" text,
	"status" "video_request_status" DEFAULT 'pending' NOT NULL,
	"video_url" text,
	"vendor_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "trial_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "current_period_end" timestamp;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_requests" ADD CONSTRAINT "video_requests_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_requests" ADD CONSTRAINT "video_requests_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_requests" ADD CONSTRAINT "video_requests_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;