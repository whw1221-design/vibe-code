import { query } from '../db.js';

const SELECT_JOINED = `
  select
    o.oid,
    o.uid,
    o.pid,
    o.order_date,
    u.uname,
    u.email,
    p.pname,
    p.price,
    p.qty
  from public.orders o
  join public.users u on u.uid = o.uid
  join public.products p on p.pid = o.pid
`;

function normalizeOrder(order) {
  if (!order) return null;
  return { ...order, price: Number(order.price) };
}

export const orderRepository = {
  async list(filters = {}) {
    const conditions = [];
    const values = [];

    if (filters.uid !== undefined) {
      values.push(filters.uid);
      conditions.push(`o.uid = $${values.length}`);
    }
    if (filters.pid !== undefined) {
      values.push(filters.pid);
      conditions.push(`o.pid = $${values.length}`);
    }

    const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
    const { rows } = await query(
      `${SELECT_JOINED} ${where} order by o.order_date desc, o.oid desc`,
      values
    );
    return rows.map(normalizeOrder);
  },

  async findById(oid) {
    const { rows } = await query(`${SELECT_JOINED} where o.oid = $1 limit 1`, [oid]);
    return normalizeOrder(rows[0]);
  },

  async listByUser(uid) {
    return this.list({ uid });
  },

  async listByProduct(pid) {
    return this.list({ pid });
  },

  async create({ uid, pid, order_date }) {
    const { rows } = await query(
      `insert into public.orders (uid, pid, order_date)
       values ($1, $2, $3)
       returning oid`,
      [uid, pid, order_date]
    );
    return this.findById(rows[0].oid);
  },

  async update(oid, { uid, pid, order_date }) {
    const { rows } = await query(
      `update public.orders
       set uid = $1, pid = $2, order_date = $3
       where oid = $4
       returning oid`,
      [uid, pid, order_date, oid]
    );
    if (!rows[0]) return null;
    return this.findById(oid);
  },

  async remove(oid) {
    const { rowCount } = await query('delete from public.orders where oid = $1', [oid]);
    return rowCount > 0;
  },
};
