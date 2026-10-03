import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCents, parseVenmoEmail, toCents } from '../lib/venmoMail.js';

test('picks amount from the subject over fee noise in the body', () => {
  const parsed = parseVenmoEmail({
    subject: 'You received a payment of $13.18 from Mark Test',
    body: 'Mark Test sent you a payment of $13.18.\nVenmo fee: $0.00\nNote: Greyfire GF-7K3QD2\nTransaction ID: 3988123456',
  });
  assert.equal(parsed.orderId, 'GF-7K3QD2');
  assert.equal(parsed.amountCents, 1318);
  assert.equal(parsed.transactionId, '3988123456');
});

test('reads past-tense subjects with the order id in the body', () => {
  const parsed = parseVenmoEmail({
    subject: 'Mark Test paid you $5.99 on Venmo',
    body: 'Your note read: Greyfire GF-ABC123',
  });
  assert.equal(parsed.orderId, 'GF-ABC123');
  assert.equal(parsed.amountCents, 599);
});

test('uppercases a lowercase order id', () => {
  const parsed = parseVenmoEmail({ subject: 'Payment received', body: 'note: greyfire gf-mn8mn8 $7.00' });
  assert.equal(parsed.orderId, 'GF-MN8MN8');
  assert.equal(parsed.amountCents, 700);
});

test('flags ambiguous amounts instead of guessing', () => {
  const parsed = parseVenmoEmail({
    subject: 'You have a new Venmo payment',
    body: 'Sam Cole sent you a payment of $29.90. A fee of $0.88 was deducted. Note GF-KJ4HJ2',
  });
  assert.equal(parsed.orderId, 'GF-KJ4HJ2');
  assert.equal(parsed.amountCents, null);
  assert.equal(parsed.ambiguousAmount, true);
});

test('handles thousands separators and html bodies', () => {
  const parsed = parseVenmoEmail({
    subject: 'You received a payment of $1,299.00 from Big Client',
    body: '<p>Note: <b>GF-QQ2QQ2</b></p>',
  });
  assert.equal(parsed.amountCents, 129900);
  assert.equal(parsed.orderId, 'GF-QQ2QQ2');
});

test('returns no order id when the email has no reference', () => {
  const parsed = parseVenmoEmail({ subject: 'You received a payment of $10.00', body: 'no reference' });
  assert.equal(parsed.orderId, null);
  assert.equal(parsed.amountCents, 1000);
});

test('ignores amounts with no dollar sign', () => {
  const parsed = parseVenmoEmail({ subject: 'Payment received', body: 'sent 7.00 for gf-mn8mn8' });
  assert.equal(parsed.amountCents, null);
});

test('toCents normalises money strings', () => {
  assert.equal(toCents('$5.99'), 599);
  assert.equal(toCents('19.9'), 1990);
  assert.equal(toCents('$1,299.00'), 129900);
  assert.equal(toCents(0.5), 50);
  assert.equal(toCents('$0.00'), null);
  assert.equal(toCents('abc'), null);
  assert.equal(toCents(''), null);
  assert.equal(toCents(undefined), null);
});

test('formatCents renders two decimals', () => {
  assert.equal(formatCents(1318), '$13.18');
  assert.equal(formatCents(1318, 'EUR'), '13.18 EUR');
  assert.equal(formatCents(0), '$0.00');
});
