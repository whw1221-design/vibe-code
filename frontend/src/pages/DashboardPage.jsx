import { useCallback } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  alpha,
} from '@mui/material';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Link as RouterLink } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAsyncData } from '../hooks/useAsyncData.js';
import { formatCurrency, formatDateTime, formatNumber, initials } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';

const STAT_GRID = {
  display: 'grid',
  gap: 2,
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, minmax(0, 1fr))',
    lg: 'repeat(4, minmax(0, 1fr))',
  },
};

const CONTENT_GRID = {
  display: 'grid',
  gap: 2.5,
  gridTemplateColumns: { xs: '1fr', lg: '1.6fr 1fr' },
  alignItems: 'start',
};

function DashboardSkeleton() {
  return (
    <Stack spacing={2.5}>
      <Box sx={STAT_GRID}>
        {[0, 1, 2, 3].map((item) => (
          <Paper
            key={item}
            elevation={0}
            sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
          >
            <Skeleton variant="text" width="45%" />
            <Skeleton variant="text" width="30%" height={44} />
            <Skeleton variant="text" width="60%" />
          </Paper>
        ))}
      </Box>
      <Box sx={CONTENT_GRID}>
        <Paper
          elevation={0}
          sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
        >
          <Skeleton variant="text" width="30%" height={32} />
          <Skeleton variant="rounded" height={250} sx={{ mt: 2 }} />
        </Paper>
        <Paper
          elevation={0}
          sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
        >
          <Skeleton variant="text" width="45%" height={32} />
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} variant="text" height={48} />
          ))}
        </Paper>
      </Box>
    </Stack>
  );
}

export default function DashboardPage() {
  const loadDashboard = useCallback(async () => {
    const [products, users, orders] = await Promise.all([
      api.products.list(),
      api.users.list(),
      api.orders.list(),
    ]);
    return { products, users, orders };
  }, []);

  const { data, loading, error, reload } = useAsyncData(loadDashboard);

  const products = data?.products ?? [];
  const users = data?.users ?? [];
  const orders = data?.orders ?? [];

  const totalUnits = products.reduce((sum, product) => sum + Number(product.qty || 0), 0);
  const lowStock = products
    .filter((product) => product.qty <= 10)
    .sort((first, second) => first.qty - second.qty)
    .slice(0, 6);
  const recentOrders = orders.slice(0, 5);

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Dashboard"
        subtitle="A quick look at your catalogue, customers and latest orders."
        action={
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={reload}
            disabled={loading}
          >
            Refresh
          </Button>
        }
      />

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

      {loading && !data && <DashboardSkeleton />}

      {data && (
        <>
          <Box sx={STAT_GRID}>
            <StatCard
              label="PRODUCTS"
              value={formatNumber(products.length)}
              helper="items in the catalogue"
              icon={<Inventory2RoundedIcon fontSize="small" />}
              color="#4f46e5"
            />
            <StatCard
              label="STOCK ON HAND"
              value={formatNumber(totalUnits)}
              helper="total units across products"
              icon={<InventoryRoundedIcon fontSize="small" />}
              color="#0f9d8a"
            />
            <StatCard
              label="USERS"
              value={formatNumber(users.length)}
              helper="registered customers"
              icon={<PeopleAltRoundedIcon fontSize="small" />}
              color="#0284c7"
            />
            <StatCard
              label="ORDERS"
              value={formatNumber(orders.length)}
              helper="orders placed in total"
              icon={<ReceiptLongRoundedIcon fontSize="small" />}
              color="#d97706"
            />
          </Box>

          <Box sx={CONTENT_GRID}>
            <Paper
              elevation={0}
              sx={{ p: { xs: 2, md: 2.5 }, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
            >
              <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">Recent orders</Typography>
                  <Typography variant="caption" color="text.secondary">
                    The five latest orders in the store
                  </Typography>
                </Box>
                <Button
                  component={RouterLink}
                  to="/orders"
                  size="small"
                  endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
                  sx={{ flexShrink: 0 }}
                >
                  View all
                </Button>
              </Stack>

              <Divider sx={{ my: 2 }} />

              {recentOrders.length === 0 ? (
                <Stack spacing={1} sx={{ alignItems: 'center', py: 6 }}>
                  <Avatar sx={{ bgcolor: 'action.hover', color: 'primary.main' }}>
                    <ReceiptLongRoundedIcon />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    No orders yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Orders will appear here once they are created.
                  </Typography>
                  <Button component={RouterLink} to="/orders" size="small" sx={{ mt: 1 }}>
                    Go to orders
                  </Button>
                </Stack>
              ) : (
                <TableContainer sx={{ mx: { xs: -2, md: -2.5 } }}>
                  <Table size="small" sx={{ minWidth: 520 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Order</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Product</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentOrders.map((order) => (
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
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                              <Avatar
                                sx={{
                                  width: 28,
                                  height: 28,
                                  fontSize: 10,
                                  fontWeight: 800,
                                  bgcolor: 'primary.main',
                                  color: 'primary.contrastText',
                                }}
                              >
                                {initials(order.uname)}
                              </Avatar>
                              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                                {order.uname}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {order.pname}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {formatDateTime(order.order_date)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>

            <Paper
              elevation={0}
              sx={{ p: { xs: 2, md: 2.5 }, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
            >
              <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">Low stock</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Products with 10 units or fewer
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  icon={<WarningAmberRoundedIcon />}
                  label={lowStock.length}
                  color={lowStock.length > 0 ? 'warning' : 'success'}
                  variant="outlined"
                />
              </Stack>

              <Divider sx={{ my: 2 }} />

              {lowStock.length === 0 ? (
                <Stack spacing={1} sx={{ alignItems: 'center', py: 5, textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette.success.main, 0.12), color: 'success.main' }}>
                    <CheckCircleRoundedIcon />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    All stocked up
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {products.length === 0
                      ? 'Add products to start tracking stock levels.'
                      : 'No product is at or below the low-stock threshold.'}
                  </Typography>
                </Stack>
              ) : (
                <Stack divider={<Divider flexItem />}>
                  {lowStock.map((product) => (
                    <Stack
                      key={product.pid}
                      direction="row"
                      spacing={1.5}
                      sx={{ alignItems: 'center', py: 1.5 }}
                    >
                      <Avatar
                        variant="rounded"
                        sx={{
                          width: 34,
                          height: 34,
                          bgcolor: (theme) => alpha(theme.palette.warning.main, 0.12),
                          color: 'warning.main',
                        }}
                      >
                        <Inventory2RoundedIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                          {product.pname}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatCurrency(product.price)}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={`${formatNumber(product.qty)} left`}
                        color={product.qty === 0 ? 'error' : 'warning'}
                        variant={product.qty === 0 ? 'filled' : 'outlined'}
                      />
                    </Stack>
                  ))}
                </Stack>
              )}

              <Divider sx={{ my: 2 }} />
              <Button
                component={RouterLink}
                to="/products"
                size="small"
                fullWidth
                endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
              >
                Manage products
              </Button>
            </Paper>
          </Box>
        </>
      )}
    </Stack>
  );
}
