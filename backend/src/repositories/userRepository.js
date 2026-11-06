import { query } from '../db.js';

const PUBLIC_COLUMNS = 'uid, uname, email';

export const userRepository = {
  async list() {
    const { rows } = await query(`select ${PUBLIC_COLUMNS} from public.users order by uid`);
    return rows;
  },

  async findById(uid) {
    const { rows } = await query(
      `select ${PUBLIC_COLUMNS} from public.users where uid = $1 limit 1`,
      [uid]
    );
    return rows[0] ?? null;
  },

  async findByEmail(email, excludeUid = null) {
    const { rows } = excludeUid
      ? await query(
          `select ${PUBLIC_COLUMNS} from public.users
           where email = $1 and uid <> $2
           limit 1`,
          [email, excludeUid]
        )
      : await query(
          `select ${PUBLIC_COLUMNS} from public.users where email = $1 limit 1`,
          [email]
        );

    return rows[0] ?? null;
  },

  async create({ uname, email, password }) {
    const { rows } = await query(
      `insert into public.users (uname, email, password)
       values ($1, $2, $3)
       returning ${PUBLIC_COLUMNS}`,
      [uname, email, password]
    );
    return rows[0];
  },

  async update(uid, changes) {
    const entries = Object.entries(changes);
    const assignments = entries
      .map(([field], index) => `${field} = $${index + 1}`)
      .join(', ');
    const values = entries.map(([, value]) => value);
    values.push(uid);

    const { rows } = await query(
      `update public.users
       set ${assignments}
       where uid = $${values.length}
       returning ${PUBLIC_COLUMNS}`,
      values
    );
    return rows[0] ?? null;
  },

  async remove(uid) {
    const { rowCount } = await query('delete from public.users where uid = $1', [uid]);
    return rowCount > 0;
  },
};
