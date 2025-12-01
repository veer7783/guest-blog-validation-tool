import React, { useState, useEffect } from 'react';
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
    email: ''
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
    role: 'ADMIN'
  });
  
  // Authenticator dialog
  const [showAuthenticatorDialog, setShowAuthenticatorDialog] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users', {
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
      email: user.email
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/users/${selectedUser.id}`,
        editFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

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
        `http://localhost:5000/api/users/${selectedUser.id}/password`,
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

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/users',
        {
          firstName: createFormData.firstName,
          lastName: createFormData.lastName,
          email: createFormData.email,
          password: createFormData.password,
          role: createFormData.role
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
          role: 'ADMIN'
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
        `http://localhost:5000/api/users/${user.id}/reset-2fa`,
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
        `http://localhost:5000/api/users/${user.id}/setup-2fa`,
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
        `http://localhost:5000/api/users/${user.id}/status`,
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
                  {users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {user.firstName} {user.lastName}
                        </Typography>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                          color={user.role === 'SUPER_ADMIN' ? 'secondary' : 'primary'}
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
            />
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
            </TextField>
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
