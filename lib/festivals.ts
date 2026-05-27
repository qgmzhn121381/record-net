import { lunarToSolar } from './lunar';

export interface Festival {
  name: string;
  emoji: string;
  greeting: string;
  month: number;
  day: number;
  type: 'solar' | 'lunar';
}

// Solar (Gregorian) festivals
const SOLAR_FESTIVALS: Festival[] = [
  { name: '元旦', emoji: '🎊', greeting: '新年快乐，万事如意！', month: 1, day: 1, type: 'solar' },
  { name: '情人节', emoji: '💕', greeting: '愿有情人终成眷属！', month: 2, day: 14, type: 'solar' },
  { name: '妇女节', emoji: '🌸', greeting: '愿你美丽如花，幸福每一天！', month: 3, day: 8, type: 'solar' },
  { name: '愚人节', emoji: '🤡', greeting: '愚人节快乐，愿你天天好心情！', month: 4, day: 1, type: 'solar' },
  { name: '劳动节', emoji: '⚒️', greeting: '劳动最光荣，辛苦啦！', month: 5, day: 1, type: 'solar' },
  { name: '520', emoji: '💗', greeting: '我爱你，不止今天！', month: 5, day: 20, type: 'solar' },
  { name: '儿童节', emoji: '🎈', greeting: '愿你永远保持童心！', month: 6, day: 1, type: 'solar' },
  { name: '建党节', emoji: '🏛️', greeting: '不忘初心，牢记使命！', month: 7, day: 1, type: 'solar' },
  { name: '建军节', emoji: '🎖️', greeting: '向军人致敬！', month: 8, day: 1, type: 'solar' },
  { name: '教师节', emoji: '📚', greeting: '师恩难忘，祝老师节日快乐！', month: 9, day: 10, type: 'solar' },
  { name: '国庆节', emoji: '🇨🇳', greeting: '祖国生日快乐，繁荣昌盛！', month: 10, day: 1, type: 'solar' },
  { name: '万圣节', emoji: '🎃', greeting: 'Trick or Treat！', month: 10, day: 31, type: 'solar' },
  { name: '双十一', emoji: '🛒', greeting: '今天也要开心购物呀！', month: 11, day: 11, type: 'solar' },
  { name: '平安夜', emoji: '🍎', greeting: '平平安安，岁岁年年！', month: 12, day: 24, type: 'solar' },
  { name: '圣诞节', emoji: '🎄', greeting: 'Merry Christmas！', month: 12, day: 25, type: 'solar' },
];

// Lunar festivals (stored as lunar month/day)
const LUNAR_FESTIVALS: { name: string; emoji: string; greeting: string; lunarMonth: number; lunarDay: number }[] = [
  { name: '春节', emoji: '🧧', greeting: '新春快乐，恭喜发财！', lunarMonth: 1, lunarDay: 1 },
  { name: '元宵节', emoji: '🏮', greeting: '元宵节快乐，团团圆圆！', lunarMonth: 1, lunarDay: 15 },
  { name: '龙抬头', emoji: '🐲', greeting: '龙抬头，好兆头！', lunarMonth: 2, lunarDay: 2 },
  { name: '端午节', emoji: '🐲', greeting: '端午安康，粽香情浓！', lunarMonth: 5, lunarDay: 5 },
  { name: '七夕节', emoji: '🌙', greeting: '七夕快乐，愿天下有情人终成眷属！', lunarMonth: 7, lunarDay: 7 },
  { name: '中元节', emoji: '🕯️', greeting: '中元节安康！', lunarMonth: 7, lunarDay: 15 },
  { name: '中秋节', emoji: '🌕', greeting: '中秋快乐，阖家团圆！', lunarMonth: 8, lunarDay: 15 },
  { name: '重阳节', emoji: '🏔️', greeting: '重阳登高，健康长寿！', lunarMonth: 9, lunarDay: 9 },
  { name: '腊八节', emoji: '🍚', greeting: '腊八节快乐，喝碗腊八粥！', lunarMonth: 12, lunarDay: 8 },
  { name: '除夕', emoji: '🎆', greeting: '除夕快乐，辞旧迎新！', lunarMonth: 12, lunarDay: 30 },
];

// Get upcoming festivals (today and next 3 days)
export function getUpcomingFestivals(): Festival[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const results: Festival[] = [];

  // Check solar festivals
  for (let offset = 0; offset <= 3; offset++) {
    const checkDate = new Date(today.getTime() + offset * 86400000);
    const m = checkDate.getMonth() + 1;
    const d = checkDate.getDate();

    for (const f of SOLAR_FESTIVALS) {
      if (f.month === m && f.day === d) {
        results.push(f);
        break;
      }
    }
  }

  // Check lunar festivals
  for (let offset = 0; offset <= 3; offset++) {
    const checkDate = new Date(today.getTime() + offset * 86400000);
    for (const f of LUNAR_FESTIVALS) {
      try {
        const solar = lunarToSolar(checkDate.getFullYear(), f.lunarMonth, f.lunarDay);
        if (solar.month === checkDate.getMonth() + 1 && solar.day === checkDate.getDate()) {
          results.push({
            name: f.name,
            emoji: f.emoji,
            greeting: f.greeting,
            month: solar.month,
            day: solar.day,
            type: 'lunar',
          });
          break;
        }
      } catch { /* skip invalid dates */ }
    }
  }

  return results;
}

export function isFestivalToday(): boolean {
  return getUpcomingFestivals().some((f) => {
    const today = new Date();
    return f.month === today.getMonth() + 1 && f.day === today.getDate();
  });
}
