-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.backup_history (
  backup_id integer NOT NULL DEFAULT nextval('backup_history_backup_id_seq'::regclass),
  backup_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  backup_file_path character varying,
  backup_status character varying,
  backup_size numeric,
  backup_type character varying,
  user_id integer,
  comments text,
  CONSTRAINT backup_history_pkey PRIMARY KEY (backup_id)
);
CREATE TABLE public.backup_schedule (
  id integer NOT NULL DEFAULT nextval('backup_schedule_id_seq'::regclass),
  user_id integer,
  frequency character varying,
  day_of_week text,
  day_of_month text,
  time_of_day character varying,
  CONSTRAINT backup_schedule_pkey PRIMARY KEY (id)
);
CREATE TABLE public.custom_holidays (
  id integer NOT NULL DEFAULT nextval('custom_holidays_id_seq'::regclass),
  date character varying,
  name character varying,
  description character varying,
  CONSTRAINT custom_holidays_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ingredients (
  ingredient_id double precision,
  ingredient_name text,
  description text,
  unit_of_measure text,
  created_at text,
  updated_at text,
  is_gating boolean
);
CREATE TABLE public.inventory (
  item_id bigint NOT NULL,
  item_name character varying,
  batch_date character varying,
  category character varying,
  stock_status character varying,
  stock_quantity double precision,
  expiration_date character varying,
  created_at character varying,
  updated_at character varying,
  unit_price numeric,
  CONSTRAINT inventory_pkey PRIMARY KEY (item_id)
);
CREATE TABLE public.inventory_log (
  log_id double precision,
  item_id bigint,
  remaining_stock bigint,
  action_date text,
  user_id bigint,
  status text,
  wastage bigint,
  item_name text,
  batch_date text,
  expiration text
);
CREATE TABLE public.inventory_settings (
  id integer NOT NULL DEFAULT nextval('inventory_settings_id_seq'::regclass),
  name character varying,
  default_unit character varying,
  low_stock_threshold character varying,
  category character varying,
  created_at character varying,
  updated_at character varying,
  CONSTRAINT inventory_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.inventory_spoilage (
  spoilage_id integer NOT NULL DEFAULT nextval('inventory_spoilage_spoilage_id_seq'::regclass),
  item_id text,
  item_name character varying,
  quantity_spoiled double precision,
  spoilage_date character varying,
  reason character varying,
  user_id integer,
  created_at character varying,
  updated_at character varying,
  batch_date character varying,
  expiration_date character varying,
  category character varying,
  unit_price numeric,
  CONSTRAINT inventory_spoilage_pkey PRIMARY KEY (spoilage_id)
);
CREATE TABLE public.inventory_surplus (
  item_id bigint NOT NULL,
  item_name text,
  batch_date character varying NOT NULL,
  category text,
  stock_status text,
  stock_quantity double precision,
  expiration_date text,
  created_at text,
  updated_at text,
  unit_price numeric,
  CONSTRAINT inventory_surplus_pkey PRIMARY KEY (item_id, batch_date)
);
CREATE TABLE public.inventory_today (
  item_name text,
  batch_date character varying NOT NULL,
  category text,
  stock_status text,
  stock_quantity double precision,
  expiration_date text,
  created_at text,
  updated_at text,
  item_id bigint NOT NULL,
  unit_price numeric,
  CONSTRAINT inventory_today_pkey PRIMARY KEY (item_id, batch_date)
);
CREATE TABLE public.menu (
  dish_name character varying,
  image_url character varying,
  category character varying,
  price double precision,
  stock_status character varying,
  created_at character varying,
  updated_at character varying,
  description character varying,
  menu_id integer NOT NULL DEFAULT nextval('menu_menu_id_seq'::regclass),
  portions_left text,
  CONSTRAINT menu_pkey PRIMARY KEY (menu_id)
);
CREATE TABLE public.menu_ingredients (
  menu_id bigint,
  ingredient_id bigint,
  quantity double precision,
  ingredient_name text,
  measurements text
);
CREATE TABLE public.notification (
  user_id bigint,
  type text,
  message text,
  status text,
  created_at text,
  details text,
  id bigint
);
CREATE TABLE public.notification_settings (
  user_id integer NOT NULL DEFAULT nextval('notification_settings_user_id_seq'::regclass),
  low_stock_enabled character varying,
  low_stock_method character varying,
  expiration_enabled character varying,
  expiration_days character varying,
  expiration_method character varying,
  CONSTRAINT notification_settings_pkey PRIMARY KEY (user_id)
);
CREATE TABLE public.order_items (
  order_item_id bigint,
  order_id bigint,
  quantity bigint,
  price double precision,
  subtotal double precision,
  item_name text,
  unit_price double precision,
  total_price double precision,
  created_at text,
  category text
);
CREATE TABLE public.orders (
  total_amount double precision,
  order_status character varying,
  order_date character varying,
  payment_status character varying,
  payment_method character varying,
  created_at character varying,
  updated_at character varying,
  gcashreference text,
  notes text,
  customer_name character varying,
  order_type character varying,
  subtotal double precision,
  discount double precision,
  vat double precision,
  payment_reference character varying,
  amount_received double precision,
  change_amount double precision,
  customer_notes character varying,
  receipt_email text,
  discount_type text,
  discount_value text,
  discount_reason text,
  discount_id_number text,
  order_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  CONSTRAINT orders_pkey PRIMARY KEY (order_id)
);
CREATE TABLE public.suppliers (
  supplier_id integer NOT NULL DEFAULT nextval('suppliers_supplier_id_seq'::regclass),
  supplier_name character varying,
  contact_person character varying,
  phone_number character varying,
  email character varying,
  created_at character varying,
  address character varying,
  updated_at character varying,
  supplies character varying,
  CONSTRAINT suppliers_pkey PRIMARY KEY (supplier_id)
);
CREATE TABLE public.top_sales (
  trend_id integer NOT NULL DEFAULT nextval('food_trends_trend_id_seq'::regclass),
  trend_name character varying NOT NULL,
  trend_description text,
  trend_type character varying,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT top_sales_pkey PRIMARY KEY (trend_id)
);
CREATE TABLE public.user_activity_log (
  user_id integer,
  action_type character varying,
  description character varying,
  activity_date character varying,
  report_date character varying,
  user_name character varying,
  role character varying,
  activity_id integer NOT NULL DEFAULT nextval('user_activity_log_activity_id_seq'::regclass),
  CONSTRAINT user_activity_log_pkey PRIMARY KEY (activity_id)
);
CREATE TABLE public.users (
  user_id integer NOT NULL DEFAULT nextval('users_user_id_seq'::regclass),
  name character varying,
  username character varying,
  user_role character varying,
  status character varying,
  last_login character varying,
  created_at character varying,
  updated_at character varying,
  email character varying,
  auth_id character varying,
  CONSTRAINT users_pkey PRIMARY KEY (user_id)
);