import { query } from '../db.js';

const COLUMNS = 'pid, pname, description, price, qty';

function normalizeProduct(product) {
  if (!product) return null;
  return { ...product, price: Number(product.price) };
}

export const productRepository = {
  async list() {
    const { rows } = await query(`select ${COLUMNS} from public.products order by pid`);
    return rows.map(normalizeProduct);
  },

  async findById(pid) {
    const { rows } = await query(
      `select ${COLUMNS} from public.products where pid = $1 limit 1`,
      [pid]
    );
    return normalizeProduct(rows[0]);
  },

  async create({ pname, description, price, qty }) {
    const { rows } = await query(
      `insert into public.products (pname, description, price, qty)
       values ($1, $2, $3, $4)
       returning ${COLUMNS}`,
      [pname, description, price, qty]
    );
    return normalizeProduct(rows[0]);
  },

  async update(pid, { pname, description, price, qty }) {
    const { rows } = await query(
      `update public.products
       set pname = $1, description = $2, price = $3, qty = $4
       where pid = $5
       returning ${COLUMNS}`,
      [pname, description, price, qty, pid]
    );
    return normalizeProduct(rows[0]);
  },

  async remove(pid) {
    const { rowCount } = await query('delete from public.products where pid = $1', [pid]);
    return rowCount > 0;
  },
};
