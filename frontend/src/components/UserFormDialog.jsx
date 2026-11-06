import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { api } from '../api/client.js';
import { useToast } from './ToastProvider.jsx';

const EMPTY_FORM = {
  uname: '',
  email: '',
  password: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function UserFormDialog({ open, user, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  const isEdit = Boolean(user);

  useEffect(() => {
    if (!open) return;

    setForm(
      user
        ? { uname: user.uname, email: user.email, password: '' }
        : EMPTY_FORM
    );
    setErrors({});
    setSubmitError('');
  }, [open, user]);

  const changeField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  function validate() {
    const next = {};

    if (!form.uname.trim()) {
      next.uname = 'Name is required.';
    }

    if (!EMAIL_PATTERN.test(form.email.trim())) {
      next.email = 'Enter a valid email address.';
    }

    if (!isEdit && form.password.length < 6) {
      next.password = 'Password must be at least 6 characters.';
    } else if (isEdit && form.password.length > 0 && form.password.length < 6) {
      next.password = 'Password must be at least 6 characters, or leave it blank.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSubmitError('');

    const payload = {
      uname: form.uname.trim(),
      email: form.email.trim().toLowerCase(),
    };

    // A blank password on edit means "keep the current password".
    if (form.password) payload.password = form.password;

    try {
      if (isEdit) {
        await api.users.update(user.uid, payload);
      } else {
        await api.users.create(payload);
      }
      show(isEdit ? 'User updated.' : 'User added.');
      onSaved();
      onClose();
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="user-dialog-title"
    >
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle id="user-dialog-title">{isEdit ? 'Edit user' : 'Add user'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {submitError && <Alert severity="error">{submitError}</Alert>}

            <TextField
              label="Full name"
              value={form.uname}
              onChange={changeField('uname')}
              error={Boolean(errors.uname)}
              helperText={errors.uname}
              autoFocus
              required
              fullWidth
              slotProps={{ htmlInput: { maxLength: 80 } }}
            />

            <TextField
              label="Email address"
              type="email"
              value={form.email}
              onChange={changeField('email')}
              error={Boolean(errors.email)}
              helperText={errors.email}
              autoComplete="email"
              required
              fullWidth
              slotProps={{ htmlInput: { maxLength: 254 } }}
            />

            <TextField
              label={isEdit ? 'New password (optional)' : 'Password'}
              type="password"
              value={form.password}
              onChange={changeField('password')}
              error={Boolean(errors.password)}
              helperText={
                errors.password ||
                (isEdit
                  ? 'Leave blank to keep the current password.'
                  : 'At least 6 characters. Stored as a salted scrypt hash.')
              }
              autoComplete="new-password"
              required={!isEdit}
              fullWidth
              slotProps={{ htmlInput: { minLength: 6, maxLength: 128 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add user'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
