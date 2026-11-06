import { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
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
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import { api } from '../api/client.js';
import { useAsyncData } from '../hooks/useAsyncData.js';
import { initials } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import SearchField from '../components/SearchField.jsx';
import TableLoadingRows from '../components/TableLoadingRows.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import UserFormDialog from '../components/UserFormDialog.jsx';
import { useToast } from '../components/ToastProvider.jsx';

export default function UsersPage() {
  const { data, loading, error, reload } = useAsyncData(api.users.list);
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const { show } = useToast();

  const users = data ?? [];

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return users;
    return users.filter((user) =>
      `${user.uname} ${user.email}`.toLowerCase().includes(search)
    );
  }, [users, query]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
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
      await api.users.remove(deleting.uid);
      show('User deleted.');
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
        title="Users"
        subtitle="Manage customer accounts and contact details. Passwords are never exposed by the API."
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
            Add user
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
          placeholder="Search users by name or email..."
          sx={{ flexGrow: 1 }}
        />
        <Typography variant="body2" color="text.secondary" noWrap>
          Showing {filtered.length} of {users.length} users
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
          <Table sx={{ minWidth: 680 }}>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email address</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {initialLoading && <TableLoadingRows rows={5} columns={3} />}

              {!initialLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} sx={{ border: 0 }}>
                    <EmptyState
                      icon={<PeopleAltRoundedIcon />}
                      title={users.length === 0 ? 'No users yet' : 'No matching users'}
                      description={
                        users.length === 0
                          ? 'Add your first user so orders can be assigned to a customer.'
                          : 'Try a different name or email, or clear the search.'
                      }
                      action={
                        users.length === 0 ? (
                          <Button
                            variant="contained"
                            startIcon={<AddRoundedIcon />}
                            onClick={openCreate}
                          >
                            Add user
                          </Button>
                        ) : (
                          <Button onClick={() => setQuery('')}>Clear search</Button>
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              )}

              {filtered.map((user) => (
                <TableRow key={user.uid} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Avatar
                        sx={{
                          width: 38,
                          height: 38,
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          fontSize: 13,
                          fontWeight: 800,
                        }}
                      >
                        {initials(user.uname)}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                          {user.uname}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          UID #{user.uid}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {user.email}
                    </Typography>
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title="Edit user">
                      <IconButton size="small" onClick={() => openEdit(user)}>
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete user">
                      <IconButton size="small" color="error" onClick={() => setDeleting(user)}>
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

      <UserFormDialog open={formOpen} user={editing} onClose={closeForm} onSaved={reload} />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete user?"
        description={
          deleting
            ? `${deleting.uname} and all orders placed by this user will be permanently deleted. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete user"
        loading={deleteBusy}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  );
}
