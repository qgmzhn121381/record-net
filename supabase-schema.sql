-- 新建表（首次部署）
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  birthday DATE,
  birthday_type TEXT DEFAULT 'solar',
  festival_notify BOOLEAN DEFAULT true,
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

CREATE TABLE IF NOT EXISTS birthday_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  birthday TEXT NOT NULL,
  birthday_type TEXT DEFAULT 'solar',
  relationship TEXT DEFAULT '朋友',
  remind_30 BOOLEAN DEFAULT false,
  remind_15 BOOLEAN DEFAULT false,
  remind_7 BOOLEAN DEFAULT true,
  remind_0 BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gift_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES birthday_cards(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  direction TEXT DEFAULT '我送TA',
  gift_name TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS anniversaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES birthday_cards(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  anniversary_date DATE NOT NULL,
  repeat_yearly BOOLEAN DEFAULT true,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_records_user_id ON records(user_id);
CREATE INDEX IF NOT EXISTS idx_birthday_cards_user_id ON birthday_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_records_card_id ON gift_records(card_id);
CREATE INDEX IF NOT EXISTS idx_anniversaries_card_id ON anniversaries(card_id);

-- 升级语句（已有表时运行）
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday_type TEXT DEFAULT 'solar';
ALTER TABLE users ADD COLUMN IF NOT EXISTS festival_notify BOOLEAN DEFAULT true;
ALTER TABLE records ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT '';
ALTER TABLE records ADD COLUMN IF NOT EXISTS notify_daily BOOLEAN DEFAULT false;
ALTER TABLE records ADD COLUMN IF NOT EXISTS notify_milestone BOOLEAN DEFAULT true;
