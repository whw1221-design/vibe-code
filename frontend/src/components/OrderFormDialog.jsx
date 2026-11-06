import { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { api } from '../api/client.js';
import { formatCurrency, formatNumber, toDateTimeLocal } from '../utils/format.js';
import { useToast } from './ToastProvider.jsx';

export default function OrderFormDialog({ open, order, users, products, onClose, onSaved }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderDate, setOrderDate] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  const isEdit = Boolean(order);
  const noOptions = users.length === 0 || products.length === 0;

  useEffect(() => {
    if (!open) return;

    if (order) {
      setSelectedUser(
        users.find((user) => user.uid === order.uid) ?? {
          uid: order.uid,
          uname: order.uname ?? `User #${order.uid}`,
          email: order.email ?? '',
        }
      );
      setSelectedProduct(
        products.find((product) => product.pid === order.pid) ?? {
          pid: order.pid,
          pname: order.pname ?? `Product #${order.pid}`,
          price: order.price,
          qty: order.qty,
        }
      );
      setOrderDate(toDateTimeLocal(order.order_date));
    } else {
      setSelectedUser(null);
      setSelectedProduct(null);
      setOrderDate(toDateTimeLocal(new Date()));
    }

    setErrors({});
    setSubmitError('');
  }, [open, order, users, products]);

  function validate() {
    const next = {};

    if (!selectedUser) next.user = 'Choose a customer.';
    if (!selectedProduct) next.product = 'Choose a product.';

    const parsedDate = new Date(orderDate);
    if (!orderDate || Number.isNaN(parsedDate.getTime())) {
      next.order_date = 'Choose a valid date and time.';
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
      uid: selectedUser.uid,
      pid: selectedProduct.pid,
      order_date: new Date(orderDate).toISOString(),
    };

    try {
      if (isEdit) {
        await api.orders.update(order.oid, payload);
      } else {
        await api.orders.create(payload);
      }
      show(isEdit ? 'Order updated.' : 'Order added.');
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
      aria-labelledby="order-dialog-title"
    >
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle id="order-dialog-title">{isEdit ? 'Edit order' : 'Add order'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {submitError && <Alert severity="error">{submitError}</Alert>}

            {noOptions && (
              <Alert severity="warning">
                Add at least one user and one product before creating an order.
              </Alert>
            )}

            <Autocomplete
              options={users}
              value={selectedUser}
              onChange={(event, value) => {
                setSelectedUser(value);
                setErrors((current) => ({ ...current, user: undefined }));
              }}
              getOptionLabel={(option) =>
                option.email ? `${option.uname} (${option.email})` : option.uname
              }
              isOptionEqualToValue={(option, value) => option.uid === value.uid}
              filterOptions={(options, { inputValue }) => {
                const query = inputValue.toLowerCase();
                return options.filter((option) =>
                  `${option.uname} ${option.email}`.toLowerCase().includes(query)
                );
              }}
              renderOption={(props, option) => {
                const { key, ...optionProps } = props;
                return (
                  <Box component="li" key={key} {...optionProps}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                        {option.uname}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {option.email}
                      </Typography>
                    </Box>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Customer"
                  required
                  error={Boolean(errors.user)}
                  helperText={errors.user}
                />
              )}
            />

            <Autocomplete
              options={products}
              value={selectedProduct}
              onChange={(event, value) => {
                setSelectedProduct(value);
                setErrors((current) => ({ ...current, product: undefined }));
              }}
              getOptionLabel={(option) => option.pname}
              isOptionEqualToValue={(option, value) => option.pid === value.pid}
              filterOptions={(options, { inputValue }) => {
                const query = inputValue.toLowerCase();
                return options.filter((option) =>
                  `${option.pname} ${option.description ?? ''}`.toLowerCase().includes(query)
                );
              }}
              renderOption={(props, option) => {
                const { key, ...optionProps } = props;
                return (
                  <Box
                    component="li"
                    key={key}
                    {...optionProps}
                    sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}
                  >
                    <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                      {option.pname}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {formatCurrency(option.price)} · {formatNumber(option.qty)} in stock
                    </Typography>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Product"
                  required
                  error={Boolean(errors.product)}
                  helperText={errors.product}
                />
              )}
            />

            {selectedProduct && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                      {selectedProduct.pname}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Unit price {formatCurrency(selectedProduct.price)}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={`${formatNumber(selectedProduct.qty)} in stock`}
                    color={
                      selectedProduct.qty === 0
                        ? 'error'
                        : selectedProduct.qty <= 10
                          ? 'warning'
                          : 'default'
                    }
                    variant={selectedProduct.qty <= 10 ? 'filled' : 'outlined'}
                  />
                </Stack>
              </Box>
            )}

            <TextField
              label="Order date & time"
              type="datetime-local"
              value={orderDate}
              onChange={(event) => {
                setOrderDate(event.target.value);
                setErrors((current) => ({ ...current, order_date: undefined }));
              }}
              error={Boolean(errors.order_date)}
              helperText={errors.order_date || 'Defaults to the current date and time.'}
              required
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
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
            disabled={saving || noOptions}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add order'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
