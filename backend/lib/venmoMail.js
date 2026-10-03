const ORDER_ID_PATTERN = /\bGF-[0-9A-Z]{6}\b/i;
const AMOUNT_PATTERN = /\$\s?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|\d+(?:\.[0-9]{1,2})?)/g;
const AMOUNT_CONTEXT = /(?:received|payment of|paid|sent|charge)\s+(?:a\s+)?(?:payment\s+)?(?:of\s+)?/gi;
const PAYER_PATTERN = /\bfrom\s+([^\n\r<>]{2,60})/i;
const TRANSACTION_PATTERN = /(?:transaction(?:\s+id)?|confirmation(?:\s+id)?|#)\s*[:#]?\s*([0-9]{6,20})/i;
const MEMO_PATTERN = /(?:note|memo|for)\s*[:-]?\s*([^\n\r<>]{1,120})/i;

export function toCents(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : Number(String(value).replace(/[$,\s]/g, ''));
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.round(num * 100);
}

export function formatCents(cents, currency = 'USD') {
  const amount = (Number(cents || 0) / 100).toFixed(2);
  return currency === 'USD' ? `$${amount}` : `${amount} ${currency}`;
}

function collectAmounts(text) {
  const out = new Set();
  for (const match of text.matchAll(AMOUNT_PATTERN)) {
    const cents = toCents(match[1]);
    if (cents) out.add(cents);
  }
  return [...out];
}

function amountNearContext(text) {
  const found = new Set();
  for (const match of text.matchAll(AMOUNT_CONTEXT)) {
    const tail = text.slice(match.index, match.index + 120);
    for (const amount of tail.matchAll(AMOUNT_PATTERN)) {
      const cents = toCents(amount[1]);
      if (cents) found.add(cents);
    }
  }
  return [...found];
}

export function parseVenmoEmail({ subject = '', body = '', from = '' } = {}) {
  const text = `${subject}\n${body}`.replace(/\r/g, '');
  const orderId = text.match(ORDER_ID_PATTERN)?.[0]?.toUpperCase() || null;

  const subjectAmounts = collectAmounts(subject);
  const contextAmounts = amountNearContext(text);
  const allAmounts = collectAmounts(text);

  let amountCents = null;
  let amountCandidates = [];
  if (subjectAmounts.length === 1) {
    amountCents = subjectAmounts[0];
    amountCandidates = subjectAmounts;
  } else {
    amountCandidates = contextAmounts.length ? contextAmounts : allAmounts;
    amountCents = amountCandidates.length === 1 ? amountCandidates[0] : null;
  }

  const payer = text.match(PAYER_PATTERN)?.[1]?.trim() || null;
  const transactionId = text.match(TRANSACTION_PATTERN)?.[1] || null;
  const memo = text.match(MEMO_PATTERN)?.[1]?.trim() || null;

  return {
    orderId,
    amountCents,
    amountCandidates,
    ambiguousAmount: amountCents === null && amountCandidates.length > 1,
    payer,
    memo,
    transactionId,
    from: from || null,
  };
}
