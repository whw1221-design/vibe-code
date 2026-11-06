import { Router } from 'express';
import { orderRepository } from '../repositories/orderRepository.js';
import { productRepository } from '../repositories/productRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { asyncHandler, HttpError, sendData } from '../utils/http.js';
import {
  ensureAtLeastOneField,
  ensureDate,
  ensureInteger,
  hasField,
  parseId,
} from '../utils/validation.js';

const router = Router();

function readOrder(body, existing = null) {
  const value = (field, fallback) => (hasField(body, field) ? body[field] : fallback);

  const uid = ensureInteger(value('uid', existing?.uid), 'uid', { min: 1 });
  const pid = ensureInteger(value('pid', existing?.pid), 'pid', { min: 1 });

  const rawDate = value('order_date', existing?.order_date);
  const order_date =
    rawDate === undefined || rawDate === null || rawDate === ''
      ? new Date().toISOString()
      : ensureDate(rawDate);

  return { uid, pid, order_date };
}

async function assertRelations({ uid, pid }) {
  if (!(await userRepository.findById(uid))) {
    throw new HttpError(400, `User with uid ${uid} does not exist.`, { field: 'uid' });
  }
  if (!(await productRepository.findById(pid))) {
    throw new HttpError(400, `Product with pid ${pid} does not exist.`, { field: 'pid' });
  }
}

function readOptionalFilter(value, name) {
  if (value === undefined || value === '') return undefined;
  return parseId(value, name);
}

const listOrders = asyncHandler(async (req, res) => {
  const filters = {};
  const uid = readOptionalFilter(req.query.uid, 'uid');
  const pid = readOptionalFilter(req.query.pid, 'pid');
  if (uid !== undefined) filters.uid = uid;
  if (pid !== undefined) filters.pid = pid;
  sendData(res, await orderRepository.list(filters));
});

const getOrder = asyncHandler(async (req, res) => {
  const oid = parseId(req.params.id, 'oid');
  const order = await orderRepository.findById(oid);
  if (!order) throw new HttpError(404, `Order ${oid} was not found.`);
  sendData(res, order);
});

const listOrdersByUser = asyncHandler(async (req, res) => {
  const uid = parseId(req.params.uid, 'uid');
  sendData(res, await orderRepository.listByUser(uid));
});

const listOrdersByProduct = asyncHandler(async (req, res) => {
  const pid = parseId(req.params.pid, 'pid');
  sendData(res, await orderRepository.listByProduct(pid));
});

const createOrder = asyncHandler(async (req, res) => {
  const order = readOrder(req.body);
  await assertRelations(order);
  sendData(res, await orderRepository.create(order), 201);
});

const updateOrder = asyncHandler(async (req, res) => {
  const oid = parseId(req.params.id, 'oid');
  const existing = await orderRepository.findById(oid);
  if (!existing) throw new HttpError(404, `Order ${oid} was not found.`);

  ensureAtLeastOneField(req.body, ['uid', 'pid', 'order_date']);
  const order = readOrder(req.body, existing);
  await assertRelations(order);
  const updated = await orderRepository.update(oid, order);
  if (!updated) throw new HttpError(404, `Order ${oid} was not found.`);
  sendData(res, updated);
});

const deleteOrder = asyncHandler(async (req, res) => {
  const oid = parseId(req.params.id, 'oid');
  if (!(await orderRepository.remove(oid))) {
    throw new HttpError(404, `Order ${oid} was not found.`);
  }
  sendData(res, { oid });
});

// Endpoint names requested in the project brief.
router.get('/get_orders', listOrders);
router.get('/get_orders/uid/:uid', listOrdersByUser);
router.get('/get_orders/pid/:pid', listOrdersByProduct);
router.get('/get_order/:id', getOrder);
router.post('/add_order', createOrder);
router.put('/update_order/:id', updateOrder);
router.patch('/update_order/:id', updateOrder);
router.delete('/delete_order/:id', deleteOrder);

// REST-style aliases used by the React client.
router.get('/orders', listOrders);
router.get('/orders/user/:uid', listOrdersByUser);
router.get('/orders/product/:pid', listOrdersByProduct);
router.get('/orders/:id', getOrder);
router.post('/orders', createOrder);
router.put('/orders/:id', updateOrder);
router.patch('/orders/:id', updateOrder);
router.delete('/orders/:id', deleteOrder);

export default router;
