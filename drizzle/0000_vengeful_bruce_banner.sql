CREATE TYPE "public"."account_type" AS ENUM('CASH', 'BANK', 'MFS');--> statement-breakpoint
CREATE TYPE "public"."budget_item_type" AS ENUM('INCOME', 'SPENDING', 'SAVINGS');--> statement-breakpoint
CREATE TYPE "public"."flow_type" AS ENUM('INCOME', 'EXPENSE', 'BORROWING', 'DEBT_PAYMENT', 'TRANSFER_IN', 'TRANSFER_OUT', 'UNTRACKED_IN', 'UNTRACKED_OUT', 'SAVINGS_DEPOSIT', 'SAVINGS_WITHDRAWAL');--> statement-breakpoint
CREATE TABLE "account_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"transfer_date" date NOT NULL,
	"from_account_id" uuid NOT NULL,
	"to_account_id" uuid NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"fee_amount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_transfer_amount_pos" CHECK ("account_transfers"."amount" > 0),
	CONSTRAINT "chk_diff_accounts" CHECK ("account_transfers"."from_account_id" <> "account_transfers"."to_account_id")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "account_type" NOT NULL,
	"opening_balance" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_user_name_idx" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "budget_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "budget_groups_user_name_idx" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"flow_type" "flow_type" NOT NULL,
	"budget_group_id" uuid,
	"default_savings_fund_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_user_name_idx" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "monthly_budget_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"budget_month" date NOT NULL,
	"item_type" "budget_item_type" NOT NULL,
	"category_id" uuid,
	"budget_group_id" uuid,
	"savings_fund_id" uuid,
	"planned_amount" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "monthly_budget_items_unique_target" UNIQUE NULLS NOT DISTINCT("user_id","budget_month","item_type","category_id","budget_group_id","savings_fund_id"),
	CONSTRAINT "chk_planned_amount_non_neg" CHECK ("monthly_budget_items"."planned_amount" >= 0),
	CONSTRAINT "chk_budget_target" CHECK ((
        ("monthly_budget_items"."item_type" = 'INCOME' AND "monthly_budget_items"."category_id" IS NOT NULL AND "monthly_budget_items"."budget_group_id" IS NULL AND "monthly_budget_items"."savings_fund_id" IS NULL) OR
        ("monthly_budget_items"."item_type" = 'SPENDING' AND "monthly_budget_items"."budget_group_id" IS NOT NULL AND "monthly_budget_items"."category_id" IS NULL AND "monthly_budget_items"."savings_fund_id" IS NULL) OR
        ("monthly_budget_items"."item_type" = 'SAVINGS' AND "monthly_budget_items"."savings_fund_id" IS NOT NULL AND "monthly_budget_items"."category_id" IS NULL AND "monthly_budget_items"."budget_group_id" IS NULL)
      ))
);
--> statement-breakpoint
CREATE TABLE "savings_funds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"opening_balance" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"target_amount" numeric(14, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "savings_funds_user_name_idx" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_sequence" serial NOT NULL,
	"user_id" uuid NOT NULL,
	"transaction_date" date NOT NULL,
	"category_id" uuid NOT NULL,
	"account_id" uuid,
	"savings_fund_id" uuid,
	"amount" numeric(14, 2) NOT NULL,
	"description" text,
	"legacy_category" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_transaction_amount_pos" CHECK ("transactions"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"currency_code" char(3) DEFAULT 'BDT' NOT NULL,
	"currency_symbol" text DEFAULT 'Tk' NOT NULL,
	"opening_cash_balance" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"opening_savings_balance" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "account_transfers" ADD CONSTRAINT "account_transfers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_transfers" ADD CONSTRAINT "account_transfers_from_account_id_accounts_id_fk" FOREIGN KEY ("from_account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_transfers" ADD CONSTRAINT "account_transfers_to_account_id_accounts_id_fk" FOREIGN KEY ("to_account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_groups" ADD CONSTRAINT "budget_groups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_budget_group_id_budget_groups_id_fk" FOREIGN KEY ("budget_group_id") REFERENCES "public"."budget_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_default_savings_fund_id_savings_funds_id_fk" FOREIGN KEY ("default_savings_fund_id") REFERENCES "public"."savings_funds"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_budget_items" ADD CONSTRAINT "monthly_budget_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_budget_items" ADD CONSTRAINT "monthly_budget_items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_budget_items" ADD CONSTRAINT "monthly_budget_items_budget_group_id_budget_groups_id_fk" FOREIGN KEY ("budget_group_id") REFERENCES "public"."budget_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_budget_items" ADD CONSTRAINT "monthly_budget_items_savings_fund_id_savings_funds_id_fk" FOREIGN KEY ("savings_fund_id") REFERENCES "public"."savings_funds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_funds" ADD CONSTRAINT "savings_funds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_savings_fund_id_savings_funds_id_fk" FOREIGN KEY ("savings_fund_id") REFERENCES "public"."savings_funds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_transfers_user_date" ON "account_transfers" USING btree ("user_id","transfer_date");--> statement-breakpoint
CREATE INDEX "idx_budget_user_month" ON "monthly_budget_items" USING btree ("user_id","budget_month");--> statement-breakpoint
CREATE INDEX "idx_transactions_user_date" ON "transactions" USING btree ("user_id","transaction_date","entry_sequence");--> statement-breakpoint
CREATE INDEX "idx_transactions_category" ON "transactions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_account" ON "transactions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_savings_fund" ON "transactions" USING btree ("savings_fund_id");