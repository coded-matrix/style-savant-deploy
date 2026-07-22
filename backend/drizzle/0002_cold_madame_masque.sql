CREATE TABLE "art_styles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"portrait" text NOT NULL,
	"bio" text NOT NULL,
	"location" text NOT NULL,
	"backdrops_count" integer DEFAULT 0 NOT NULL,
	"tagline" text,
	"followers_count" text,
	"original_works" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "backdrops" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"artist_id" text,
	"artist_name" text NOT NULL,
	"image" text NOT NULL,
	"premium" boolean DEFAULT false NOT NULL,
	"price_ghs" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "looks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"avatar" text NOT NULL,
	"image" text NOT NULL,
	"caption" text NOT NULL,
	"votes" integer DEFAULT 0 NOT NULL,
	"lead_product_id" text NOT NULL,
	"product_ids" text[] DEFAULT '{}' NOT NULL,
	"backdrop_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preset_models" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"thumb" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sizes" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "colors" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "delivery_info" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "return_policy" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "art_linked_artist_id" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sold_out" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stock_by_size" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "rating" numeric(3, 2) DEFAULT '4.5' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "community_look_ids" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "cover" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "products_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "looks_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "member_since" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "backdrops" ADD CONSTRAINT "backdrops_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE set null ON UPDATE no action;