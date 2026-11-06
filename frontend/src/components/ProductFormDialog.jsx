import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material';
import { api } from '../api/client.js';
import { useToast } from './ToastProvider.jsx';

const EMPTY_FORM = {
  pname: '',
  description: '',
  price: '',
  qty: '',
};

export default function ProductFormDialog({ open, product, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  const isEdit = Boolean(product);

  useEffect(() => {
    if (!open) return;

    setForm(
      product
        ? {
            pname: product.pname,
            description: product.description ?? '',
            price: String(product.price),
            qty: String(product.qty),
          }
        : EMPTY_FORM
    );
    setErrors({});
    setSubmitError('');
  }, [open, product]);

  const changeField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  function validate() {
    const next = {};

    if (!form.pname.trim()) {
      next.pname = 'Product name is required.';
    }

    const price = Number(form.price);
    if (form.price === '' || !Number.isFinite(price) || price < 0) {
      next.price = 'Enter a price of 0 or more.';
    }

    const qty = Number(form.qty);
    if (form.qty === '' || !Number.isInteger(qty) || qty < 0) {
      next.qty = 'Enter a whole quantity of 0 or more.';
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
      pname: form.pname.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      qty: Number(form.qty),
    };

    try {
      if (isEdit) {
        await api.products.update(product.pid, payload);
      } else {
        await api.products.create(payload);
      }
      show(isEdit ? 'Product updated.' : 'Product added.');
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
      aria-labelledby="product-dialog-title"
    >
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle id="product-dialog-title">
          {isEdit ? 'Edit product' : 'Add product'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {submitError && <Alert severity="error">{submitError}</Alert>}

            <TextField
              label="Product name"
              value={form.pname}
              onChange={changeField('pname')}
              error={Boolean(errors.pname)}
              helperText={errors.pname}
              autoFocus
              required
              fullWidth
              slotProps={{ htmlInput: { maxLength: 120 } }}
            />

            <TextField
              label="Description"
              value={form.description}
              onChange={changeField('description')}
              multiline
              minRows={3}
              fullWidth
              helperText={`${form.description.length}/2000 characters`}
              slotProps={{ htmlInput: { maxLength: 2000 } }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Price"
                type="number"
                value={form.price}
                onChange={changeField('price')}
                error={Boolean(errors.price)}
                helperText={errors.price}
                required
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  },
                  htmlInput: { min: 0, step: '0.01' },
                }}
              />
              <TextField
                label="Quantity in stock"
                type="number"
                value={form.qty}
                onChange={changeField('qty')}
                error={Boolean(errors.qty)}
                helperText={errors.qty}
                required
                fullWidth
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
              />
            </Stack>
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
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add product'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
