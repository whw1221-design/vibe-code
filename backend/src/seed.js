import { closePool, isDatabaseConfigured, pool, query } from './db.js';
import { hashPassword } from './utils/password.js';
import { userRepository } from './repositories/userRepository.js';
import { productRepository } from './repositories/productRepository.js';
import { orderRepository } from './repositories/orderRepository.js';

const reset = process.argv.includes('--reset');

function daysAgo(days, hour = 12) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

async function countRows(table) {
  const { rows } = await query(`select count(*)::int as count from public.${table}`);
  return rows[0].count;
}

async function main() {
  if (!isDatabaseConfigured || !pool) {
    console.error('DATABASE_URL is missing.');
    console.error('Add your Supabase connection string to backend/.env first.');
    process.exitCode = 1;
    return;
  }

  const existing = {
    users: await countRows('users'),
    products: await countRows('products'),
    orders: await countRows('orders'),
  };

  if (!reset && (existing.users > 0 || existing.products > 0 || existing.orders > 0)) {
    console.log('Supabase already contains data. Skipping seed.');
    console.log('Run "npm run seed -- --reset" to clear it and insert the sample data.');
    return;
  }

  if (reset) {
    console.log('Clearing existing rows...');
    await query(
      'truncate table public.orders, public.users, public.products restart identity cascade'
    );
  }

  const alice = await userRepository.create({
    uname: 'Alice Johnson',
    email: 'alice@example.com',
    password: hashPassword('password123'),
  });
  const bob = await userRepository.create({
    uname: 'Bob Smith',
    email: 'bob@example.com',
    password: hashPassword('password123'),
  });
  const carol = await userRepository.create({
    uname: 'Carol Lee',
    email: 'carol@example.com',
    password: hashPassword('password123'),
  });

  const mouse = await productRepository.create({
    pname: 'Wireless Mouse',
    description: 'Ergonomic 2.4 GHz wireless mouse with USB receiver.',
    price: 25.99,
    qty: 40,
  });
  const keyboard = await productRepository.create({
    pname: 'Mechanical Keyboard',
    description: 'Compact TKL keyboard with brown switches and RGB lighting.',
    price: 89.5,
    qty: 15,
  });
  const monitor = await productRepository.create({
    pname: '27-inch Monitor',
    description: 'QHD IPS display with 75 Hz refresh rate and HDMI input.',
    price: 249.99,
    qty: 8,
  });
  const hub = await productRepository.create({
    pname: 'USB-C Hub',
    description: '7-in-1 hub with HDMI, USB 3.0, SD card reader and PD charging.',
    price: 39.0,
    qty: 25,
  });
  const stand = await productRepository.create({
    pname: 'Laptop Stand',
    description: 'Adjustable aluminium stand for laptops up to 17 inches.',
    price: 45.5,
    qty: 30,
  });

  await orderRepository.create({ uid: alice.uid, pid: keyboard.pid, order_date: daysAgo(1, 10) });
  await orderRepository.create({ uid: alice.uid, pid: mouse.pid, order_date: daysAgo(6, 15) });
  await orderRepository.create({ uid: bob.uid, pid: monitor.pid, order_date: daysAgo(2, 9) });
  await orderRepository.create({ uid: bob.uid, pid: hub.pid, order_date: daysAgo(12, 18) });
  await orderRepository.create({ uid: carol.uid, pid: stand.pid, order_date: daysAgo(3, 14) });
  await orderRepository.create({
    uid: carol.uid,
    pid: keyboard.pid,
    order_date: daysAgo(20, 11),
  });

  const summary = {
    users: await countRows('users'),
    products: await countRows('products'),
    orders: await countRows('orders'),
  };

  console.log(
    `Seed complete: ${summary.users} users, ${summary.products} products, ${summary.orders} orders.`
  );
  console.log('All sample users use the password: password123');
}

main()
  .catch((error) => {
    console.error(`Seed failed: ${error.message}`);
    if (error.code === '42P01') {
      console.error('The schema is missing. Run "npm run db:setup" first.');
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
