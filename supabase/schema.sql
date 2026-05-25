-- Supabase PostgreSQL schema for legaltypingtest.online
-- Run in Supabase SQL Editor after rotating all exposed keys.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'student' check (role in ('student', 'admin')),
  subscription_status text not null default 'free' check (subscription_status in ('free', 'active', 'blocked')),
  subscription_type text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists exams (
  id bigserial primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists pdfs (
  id bigserial primary key,
  exam_id bigint references exams(id) on delete cascade,
  title text not null,
  storage_path text not null,
  original_filename text,
  file_size bigint,
  upload_date timestamptz not null default now()
);

create table if not exists passages (
  id bigserial primary key,
  pdf_id bigint references pdfs(id) on delete cascade,
  exam_id bigint references exams(id) on delete cascade,
  passage_number integer not null,
  title text,
  content text not null,
  is_free boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists test_results (
  id bigserial primary key,
  user_id uuid references users(id) on delete set null,
  exam_id bigint references exams(id) on delete set null,
  pdf_id bigint references pdfs(id) on delete set null,
  passage_id bigint references passages(id) on delete set null,
  typed_text text,
  original_text text,
  highlighted_original text,
  highlighted_typed text,
  duration_seconds integer,
  duration_formatted text,
  keystrokes integer,
  backspaces integer,
  total_words_typed numeric,
  gross_wpm numeric,
  net_wpm numeric,
  accuracy numeric,
  error_percentage numeric,
  additions integer,
  omissions integer,
  spelling_substitution_repetition integer,
  incomplete_words integer,
  spacing_errors integer,
  capitalization_errors integer,
  punctuation_errors integer,
  transposition_errors integer,
  paragraphic_errors integer,
  tab_errors integer,
  full_errors integer,
  half_errors integer,
  total_errors numeric,
  marks numeric,
  qualified boolean,
  created_at timestamptz not null default now()
);

create table if not exists coupons (
  id bigserial primary key,
  code text not null unique,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric not null,
  usage_limit integer,
  used_count integer not null default 0,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id bigserial primary key,
  user_id uuid references users(id) on delete set null,
  coupon_id bigint references coupons(id) on delete set null,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  amount integer not null,
  currency text not null default 'INR',
  status text not null default 'created',
  created_at timestamptz not null default now()
);

create table if not exists free_attempts (
  id bigserial primary key,
  passage_id bigint references passages(id) on delete cascade,
  anonymous_id text,
  user_id uuid references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists admin_actions (
  id bigserial primary key,
  admin_user_id uuid references users(id) on delete set null,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

insert into exams (name)
select 'Bombay High Court Clerk Typing'
where not exists (select 1 from exams where name = 'Bombay High Court Clerk Typing');

create index if not exists idx_passages_pdf_id on passages(pdf_id);
create index if not exists idx_results_user_id on test_results(user_id);
create index if not exists idx_payments_user_id on payments(user_id);
create index if not exists idx_free_attempts_user_id on free_attempts(user_id);
