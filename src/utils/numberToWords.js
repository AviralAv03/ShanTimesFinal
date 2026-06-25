/**
 * Convert a number into Indian-system words (Rupees / Paise).
 * Ported from newspaper-bill-maker (TypeScript → plain JavaScript).
 */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

function twoDigits(n) {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return TENS[t] + (o ? ' ' + ONES[o] : '');
}

function threeDigits(n) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  let str = '';
  if (h) str += ONES[h] + ' Hundred';
  if (rest) str += (h ? ' ' : '') + twoDigits(rest);
  return str;
}

/**
 * Convert an integer to Indian-system words (crore, lakh, thousand).
 * @param {number} num
 * @returns {string}
 */
function integerToWords(num) {
  if (num === 0) return 'Zero';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundreds = num;

  const parts = [];
  if (crore) parts.push(twoDigits(crore) + ' Crore');
  if (lakh) parts.push(twoDigits(lakh) + ' Lakh');
  if (thousand) parts.push(twoDigits(thousand) + ' Thousand');
  if (hundreds) parts.push(threeDigits(hundreds));

  return parts.join(' ').trim();
}

/**
 * Convert a rupee amount to words in Indian format.
 * @param {number} amount
 * @returns {string}
 */
export function rupeesInWords(amount) {
  if (!isFinite(amount) || amount <= 0) return '';
  const rounded = Math.round(amount * 100) / 100;
  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);

  let result = 'Rupees ' + integerToWords(rupees);
  if (paise > 0) {
    result += ' and ' + twoDigits(paise) + ' Paise';
  }
  return result + ' Only';
}
