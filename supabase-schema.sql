-- 新建表（首次部署）
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  birthday DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TEXT,
  category TEXT DEFAULT '其他',
  mood TEXT DEFAULT '😊',
  weather TEXT DEFAULT '☀️',
  note TEXT,
  tags TEXT DEFAULT '',
  future_letter TEXT,
  future_letter_date DATE,
  is_pinned BOOLEAN DEFAULT false,
  notify_daily BOOLEAN DEFAULT false,
  notify_milestone BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_records_user_id ON records(user_id);

-- 升级语句（已有表时运行）
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE records ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT '';
ALTER TABLE records ADD COLUMN IF NOT EXISTS notify_daily BOOLEAN DEFAULT false;
ALTER TABLE records ADD COLUMN IF NOT EXISTS notify_milestone BOOLEAN DEFAULT true;
