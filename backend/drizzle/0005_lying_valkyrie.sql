CREATE TYPE "public"."notification_category" AS ENUM('orders', 'stock', 'tokens', 'payouts', 'system');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"category" "notification_category" NOT NULL,
	"text" text NOT NULL,
	"link" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cloth_images" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "tryon_gallery" ADD COLUMN "fit_photo_hash" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;