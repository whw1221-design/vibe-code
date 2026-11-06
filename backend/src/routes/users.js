import { Router } from 'express';
import { userRepository } from '../repositories/userRepository.js';
import { asyncHandler, HttpError, sendData } from '../utils/http.js';
import { hashPassword } from '../utils/password.js';
import {
  ensureAtLeastOneField,
  ensureEmail,
  ensureString,
  hasField,
  parseId,
} from '../utils/validation.js';

const router = Router();

async function assertEmailAvailable(email, excludeUid = null) {
  if (await userRepository.findByEmail(email, excludeUid)) {
    throw new HttpError(409, `A user with email ${email} already exists.`, { field: 'email' });
  }
}

const listUsers = asyncHandler(async (req, res) => {
  sendData(res, await userRepository.list());
});

const getUser = asyncHandler(async (req, res) => {
  const uid = parseId(req.params.id, 'uid');
  const user = await userRepository.findById(uid);
  if (!user) throw new HttpError(404, `User ${uid} was not found.`);
  sendData(res, user);
});

const createUser = asyncHandler(async (req, res) => {
  const uname = ensureString(req.body.uname, 'uname', { max: 80 });
  const email = ensureEmail(req.body.email);
  const password = ensureString(req.body.password, 'password', { min: 6, max: 128 });

  await assertEmailAvailable(email);

  const user = await userRepository.create({
    uname,
    email,
    password: hashPassword(password),
  });
  sendData(res, user, 201);
});

const updateUser = asyncHandler(async (req, res) => {
  const uid = parseId(req.params.id, 'uid');
  const existing = await userRepository.findById(uid);
  if (!existing) throw new HttpError(404, `User ${uid} was not found.`);

  ensureAtLeastOneField(req.body, ['uname', 'email', 'password']);

  const changes = {};
  if (hasField(req.body, 'uname')) {
    changes.uname = ensureString(req.body.uname, 'uname', { max: 80 });
  }
  if (hasField(req.body, 'email')) {
    changes.email = ensureEmail(req.body.email);
    await assertEmailAvailable(changes.email, uid);
  }
  // An omitted or blank password means "keep the current password".
  if (hasField(req.body, 'password') && req.body.password !== '' && req.body.password !== null) {
    changes.password = hashPassword(
      ensureString(req.body.password, 'password', { min: 6, max: 128 })
    );
  }

  if (Object.keys(changes).length === 0) {
    throw new HttpError(400, 'Provide at least one field to update.');
  }

  const user = await userRepository.update(uid, changes);
  if (!user) throw new HttpError(404, `User ${uid} was not found.`);
  sendData(res, user);
});

const deleteUser = asyncHandler(async (req, res) => {
  const uid = parseId(req.params.id, 'uid');
  if (!(await userRepository.remove(uid))) {
    throw new HttpError(404, `User ${uid} was not found.`);
  }
  sendData(res, { uid });
});

// Endpoint names requested in the project brief.
router.get('/get_users', listUsers);
router.get('/get_user/:id', getUser);
router.post('/add_user', createUser);
router.put('/update_user/:id', updateUser);
router.patch('/update_user/:id', updateUser);
router.delete('/delete_user/:id', deleteUser);

// Resource-namespaced update form (see note in products.js).
router.put('/users/update/:id', updateUser);
router.patch('/users/update/:id', updateUser);

// REST-style aliases used by the React client.
router.get('/users', listUsers);
router.get('/users/:id', getUser);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

export default router;
