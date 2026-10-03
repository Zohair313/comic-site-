import { readJson, writeJson, withLock } from './store.js';

const EMPTY = { orders: [] };

/**
 * Single owner of the orders file. The lock serialises every read-modify-write
 * so approve/reject/ingest can never interleave and corrupt state.
 */
export function createOrderStore(ordersFile, { maxOrders = 2000 } = {}) {
  const mutate = withLock();

  const load = () => {
    const orders = readJson(ordersFile, EMPTY).orders;
    return Array.isArray(orders) ? orders : [];
  };

  const save = (orders) => {
    writeJson(ordersFile, { orders });
    return orders;
  };

  return {
    load,
    save,
    mutate,

    find(orders, id) {
      const wanted = String(id || '').toUpperCase().trim();
      return orders.find((order) => String(order.id || '').toUpperCase() === wanted) || null;
    },

    /** Runs fn(orders) under the lock and persists whatever it leaves behind. */
    async run(fn) {
      return mutate(async () => {
        const orders = load();
        const result = await fn(orders);
        if (orders.length > maxOrders) orders.splice(0, orders.length - maxOrders);
        save(orders);
        return result;
      });
    },
  };
}
