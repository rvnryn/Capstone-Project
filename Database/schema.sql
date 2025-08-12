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
  CONSTRAINT backup_history_pkey PRIMARY KEY (backup_id),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.food_trend_ingredients (
  trend_id integer NOT NULL,
  ingredient_id integer NOT NULL,
  CONSTRAINT food_trend_ingredients_pkey PRIMARY KEY (trend_id, ingredient_id),
  CONSTRAINT fk_trend_id FOREIGN KEY (trend_id) REFERENCES public.food_trends(trend_id),
  CONSTRAINT fk_ingredient_id FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(ingredient_id)
);
CREATE TABLE public.food_trend_menu (
  trend_id integer NOT NULL,
  menu_id integer NOT NULL,
  CONSTRAINT food_trend_menu_pkey PRIMARY KEY (trend_id, menu_id),
  CONSTRAINT fk_menu_id FOREIGN KEY (menu_id) REFERENCES public.menu(menu_id),
  CONSTRAINT fk_trend_menu FOREIGN KEY (trend_id) REFERENCES public.food_trends(trend_id)
);
CREATE TABLE public.food_trends (
  trend_id integer NOT NULL DEFAULT nextval('food_trends_trend_id_seq'::regclass),
  trend_name character varying NOT NULL,
  trend_description text,
  trend_type character varying,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT food_trends_pkey PRIMARY KEY (trend_id)
);
CREATE TABLE public.ingredients (
  ingredient_id integer NOT NULL DEFAULT nextval('ingredients_ingredient_id_seq'::regclass),
  ingredient_name character varying NOT NULL,
  description text,
  unit_of_measure character varying,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ingredients_pkey PRIMARY KEY (ingredient_id)
);
CREATE TABLE public.inventory (
  item_id integer NOT NULL DEFAULT nextval('inventory_item_id_seq'::regclass),
  item_name character varying NOT NULL,
  batch_date date,
  category character varying NOT NULL,
  stock_status character varying DEFAULT 'Normal'::character varying,
  stock_quantity numeric DEFAULT 0,
  expiration_date date,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT inventory_pkey PRIMARY KEY (item_id)
);
CREATE TABLE public.inventory_log (
  log_id integer NOT NULL DEFAULT nextval('inventory_log_log_id_seq'::regclass),
  item_id integer,
  action_type character varying,
  action_quantity numeric,
  remaining_stock numeric,
  action_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  user_id integer,
  CONSTRAINT inventory_log_pkey PRIMARY KEY (log_id),
  CONSTRAINT fk_user_id_log FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT fk_item_id FOREIGN KEY (item_id) REFERENCES public.inventory(item_id)
);
CREATE TABLE public.menu (
  menu_id integer NOT NULL DEFAULT nextval('menu_menu_id_seq'::regclass),
  dish_name character varying NOT NULL,
  image_url character varying,
  category character varying,
  price numeric,
  stock_status character varying DEFAULT 'Normal'::character varying,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT menu_pkey PRIMARY KEY (menu_id)
);
CREATE TABLE public.menu_ingredients (
  menu_id integer NOT NULL,
  ingredient_id integer NOT NULL,
  quantity numeric,
  CONSTRAINT menu_ingredients_pkey PRIMARY KEY (menu_id, ingredient_id),
  CONSTRAINT fk_menu_ingredient FOREIGN KEY (menu_id) REFERENCES public.menu(menu_id),
  CONSTRAINT fk_ingredient_menu FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(ingredient_id)
);
CREATE TABLE public.order_items (
  order_item_id integer NOT NULL DEFAULT nextval('order_items_order_item_id_seq'::regclass),
  order_id integer,
  menu_id integer,
  quantity integer NOT NULL,
  price numeric NOT NULL,
  subtotal numeric DEFAULT ((quantity)::numeric * price),
  CONSTRAINT order_items_pkey PRIMARY KEY (order_item_id),
  CONSTRAINT fk_menu_item FOREIGN KEY (menu_id) REFERENCES public.menu(menu_id),
  CONSTRAINT fk_order_id FOREIGN KEY (order_id) REFERENCES public.orders(order_id)
);
CREATE TABLE public.orders (
  order_id integer NOT NULL DEFAULT nextval('orders_order_id_seq'::regclass),
  user_id integer,
  total_amount numeric,
  order_status character varying DEFAULT 'Pending'::character varying,
  order_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  payment_status character varying DEFAULT 'Unpaid'::character varying,
  payment_method character varying DEFAULT 'Cash'::character varying,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT orders_pkey PRIMARY KEY (order_id),
  CONSTRAINT fk_user_order FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.suppliers (
  supplier_id integer NOT NULL DEFAULT nextval('suppliers_supplier_id_seq'::regclass),
  supplier_name character varying NOT NULL,
  contact_person character varying,
  phone_number character varying,
  email character varying,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT suppliers_pkey PRIMARY KEY (supplier_id)
);
CREATE TABLE public.user_activity_log (
  activity_id integer NOT NULL DEFAULT nextval('user_activity_log_activity_id_seq'::regclass),
  user_id integer,
  action_type character varying,
  description text,
  activity_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_activity_log_pkey PRIMARY KEY (activity_id),
  CONSTRAINT fk_user_activity FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.users (
  user_id integer NOT NULL DEFAULT nextval('users_user_id_seq'::regclass),
  name character varying NOT NULL,
  username character varying NOT NULL UNIQUE,
  password character varying NOT NULL,
  user_role character varying NOT NULL,
  status character varying DEFAULT 'Active'::character varying,
  last_login timestamp with time zone,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_pkey PRIMARY KEY (user_id)
);