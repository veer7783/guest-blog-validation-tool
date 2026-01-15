import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  remainingTasks?: number;
}

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    assignedAdminId: ''
  });
  
  // Password dialog
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Create user dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'ADMIN',
    assignedAdminId: ''
  });
  
  // Authenticator dialog
  const [showAuthenticatorDialog, setShowAuthenticatorDialog] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  
  const [saving, setSaving] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUsers(response.data.data.users || []);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      assignedAdminId: (user as any).assignedAdminId || ''
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      console.log('Sending update request with data:', editFormData);
      
      const response = await axios.put(
        `${API_BASE_URL}/users/${selectedUser.id}`,
        editFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Update response:', response.data);

      if (response.data.success) {
        setSuccess('User updated successfully');
        setShowEditDialog(false);
        fetchUsers();
      }
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordDialog(true);
  };

  const handleSavePassword = async () => {
    if (!selectedUser) return;

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_BASE_URL}/users/${selectedUser.id}/password`,
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccess('Password changed successfully');
        setShowPasswordDialog(false);
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async () => {
    if (!createFormData.firstName || !createFormData.lastName || !createFormData.email || !createFormData.password) {
      setError('All fields are required');
      return;
    }

    if (createFormData.password !== createFormData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (createFormData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Validate assignedAdminId for CONTRIBUTOR role
    if (createFormData.role === 'CONTRIBUTOR' && !createFormData.assignedAdminId) {
      setError('Please assign an admin to this contributor');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/users`,
        {
          firstName: createFormData.firstName,
          lastName: createFormData.lastName,
          email: createFormData.email,
          password: createFormData.password,
          role: createFormData.role,
          assignedAdminId: createFormData.role === 'CONTRIBUTOR' ? createFormData.assignedAdminId : undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccess('User created successfully');
        setShowCreateDialog(false);
        setCreateFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'ADMIN',
          assignedAdminId: ''
        });
        fetchUsers();
      }
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleResetAuthenticator = async (user: User) => {
    if (!window.confirm(`Reset authenticator for ${user.firstName} ${user.lastName}?`)) {
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/users/${user.id}/reset-2fa`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccess('Authenticator reset successfully. User will need to set up 2FA again.');
        fetchUsers();
      }
    } catch (err: any) {
      console.error('Error resetting authenticator:', err);
      setError(err.response?.data?.message || 'Failed to reset authenticator');
    } finally {
      setSaving(false);
    }
  };

  const handleSetupAuthenticator = async (user: User) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/users/${user.id}/setup-2fa`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setQrCode(response.data.data.qrCode);
        setSecret(response.data.data.secret);
        setSelectedUser(user);
        setShowAuthenticatorDialog(true);
      }
    } catch (err: any) {
      console.error('Error setting up authenticator:', err);
      setError(err.response?.data?.message || 'Failed to setup authenticator');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_BASE_URL}/users/${user.id}/status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccess(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
        fetchUsers();
      }
    } catch (err: any) {
      console.error('Error toggling user status:', err);
      setError(err.response?.data?.message || 'Failed to toggle user status');
    }
  };

  // Paginated data
  const paginatedUsers = users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Handle page change
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        User Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage system users, roles, and permissions (Super Admin Only)
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Add New User Button */}
      {currentUser?.role === 'SUPER_ADMIN' && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateDialog(true)}
          >
            Add New User
          </Button>
        </Box>
      )}

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Role</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    {currentUser?.role === 'SUPER_ADMIN' && (
                      <TableCell><strong>Remaining Tasks</strong></TableCell>
                    )}
                    <TableCell><strong>Created At</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {user.firstName} {user.lastName}
                        </Typography>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={
                            user.role === 'SUPER_ADMIN' ? 'Super Admin' : 
                            user.role === 'ADMIN' ? 'Admin' : 
                            user.role === 'CONTRIBUTOR' ? 'Contributor' : 'User'
                          }
                          color={
                            user.role === 'SUPER_ADMIN' ? 'secondary' : 
                            user.role === 'ADMIN' ? 'primary' : 
                            user.role === 'CONTRIBUTOR' ? 'info' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.isActive ? 'Active' : 'Inactive'}
                          color={user.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      {currentUser?.role === 'SUPER_ADMIN' && (
                        <TableCell>
                          <Chip
                            label={`${user.remainingTasks || 0} tasks`}
                            color={user.remainingTasks && user.remainingTasks > 0 ? 'warning' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit User">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(user)}
                            sx={{ mr: 0.5 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Change Password">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => handleChangePassword(user)}
                            sx={{ mr: 0.5 }}
                          >
                            <Typography sx={{ fontSize: '16px' }}>🔑</Typography>
                          </IconButton>
                        </Tooltip>
                        {user.role === 'SUPER_ADMIN' && (
                          <>
                            <Tooltip title="Setup 2FA">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleSetupAuthenticator(user)}
                                sx={{ mr: 0.5 }}
                              >
                                <Typography sx={{ fontSize: '16px' }}>📱</Typography>
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reset 2FA">
                              <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => handleResetAuthenticator(user)}
                                sx={{ mr: 0.5 }}
                              >
                                <Typography sx={{ fontSize: '16px' }}>🔄</Typography>
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        <Tooltip title={user.isActive ? 'Deactivate User' : 'Activate User'}>
                          <IconButton
                            size="small"
                            color={user.isActive ? 'error' : 'success'}
                            onClick={() => handleToggleStatus(user)}
                          >
                            {user.isActive ? <DeleteIcon fontSize="small" /> : <Typography sx={{ fontSize: '16px' }}>✅</Typography>}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {/* Pagination - show when data exists */}
          {users.length > 0 && (
            <TablePagination
              component="div"
              count={users.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[25, 50, 100, 250, 500]}
              showFirstButton
              showLastButton
            />
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="First Name"
              value={editFormData.firstName}
              onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Last Name"
              value={editFormData.lastName}
              onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              select
              label="Role"
              value={editFormData.role}
              onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
              sx={{ mb: 2 }}
              SelectProps={{ native: true }}
            >
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="USER">User</option>
              <option value="CONTRIBUTOR">Contributor</option>
            </TextField>
            {editFormData.role === 'CONTRIBUTOR' && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Assigned Admin *
                </Typography>
                <TextField
                  fullWidth
                  select
                  value={editFormData.assignedAdminId}
                  onChange={(e) => setEditFormData({ ...editFormData, assignedAdminId: e.target.value })}
                  SelectProps={{ native: true }}
                  required
                  helperText="Select an admin to handle this contributor's uploads"
                >
                  <option value="">-- Select Admin --</option>
                  {users
                    .filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN')
                    .map(admin => (
                      <option key={admin.id} value={admin.id}>
                        {admin.firstName} {admin.lastName} ({admin.role})
                      </option>
                    ))}
                </TextField>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Changing password for: <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>
            </Typography>
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              sx={{ mb: 2 }}
              helperText="Minimum 6 characters"
            />
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
          <Button onClick={handleSavePassword} variant="contained" color="warning" disabled={saving}>
            {saving ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="First Name"
              value={createFormData.firstName}
              onChange={(e) => setCreateFormData({ ...createFormData, firstName: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Last Name"
              value={createFormData.lastName}
              onChange={(e) => setCreateFormData({ ...createFormData, lastName: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={createFormData.email}
              onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              select
              label="Role"
              value={createFormData.role}
              onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
              sx={{ mb: 2 }}
              SelectProps={{ native: true }}
            >
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="USER">User</option>
              <option value="CONTRIBUTOR">Contributor</option>
            </TextField>
            {createFormData.role === 'CONTRIBUTOR' && (
              <TextField
                fullWidth
                select
                label="Assigned Admin"
                value={createFormData.assignedAdminId}
                onChange={(e) => setCreateFormData({ ...createFormData, assignedAdminId: e.target.value })}
                sx={{ mb: 2 }}
                SelectProps={{ native: true }}
                required
                helperText="Select an admin to handle this contributor's uploads"
              >
                <option value="">-- Select Admin --</option>
                {users
                  .filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN')
                  .map(admin => (
                    <option key={admin.id} value={admin.id}>
                      {admin.firstName} {admin.lastName} ({admin.role})
                    </option>
                  ))}
              </TextField>
            )}
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={createFormData.password}
              onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
              sx={{ mb: 2 }}
              helperText="Minimum 6 characters"
            />
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={createFormData.confirmPassword}
              onChange={(e) => setCreateFormData({ ...createFormData, confirmPassword: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained" color="primary" disabled={saving}>
            {saving ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Authenticator Setup Dialog */}
      <Dialog open={showAuthenticatorDialog} onClose={() => setShowAuthenticatorDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Scan this QR code with Google Authenticator or any TOTP app
            </Typography>
            {qrCode && (
              <Box sx={{ mb: 2 }}>
                <img src={qrCode} alt="QR Code" style={{ maxWidth: '250px' }} />
              </Box>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Or enter this secret manually:
            </Typography>
            <TextField
              fullWidth
              value={secret}
              InputProps={{ readOnly: true }}
              sx={{ mb: 2 }}
            />
            <Alert severity="info">
              User will need to scan this QR code or enter the secret on their next login.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAuthenticatorDialog(false)} variant="contained">
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
