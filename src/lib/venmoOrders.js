const KEY = 'gf_venmo_orders';
const MAX_SAVED = 20;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(orders) {
  try {
    localStorage.setItem(KEY, JSON.stringify(orders.slice(0, MAX_SAVED)));
  } catch {
    /* storage unavailable — ignore */
  }
}

export function listOrders() {
  return read();
}

export function rememberOrder({ id, token, total, itemCount }) {
  const existing = read().filter((order) => order.id !== id);
  write([{ id, token, total, itemCount, savedAt: new Date().toISOString() }, ...existing]);
}

export function forgetOrder(id) {
  write(read().filter((order) => order.id !== id));
}
