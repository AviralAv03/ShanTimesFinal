/**
 * Bill computation utilities for Shan Times Bill / Receipt Generator.
 * Ported from newspaper-bill-maker (TypeScript → plain JavaScript).
 *
 * @typedef {'intra' | 'inter'} TaxType
 *
 * @typedef {Object} LineItem
 * @property {string} id
 * @property {string} dateOfPublication
 * @property {string} particulars
 * @property {string} wordsSize
 * @property {string} totalSpace
 * @property {boolean} totalSpaceTouched
 * @property {string} rate
 * @property {string} amount
 * @property {boolean} amountTouched
 *
 * @typedef {Object} BillData
 * @property {string} billNo
 * @property {string} billDate
 * @property {string} to
 * @property {string} clientGst
 * @property {string} clientRef
 * @property {string} releaseOrderNo
 * @property {string} releaseOrderDate
 * @property {TaxType} taxType
 * @property {string} adCommissionPercent
 * @property {LineItem[]} items
 *
 * @typedef {Object} BillTotals
 * @property {number} subtotal
 * @property {number} adCommission
 * @property {number} netAmount
 * @property {number} igst
 * @property {number} cgst
 * @property {number} sgst
 * @property {number} grandTotal
 */

/**
 * Parse a numeric value from a string, stripping non-numeric characters.
 * @param {string} v
 * @returns {number}
 */
export const num = (v) => {
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return isFinite(n) ? n : 0;
};

/**
 * Parse dimensions like "4x10", "4 × 10 cm", "3*5*2" → product of all numbers.
 * Returns null when no usable dimension is found.
 * @param {string} s
 * @returns {number|null}
 */
export function parseDimensions(s) {
  if (!s) return null;
  const nums = s.match(/\d+(?:\.\d+)?/g);
  if (!nums || nums.length < 2) return null;
  // Only treat as dimensions when separated by x / × / *
  if (!/[x×*]/i.test(s)) return null;
  const product = nums.reduce((p, n) => p * parseFloat(n), 1);
  return Math.round(product * 100) / 100;
}

/**
 * Compute total space from a line item.
 * @param {LineItem} item
 * @returns {number}
 */
export function computeTotalSpace(item) {
  if (item.totalSpaceTouched) return num(item.totalSpace);
  const fromDims = parseDimensions(item.wordsSize);
  if (fromDims != null) return fromDims;
  return num(item.totalSpace);
}

/**
 * Compute amount from a line item (totalSpace × rate).
 * @param {LineItem} item
 * @returns {number}
 */
export function computeAmount(item) {
  if (item.amountTouched) return num(item.amount);
  const r = num(item.rate);
  const s = computeTotalSpace(item);
  if (r && s) return Math.round(r * s * 100) / 100;
  return num(item.amount);
}

/**
 * Compute all totals (subtotal, taxes, grand total) from bill data.
 * @param {BillData} data
 * @returns {BillTotals}
 */
export function computeTotals(data) {
  const subtotal = data.items.reduce((sum, it) => sum + computeAmount(it), 0);

  // Advertising commission (deducted before tax)
  const commPct = num(data.adCommissionPercent || '0');
  const adCommission = commPct > 0 ? round2(subtotal * commPct / 100) : 0;
  const netAmount = round2(subtotal - adCommission);

  let igst = 0;
  let cgst = 0;
  let sgst = 0;
  if (data.taxType === 'inter') {
    igst = netAmount * 0.05;
  } else {
    cgst = netAmount * 0.025;
    sgst = netAmount * 0.025;
  }
  const grandTotal = netAmount + igst + cgst + sgst;
  return {
    subtotal: round2(subtotal),
    adCommission: round2(adCommission),
    netAmount: round2(netAmount),
    igst: round2(igst),
    cgst: round2(cgst),
    sgst: round2(sgst),
    grandTotal: round2(grandTotal),
  };
}

/**
 * Round a number to 2 decimal places.
 * @param {number} n
 * @returns {number}
 */
export function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Format a number in Indian locale with 2 decimal places.
 * @param {number} n
 * @returns {string}
 */
export const formatINR = (n) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Create a new empty line item.
 * @returns {LineItem}
 */
export const newItem = () => ({
  id: Math.random().toString(36).slice(2),
  dateOfPublication: '',
  particulars: '',
  wordsSize: '',
  totalSpace: '',
  totalSpaceTouched: false,
  rate: '',
  amount: '',
  amountTouched: false,
});
