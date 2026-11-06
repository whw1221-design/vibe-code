import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WifiOffRoundedIcon from '@mui/icons-material/WifiOffRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import { api } from '../api/client.js';
import { useColorMode } from '../theme/ThemeModeProvider.jsx';

const DRAWER_WIDTH = 264;

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/', icon: <DashboardRoundedIcon /> },
  { label: 'Products', to: '/products', icon: <Inventory2RoundedIcon /> },
  { label: 'Users', to: '/users', icon: <PeopleAltRoundedIcon /> },
  { label: 'Orders', to: '/orders', icon: <ReceiptLongRoundedIcon /> },
];

function ApiStatus() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let active = true;

    async function check() {
      try {
        await api.health();
        if (active) setStatus('online');
      } catch {
        if (active) setStatus('offline');
      }
    }

    check();
    const interval = setInterval(check, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const isOnline = status === 'online';
  const isOffline = status === 'offline';

  return (
    <Chip
      size="small"
      variant="outlined"
      color={isOnline ? 'success' : isOffline ? 'error' : 'default'}
      icon={
        isOnline ? (
          <CheckCircleRoundedIcon />
        ) : isOffline ? (
          <WifiOffRoundedIcon />
        ) : (
          <SyncRoundedIcon />
        )
      }
      label={isOnline ? 'Online' : isOffline ? 'Offline' : 'Checking'}
      sx={{
        height: 24,
        fontSize: 11,
        '& .MuiChip-icon': { fontSize: 14 },
      }}
    />
  );
}

function SidebarContent({ onNavigate }) {
  const location = useLocation();

  return (
    <Stack sx={{ height: '100%' }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', px: 2.5, py: 2.5 }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2.5,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            background: 'linear-gradient(135deg, #6366f1 0%, #0ea5e9 100%)',
            boxShadow: '0 8px 20px rgba(79, 70, 229, 0.28)',
          }}
        >
          <StorefrontRoundedIcon fontSize="small" />
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
            CRUD Studio
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Inventory workspace
          </Typography>
        </Box>
      </Stack>

      <Divider />

      <List sx={{ px: 1.5, py: 2 }}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ px: 1.5, fontWeight: 700, letterSpacing: '0.1em' }}
        >
          Workspace
        </Typography>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);

          return (
            <ListItem key={item.to} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NavLink}
                to={item.to}
                selected={isActive}
                onClick={onNavigate}
                sx={{
                  borderRadius: 2.5,
                  py: 1.1,
                  px: 1.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': { color: 'inherit' },
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 38, color: 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { sx: { fontWeight: 600, fontSize: 14 } } }}
                />
                {isActive && <ChevronRightRoundedIcon fontSize="small" />}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ mt: 'auto', p: 2 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.12 : 0.04),
          }}
        >
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              API STATUS
            </Typography>
            <ApiStatus />
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Express + Supabase
            <br />
            localhost:5000
          </Typography>
        </Box>
      </Box>
    </Stack>
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { mode, toggle } = useColorMode();
  const location = useLocation();

  const current =
    NAV_ITEMS.find((item) =>
      item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
    ) ?? { label: 'Page' };

  const drawer = <SidebarContent onNavigate={() => setMobileOpen(false)} />;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.86),
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, md: 72 }, gap: 1 }}>
          <IconButton
            edge="start"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: 'none' } }}
          >
            <MenuRoundedIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              CRUD Studio
            </Typography>
            <Typography variant="h6" noWrap sx={{ lineHeight: 1.15 }}>
              {current.label}
            </Typography>
          </Box>

          <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton onClick={toggle} aria-label="Toggle color mode">
              {mode === 'dark' ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
            </IconButton>
          </Tooltip>

          <Avatar
            sx={{
              width: 36,
              height: 36,
              fontSize: 13,
              fontWeight: 800,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: { xs: 'none', sm: 'flex' },
            }}
          >
            CS
          </Avatar>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, md: 72 } }} />
        <Box
          component="main"
          sx={{
            px: { xs: 2, sm: 3, lg: 4 },
            py: { xs: 3, md: 4 },
            maxWidth: 1600,
            mx: 'auto',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
