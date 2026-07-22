ALTER TYPE "public"."order_status" ADD VALUE 'confirmed';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'packed';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'shipped';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'delivered';--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" uuid NOT NULL,
	"title" text NOT NULL,
	"caption" text NOT NULL,
	"hashtags" text[] DEFAULT '{}' NOT NULL,
	"image" text NOT NULL,
	"products" text[] DEFAULT '{}' NOT NULL,
	"prompt" text NOT NULL,
	"market" text NOT NULL,
	"format" text NOT NULL,
	"tokens" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sku" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "instagram" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "tiktok" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "shipping_policy" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "tags" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;