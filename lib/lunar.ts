// Lunar calendar data for 1900-2100
// Each entry: number of days in each month + leap month info
// Encoded as a 16-bit number: bits 0-12 = month days (1=30, 0=29), bits 13-15 = leap month (0 if none)
const LUNAR_DATA = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
  0x0d520
];

function lYearDays(y: number): number {
  let sum = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (LUNAR_DATA[y - 1900] & i) ? 1 : 0;
  }
  return sum + leapDays(y);
}

function leapMonth(y: number): number {
  return LUNAR_DATA[y - 1900] & 0xf;
}

function leapDays(y: number): number {
  if (leapMonth(y)) {
    return (LUNAR_DATA[y - 1900] & 0x10000) ? 30 : 29;
  }
  return 0;
}

function monthDays(y: number, m: number): number {
  return (LUNAR_DATA[y - 1900] & (0x10000 >> m)) ? 30 : 29;
}

export function solarToLunar(year: number, month: number, day: number): { year: number; month: number; day: number; isLeap: boolean } {
  let between = Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(1900, 0, 31)) / 86400000);
  let lunarYear = 1900;
  let temp = 0;

  for (lunarYear = 1900; lunarYear < 2101 && between > 0; lunarYear++) {
    temp = lYearDays(lunarYear);
    between -= temp;
  }

  if (between < 0) {
    between += temp;
    lunarYear--;
  }

  const leap = leapMonth(lunarYear);
  let isLeap = false;
  let lunarMonth = 1;

  for (lunarMonth = 1; lunarMonth < 13 && between > 0; lunarMonth++) {
    if (leap > 0 && lunarMonth === (leap + 1) && !isLeap) {
      --lunarMonth;
      isLeap = true;
      temp = leapDays(lunarYear);
    } else {
      temp = monthDays(lunarYear, lunarMonth);
    }

    if (isLeap && lunarMonth === (leap + 1)) {
      isLeap = false;
    }

    between -= temp;
  }

  if (between === 0 && leap > 0 && lunarMonth === leap + 1) {
    if (isLeap) {
      isLeap = false;
    } else {
      isLeap = true;
      --lunarMonth;
    }
  }

  if (between < 0) {
    between += temp;
    --lunarMonth;
  }

  const lunarDay = between + 1;
  return { year: lunarYear, month: lunarMonth, day: lunarDay, isLeap };
}

export function lunarToSolar(year: number, month: number, day: number, isLeap = false): { year: number; month: number; day: number } {
  let days = 0;

  // Add days for each year before this one
  for (let y = 1900; y < year; y++) {
    days += lYearDays(y);
  }

  const leap = leapMonth(year);
  let m = 1;
  for (m = 1; m < month; m++) {
    days += monthDays(year, m);
    if (m === leap) {
      days += leapDays(year);
    }
  }

  // If the target month has a leap month before it and we're in the leap month
  if (isLeap && leap === month) {
    days += monthDays(year, month);
  }

  days += day - 1;

  const baseDate = new Date(1900, 0, 31);
  const result = new Date(baseDate.getTime() + days * 86400000);
  return { year: result.getFullYear(), month: result.getMonth() + 1, day: result.getDate() };
}

// Check if today is someone's lunar birthday
export function isLunarBirthdayToday(lunarMonth: number, lunarDay: number): boolean {
  const today = new Date();
  const lunar = solarToLunar(today.getFullYear(), today.getMonth() + 1, today.getDate());
  return lunar.month === lunarMonth && lunar.day === lunarDay;
}

// Check if today is someone's solar birthday
export function isSolarBirthdayToday(solarMonth: number, solarDay: number): boolean {
  const today = new Date();
  return today.getMonth() + 1 === solarMonth && today.getDate() === solarDay;
}

// Get next birthday date (solar) for countdown
export function getNextBirthday(birthdayStr: string, birthdayType: string): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bd = new Date(birthdayStr);

  if (birthdayType === 'lunar') {
    // Convert lunar birthday to this year's solar date
    const thisYearSolar = lunarToSolar(today.getFullYear(), bd.getMonth() + 1, bd.getDate());
    let nextDate = new Date(thisYearSolar.year, thisYearSolar.month - 1, thisYearSolar.day);
    if (nextDate < today) {
      const nextYearSolar = lunarToSolar(today.getFullYear() + 1, bd.getMonth() + 1, bd.getDate());
      nextDate = new Date(nextYearSolar.year, nextYearSolar.month - 1, nextYearSolar.day);
    }
    return nextDate;
  } else {
    let nextDate = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
    if (nextDate < today) {
      nextDate = new Date(today.getFullYear() + 1, bd.getMonth(), bd.getDate());
    }
    return nextDate;
  }
}

// Get days until next birthday
export function getDaysUntilBirthday(birthdayStr: string, birthdayType: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = getNextBirthday(birthdayStr, birthdayType);
  return Math.ceil((next.getTime() - today.getTime()) / 86400000);
}

// Parse birthday string to get month and day for checking
export function getBirthdayMonthDay(birthdayStr: string, birthdayType: string, forYear?: number): { month: number; day: number } {
  const bd = new Date(birthdayStr);
  if (birthdayType === 'solar') {
    return { month: bd.getMonth() + 1, day: bd.getDate() };
  }
  // For lunar, convert to solar for the given year
  const year = forYear || new Date().getFullYear();
  const solar = lunarToSolar(year, bd.getMonth() + 1, bd.getDate());
  return { month: solar.month, day: solar.day };
}

// Check if a solar date matches a lunar birthday
export function checkLunarBirthdayMatch(lunarMonth: number, lunarDay: number, checkDate: Date): boolean {
  const lunar = solarToLunar(checkDate.getFullYear(), checkDate.getMonth() + 1, checkDate.getDate());
  return lunar.month === lunarMonth && lunar.day === lunarDay;
}

export function getChineseZodiac(year: number): string {
  const zodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
  return zodiacs[(year - 1900) % 12];
}
