import { useMemo, useState } from 'react';
import {
  Alert,
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
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import { api } from '../api/client.js';
import { useAsyncData } from '../hooks/useAsyncData.js';
import { formatCurrency, formatNumber } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import SearchField from '../components/SearchField.jsx';
import TableLoadingRows from '../components/TableLoadingRows.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import ProductFormDialog from '../components/ProductFormDialog.jsx';
import { useToast } from '../components/ToastProvider.jsx';

export default function ProductsPage() {
  const { data, loading, error, reload } = useAsyncData(api.products.list);
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const { show } = useToast();

  const products = data ?? [];

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return products;
    return products.filter((product) =>
      `${product.pname} ${product.description}`.toLowerCase().includes(search)
    );
  }, [products, query]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
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
      await api.products.remove(deleting.pid);
      show('Product deleted.');
      setDeleting(null);
      reload();
    } catch (deleteError) {
      show(deleteError.message, 'error');
    } finally {
      setDeleteBusy(false);
    }
  };

  const initialLoading = loading && !data;
  const initialError = error && !data;

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Products"
        subtitle="Manage the products in your catalogue, their prices and stock levels."
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
            Add product
          </Button>
        }
      />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search products..."
          sx={{ flexGrow: 1 }}
        />
        <Typography variant="body2" color="text.secondary" noWrap>
          Showing {filtered.length} of {products.length} products
        </Typography>
      </Stack>

      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={reload}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading && data && <LinearProgress sx={{ borderRadius: 1 }} />}

      {!initialError && (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
        >
          <Table sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {initialLoading && <TableLoadingRows rows={5} columns={5} />}

              {!initialLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ border: 0 }}>
                    <EmptyState
                      icon={<Inventory2RoundedIcon />}
                      title={products.length === 0 ? 'No products yet' : 'No matching products'}
                      description={
                        products.length === 0
                          ? 'Add your first product to start tracking prices and inventory.'
                          : 'Try a different search term, or clear the search to see every product.'
                      }
                      action={
                        products.length === 0 ? (
                          <Button
                            variant="contained"
                            startIcon={<AddRoundedIcon />}
                            onClick={openCreate}
                          >
                            Add product
                          </Button>
                        ) : (
                          <Button onClick={() => setQuery('')}>Clear search</Button>
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              )}

              {filtered.map((product) => (
                <TableRow key={product.pid} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Avatar
                        variant="rounded"
                        sx={{
                          width: 38,
                          height: 38,
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                        }}
                      >
                        <Inventory2RoundedIcon fontSize="small" />
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                          {product.pname}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          PID #{product.pid}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  <TableCell sx={{ maxWidth: 360 }}>
                    <Tooltip title={product.description || 'No description'}>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {product.description || '—'}
                      </Typography>
                    </Tooltip>
                  </TableCell>

                  <TableCell align="right">
                    <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                      {formatCurrency(product.price)}
                    </Typography>
                  </TableCell>

                  <TableCell align="right">
                    <Chip
                      size="small"
                      label={formatNumber(product.qty)}
                      color={
                        product.qty === 0 ? 'error' : product.qty <= 10 ? 'warning' : 'default'
                      }
                      variant={product.qty <= 10 ? 'filled' : 'outlined'}
                    />
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title="Edit product">
                      <IconButton size="small" onClick={() => openEdit(product)}>
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete product">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleting(product)}
                      >
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

      <ProductFormDialog
        open={formOpen}
        product={editing}
        onClose={closeForm}
        onSaved={reload}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete product?"
        description={
          deleting
            ? `"${deleting.pname}" and all orders that reference it will be permanently deleted. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete product"
        loading={deleteBusy}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  );
}
