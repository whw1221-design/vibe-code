import { Router } from 'express';
import { productRepository } from '../repositories/productRepository.js';
import { asyncHandler, HttpError, sendData } from '../utils/http.js';
import {
  ensureAtLeastOneField,
  ensureInteger,
  ensureNumber,
  ensureString,
  hasField,
  parseId,
} from '../utils/validation.js';

const router = Router();

function readProduct(body, existing = null) {
  const value = (field, fallback) => (hasField(body, field) ? body[field] : fallback);

  return {
    pname: ensureString(value('pname', existing?.pname), 'pname', { max: 120 }),
    description: ensureString(value('description', existing?.description ?? ''), 'description', {
      min: 0,
      max: 2000,
    }),
    price: ensureNumber(value('price', existing?.price), 'price', { min: 0, max: 1_000_000 }),
    qty: ensureInteger(value('qty', existing?.qty), 'qty', { min: 0, max: 1_000_000 }),
  };
}

const listProducts = asyncHandler(async (req, res) => {
  sendData(res, await productRepository.list());
});

const getProduct = asyncHandler(async (req, res) => {
  const pid = parseId(req.params.id, 'pid');
  const product = await productRepository.findById(pid);
  if (!product) throw new HttpError(404, `Product ${pid} was not found.`);
  sendData(res, product);
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await productRepository.create(readProduct(req.body));
  sendData(res, product, 201);
});

const updateProduct = asyncHandler(async (req, res) => {
  const pid = parseId(req.params.id, 'pid');
  const existing = await productRepository.findById(pid);
  if (!existing) throw new HttpError(404, `Product ${pid} was not found.`);

  ensureAtLeastOneField(req.body, ['pname', 'description', 'price', 'qty']);
  const product = await productRepository.update(pid, readProduct(req.body, existing));
  if (!product) throw new HttpError(404, `Product ${pid} was not found.`);
  sendData(res, product);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const pid = parseId(req.params.id, 'pid');
  if (!(await productRepository.remove(pid))) {
    throw new HttpError(404, `Product ${pid} was not found.`);
  }
  sendData(res, { pid });
});

// Endpoint names requested in the project brief.
router.get('/get_products', listProducts);
router.get('/get_product/:id', getProduct);
router.post('/add_product', createProduct);
router.put('/update_product/:id', updateProduct);
router.patch('/update_product/:id', updateProduct);
router.delete('/delete_product/:id', deleteProduct);

// Because both products and users use an "update/:id" style endpoint,
// the resource-namespaced form disambiguates the two.
router.put('/products/update/:id', updateProduct);
router.patch('/products/update/:id', updateProduct);

// REST-style aliases used by the React client.
router.get('/products', listProducts);
router.get('/products/:id', getProduct);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.patch('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

export default router;
