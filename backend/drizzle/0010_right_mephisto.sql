ALTER TABLE "body_measurements" ADD COLUMN "bust_inches" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "body_measurements" ADD COLUMN "underbust_inches" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "body_measurements" ADD COLUMN "shoulder_width_inches" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "body_measurements" ADD COLUMN "neck_inches" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "body_measurements" ADD COLUMN "bicep_inches" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "body_measurements" ADD COLUMN "wrist_inches" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "body_measurements" ADD COLUMN "back_length_inches" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "body_measurements" ADD COLUMN "thigh_inches" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "body_measurements" ADD COLUMN "knee_inches" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "body_measurements" ADD COLUMN "calf_inches" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "body_measurements" ADD COLUMN "outseam_inches" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "body_measurements" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "body_measurements" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "body_measurements" ADD CONSTRAINT "body_measurements_user_id_unique" UNIQUE("user_id");