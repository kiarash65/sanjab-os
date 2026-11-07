/* نرمال‌سازی متن فارسی برای جستجو — حذف اعراب و کشیده، یکسان‌سازی ی/ک عربی */

const DIACRITICS = /[\u064B-\u065F\u0670\u0640\u06D6-\u06ED]/g

/** متن را برای مقایسهٔ جستجو آماده می‌کند: بی‌اعراب، ی/ک فارسی، حروف کوچک لاتین */
export function faNormalize(s: string): string {
  return s
    .replace(DIACRITICS, '')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/أ|إ|آ/g, 'ا')
    .toLowerCase()
    .trim()
}
