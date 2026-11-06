import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import FilterAltOffRoundedIcon from '@mui/icons-material/FilterAltOffRounded';
import { api } from '../api/client.js';
import { useAsyncData } from '../hooks/useAsyncData.js';
import { formatCurrency, formatDateTime, initials } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import SearchField from '../components/SearchField.jsx';
import TableLoadingRows from '../components/TableLoadingRows.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import OrderFormDialog from '../components/OrderFormDialog.jsx';
import { useToast } from '../components/ToastProvider.jsx';

export default function OrdersPage() {
  const usersState = useAsyncData(api.users.list);
  const productsState = useAsyncData(api.products.list);

  const [query, setQuery] = useState('');
  const [filterUser, setFilterUser] = useState(null);
  const [filterProduct, setFilterProduct] = useState(null);

  const loadOrders = useCallback(() => {
    if (filterUser) return api.orders.byUser(filterUser.uid);
    if (filterProduct) return api.orders.byProduct(filterProduct.pid);
    return api.orders.list();
  }, [filterUser, filterProduct]);

  const ordersState = useAsyncData(loadOrders);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const { show } = useToast();

  const users = usersState.data ?? [];
  const products = productsState.data ?? [];
  const orders = ordersState.data ?? [];

  const filteredOrders = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return orders;
    return orders.filter((order) =>
      `${order.oid} ${order.uname} ${order.email} ${order.pname}`.toLowerCase().includes(search)
    );
  }, [orders, query]);

  const errors = [...new Set(
    [ordersState.error, usersState.error, productsState.error].filter(Boolean)
  )];
  const initialLoading = ordersState.loading && !ordersState.data;
  const initialError = ordersState.error && !ordersState.data;
  const hasFilters = Boolean(filterUser || filterProduct || query.trim());
  const dependenciesReady = !usersState.loading && !productsState.loading;
  const canCreateOrder = users.length > 0 && products.length > 0;

  const clearFilters = () => {
    setFilterUser(null);
    setFilterProduct(null);
    setQuery('');
  };

  const reloadAll = () => {
    ordersState.reload();
    usersState.reload();
    productsState.reload();
  };

  const handleAdd = () => {
    if (!dependenciesReady) {
      show('Users and products are still loading.', 'info');
      return;
    }
    if (!canCreateOrder) {
      show('Add at least one user and one product before creating an order.', 'warning');
      return;
    }
    setEditing(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api.orders.remove(deleting.oid);
      show('Order deleted.');
      setDeleting(null);
      ordersState.reload();
    } catch (deleteError) {
      show(deleteError.message, 'error');
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Orders"
        subtitle="Link customers to products and keep every order date up to date."
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={handleAdd}>
            Add order
          </Button>
        }
      />

      <Paper
        elevation={0}
        sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
      >
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={2}
          sx={{ alignItems: { xs: 'stretch', lg: 'center' } }}
        >
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search orders, customers or products..."
            sx={{ flexGrow: 1 }}
          />

          <Autocomplete
            size="small"
            options={users}
            value={filterUser}
            onChange={(event, value) => {
              setFilterUser(value);
              if (value) setFilterProduct(null);
            }}
            getOptionLabel={(option) => `${option.uname} (#${option.uid})`}
            isOptionEqualToValue={(option, value) => option.uid === value.uid}
            filterOptions={(options, { inputValue }) => {
              const search = inputValue.toLowerCase();
              return options.filter((option) =>
                `${option.uname} ${option.email}`.toLowerCase().includes(search)
              );
            }}
            renderInput={(params) => <TextField {...params} label="Filter by customer" />}
            sx={{ minWidth: { xs: '100%', lg: 230 } }}
          />

          <Autocomplete
            size="small"
            options={products}
            value={filterProduct}
            onChange={(event, value) => {
              setFilterProduct(value);
              if (value) setFilterUser(null);
            }}
            getOptionLabel={(option) => `${option.pname} (#${option.pid})`}
            isOptionEqualToValue={(option, value) => option.pid === value.pid}
            filterOptions={(options, { inputValue }) => {
              const search = inputValue.toLowerCase();
              return options.filter((option) =>
                option.pname.toLowerCase().includes(search)
              );
            }}
            renderInput={(params) => <TextField {...params} label="Filter by product" />}
            sx={{ minWidth: { xs: '100%', lg: 230 } }}
          />

          {(filterUser || filterProduct) && (
            <Button
              color="inherit"
              startIcon={<FilterAltOffRoundedIcon />}
              onClick={clearFilters}
            >
              Clear
            </Button>
          )}

          <Typography
            variant="body2"
            color="text.secondary"
            noWrap
            sx={{ ml: { lg: 'auto' } }}
          >
            {filteredOrders.length} shown
          </Typography>
        </Stack>
      </Paper>

      {errors.length > 0 && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={reloadAll}>
              Retry
            </Button>
          }
        >
          {errors.join(' ')}
        </Alert>
      )}

      {(ordersState.loading || usersState.loading || productsState.loading) && ordersState.data && (
        <LinearProgress sx={{ borderRadius: 1 }} />
      )}

      {!initialError && (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
        >
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell>Order</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Order date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {initialLoading && <TableLoadingRows rows={5} columns={5} />}

              {!initialLoading && filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ border: 0 }}>
                    <EmptyState
                      icon={<ReceiptLongRoundedIcon />}
                      title={
                        orders.length === 0 && !hasFilters ? 'No orders yet' : 'No matching orders'
                      }
                      description={
                        orders.length === 0 && !hasFilters
                          ? 'Create an order to connect a customer with one of your products.'
                          : 'No orders match the current search or relationship filter.'
                      }
                      action={
                        orders.length === 0 && !hasFilters ? (
                          <Button
                            variant="contained"
                            startIcon={<AddRoundedIcon />}
                            onClick={handleAdd}
                          >
                            Add order
                          </Button>
                        ) : (
                          <Button onClick={clearFilters}>Reset filters</Button>
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              )}

              {filteredOrders.map((order) => (
                <TableRow key={order.oid} hover>
                  <TableCell>
                    <Chip
                      label={`#${order.oid}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontFamily: 'monospace' }}
                    />
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {initials(order.uname)}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                          {order.uname}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {order.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Avatar
                        variant="rounded"
                        sx={{
                          width: 34,
                          height: 34,
                          bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.12),
                          color: 'secondary.main',
                        }}
                      >
                        <Inventory2RoundedIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                          {order.pname}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatCurrency(order.price)} · PID #{order.pid}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {formatDateTime(order.order_date)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      OID #{order.oid}
                    </Typography>
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title="Edit order">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditing(order);
                          setFormOpen(true);
                        }}
                      >
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete order">
                      <IconButton size="small" color="error" onClick={() => setDeleting(order)}>
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <OrderFormDialog
        open={formOpen}
        order={editing}
        users={users}
        products={products}
        onClose={closeForm}
        onSaved={ordersState.reload}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete order?"
        description={
          deleting
            ? `Order #${deleting.oid} for ${deleting.uname} will be permanently deleted. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete order"
        loading={deleteBusy}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  );
}
