import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Tooltip,
  Checkbox
} from '@mui/material';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface DataFinalRecord {
  id: string;
  websiteUrl: string;
  publisherName?: string;
  publisherEmail?: string;
  da?: number;
  dr?: number;
  traffic?: number;
  ss?: number;
  category?: string;
  country?: string;
  language?: string;
  tat?: string;
  gbBasePrice?: number;
  liBasePrice?: number;
  status: string;
  negotiationStatus: string;
  createdAt: string;
  reachedBy?: string;
  reachedByName?: string;
  reachedAt?: string;
  lastModifiedBy?: string;
  lastModifiedByName?: string;
  reachedByUser?: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

const DataFinal: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DataFinalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<DataFinalRecord | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterByUser, setFilterByUser] = useState<string>('all');
  const [users, setUsers] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState('');
  
  // Edit form state
  const [editFormData, setEditFormData] = useState({
    publisherEmail: '',
    publisherName: '',
    da: '',
    dr: '',
    traffic: '',
    ss: '',
    category: '',
    country: '',
    language: '',
    tat: '',
    gbBasePrice: '',
    liBasePrice: '',
    status: '',
    negotiationStatus: ''
  });

  useEffect(() => {
    fetchData();
    if (user?.role === 'SUPER_ADMIN') {
      fetchUsers();
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [filterByUser]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users?limit=100', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(response.data.data.users || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = 'http://localhost:5000/api/data-final';
      if (filterByUser !== 'all') {
        url += `?reachedBy=${filterByUser}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = response.data.data;
      setData(result.data || []);
      setError('');
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (record: DataFinalRecord) => {
    setSelectedRecord(record);
    setShowViewDialog(true);
  };

  const handleEdit = (record: DataFinalRecord) => {
    setSelectedRecord(record);
    setEditFormData({
      publisherEmail: record.publisherEmail || '',
      publisherName: record.publisherName || '',
      da: record.da?.toString() || '',
      dr: record.dr?.toString() || '',
      traffic: record.traffic?.toString() || '',
      ss: record.ss?.toString() || '',
      category: record.category || '',
      country: record.country || '',
      language: record.language || '',
      tat: record.tat || '',
      gbBasePrice: record.gbBasePrice?.toString() || '',
      liBasePrice: record.liBasePrice?.toString() || '',
      status: record.status,
      negotiationStatus: record.negotiationStatus
    });
    setShowEditDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/data-final/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setData(data.filter(item => item.id !== id));
      alert('Record deleted successfully');
    } catch (err: any) {
      console.error('Error deleting record:', err);
      alert(err.response?.data?.message || 'Failed to delete record');
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedRecord) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Prepare update data
      const updateData = {
        publisherEmail: editFormData.publisherEmail,
        publisherName: editFormData.publisherName,
        da: editFormData.da ? parseInt(editFormData.da) : undefined,
        dr: editFormData.dr ? parseInt(editFormData.dr) : undefined,
        traffic: editFormData.traffic ? parseInt(editFormData.traffic) : undefined,
        ss: editFormData.ss ? parseInt(editFormData.ss) : undefined,
        category: editFormData.category,
        country: editFormData.country,
        language: editFormData.language,
        tat: editFormData.tat,
        gbBasePrice: editFormData.gbBasePrice ? parseFloat(editFormData.gbBasePrice) : undefined,
        liBasePrice: editFormData.liBasePrice ? parseFloat(editFormData.liBasePrice) : undefined,
        status: editFormData.status,
        negotiationStatus: editFormData.negotiationStatus
      };

      const response = await axios.put(
        `http://localhost:5000/api/data-final/${selectedRecord.id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Update the record in the list
        setData(data.map(item => 
          item.id === selectedRecord.id 
            ? { ...item, ...updateData }
            : item
        ));
        alert('Record updated successfully');
        setShowEditDialog(false);
        setSelectedRecord(null);
      }
    } catch (err: any) {
      console.error('Error updating record:', err);
      alert(err.response?.data?.message || 'Failed to update record');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allIds = new Set(data.map(record => record.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      setError('Please select at least one record to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} record(s)?`)) {
      return;
    }

    setDeleting(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const deletePromises = Array.from(selectedIds).map(id =>
        axios.delete(`http://localhost:5000/api/data-final/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );

      await Promise.all(deletePromises);
      
      setSuccess(`Successfully deleted ${selectedIds.size} record(s)`);
      setSelectedIds(new Set());
      fetchData();
    } catch (err: any) {
      console.error('Error deleting records:', err);
      setError(err.response?.data?.message || 'Failed to delete records');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'default';
      default:
        return 'default';
    }
  };

  const getNegotiationStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'warning';
      case 'DONE':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Data Final
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Records marked as Reached by Admin users (Super Admin Only)
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Filter by User - Only for Super Admin */}
      {user?.role === 'SUPER_ADMIN' && (
        <Box sx={{ mb: 3 }}>
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>Filter by Completed By</InputLabel>
            <Select
              value={filterByUser}
              label="Filter by Completed By"
              onChange={(e) => setFilterByUser(e.target.value)}
            >
              <MenuItem value="all">All Users</MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      <Card>
        <CardContent>
          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2">
                {selectedIds.size} record(s) selected
              </Typography>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<DeleteIcon />}
                onClick={handleBulkDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Selected'}
              </Button>
            </Box>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : data.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="body1" color="text.secondary">
                No records in Data Final yet. Records will appear here when Admins mark them as Reached.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.size === data.length && data.length > 0}
                        indeterminate={selectedIds.size > 0 && selectedIds.size < data.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell><strong>Site URL</strong></TableCell>
                    <TableCell><strong>Publisher</strong></TableCell>
                    <TableCell><strong>DA</strong></TableCell>
                    <TableCell><strong>DR</strong></TableCell>
                    <TableCell><strong>Traffic</strong></TableCell>
                    <TableCell><strong>SS</strong></TableCell>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell><strong>Country</strong></TableCell>
                    <TableCell><strong>Language</strong></TableCell>
                    <TableCell><strong>TAT</strong></TableCell>
                    <TableCell><strong>GB Base Price</strong></TableCell>
                    <TableCell><strong>LI Base Price</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Negotiation Status</strong></TableCell>
                    <TableCell><strong>Marked As Reached By</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.has(row.id)}
                          onChange={() => handleSelectOne(row.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                          {row.websiteUrl}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {row.publisherName || <Typography variant="caption" color="text.secondary">Not set</Typography>}
                      </TableCell>
                      <TableCell>
                        {row.da || <Typography variant="caption" color="text.secondary">-</Typography>}
                      </TableCell>
                      <TableCell>
                        {row.dr || <Typography variant="caption" color="text.secondary">-</Typography>}
                      </TableCell>
                      <TableCell>
                        {row.traffic || <Typography variant="caption" color="text.secondary">-</Typography>}
                      </TableCell>
                      <TableCell>
                        {row.ss || <Typography variant="caption" color="text.secondary">-</Typography>}
                      </TableCell>
                      <TableCell>
                        {row.category || <Typography variant="caption" color="text.secondary">Not set</Typography>}
                      </TableCell>
                      <TableCell>
                        {row.country || <Typography variant="caption" color="text.secondary">Not set</Typography>}
                      </TableCell>
                      <TableCell>
                        {row.language || <Typography variant="caption" color="text.secondary">Not set</Typography>}
                      </TableCell>
                      <TableCell>
                        {row.tat || <Typography variant="caption" color="text.secondary">Not set</Typography>}
                      </TableCell>
                      <TableCell>
                        {row.gbBasePrice ? `$${row.gbBasePrice}` : <Typography variant="caption" color="text.secondary">Not set</Typography>}
                      </TableCell>
                      <TableCell>
                        {row.liBasePrice ? `$${row.liBasePrice}` : <Typography variant="caption" color="text.secondary">Not set</Typography>}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={row.status} 
                          color={getStatusColor(row.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={row.negotiationStatus.replace('_', ' ')} 
                          color={getNegotiationStatusColor(row.negotiationStatus) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {row.reachedByUser ? (
                          <Box>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: 'primary.main',
                                fontWeight: 500
                              }}
                            >
                              {row.reachedByUser.firstName}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontSize: '0.7rem',
                                color: 'text.secondary',
                                display: 'block'
                              }}
                            >
                              {row.reachedByUser.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            {row.reachedByName || 'Unknown'}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleView(row)}
                          >
                            <RemoveRedEyeIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEdit(row)}
                            sx={{ ml: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDelete(row.id)}
                            sx={{ ml: 1 }}
                          >
                            <DeleteIcon fontSize="small" />
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

      {data.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Showing {data.length} record{data.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      )}

      {/* View Dialog */}
      <Dialog open={showViewDialog} onClose={() => setShowViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>View Record Details</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedRecord && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Website URL"
                  value={selectedRecord.websiteUrl}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Publisher Name"
                  value={selectedRecord.publisherName || 'Not set'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Publisher Email"
                  value={selectedRecord.publisherEmail || 'Not set'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="DA"
                  value={selectedRecord.da || '-'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="DR"
                  value={selectedRecord.dr || '-'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="Traffic"
                  value={selectedRecord.traffic || '-'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="SS"
                  value={selectedRecord.ss || '-'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Category"
                  value={selectedRecord.category || 'Not set'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Country"
                  value={selectedRecord.country || 'Not set'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Language"
                  value={selectedRecord.language || 'Not set'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="TAT"
                  value={selectedRecord.tat || 'Not set'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Status"
                  value={selectedRecord.status}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="GB Base Price"
                  value={selectedRecord.gbBasePrice ? `$${selectedRecord.gbBasePrice}` : 'Not set'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="LI Base Price"
                  value={selectedRecord.liBasePrice ? `$${selectedRecord.liBasePrice}` : 'Not set'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Negotiation Status"
                  value={selectedRecord.negotiationStatus.replace('_', ' ')}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Created At"
                  value={formatDate(selectedRecord.createdAt)}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Record</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedRecord && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Site URL: <strong>{selectedRecord.websiteUrl}</strong> (Non-editable)
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Publisher Name"
                    value={editFormData.publisherName}
                    onChange={(e) => setEditFormData({...editFormData, publisherName: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Publisher Email"
                    value={editFormData.publisherEmail}
                    onChange={(e) => setEditFormData({...editFormData, publisherEmail: e.target.value})}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    label="DA"
                    type="number"
                    value={editFormData.da}
                    onChange={(e) => setEditFormData({...editFormData, da: e.target.value})}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    label="DR"
                    type="number"
                    value={editFormData.dr}
                    onChange={(e) => setEditFormData({...editFormData, dr: e.target.value})}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    label="Traffic"
                    type="number"
                    value={editFormData.traffic}
                    onChange={(e) => setEditFormData({...editFormData, traffic: e.target.value})}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    label="SS"
                    type="number"
                    value={editFormData.ss}
                    onChange={(e) => setEditFormData({...editFormData, ss: e.target.value})}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Category"
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={editFormData.country}
                    onChange={(e) => setEditFormData({...editFormData, country: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Language"
                    value={editFormData.language}
                    onChange={(e) => setEditFormData({...editFormData, language: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="TAT"
                    value={editFormData.tat}
                    onChange={(e) => setEditFormData({...editFormData, tat: e.target.value})}
                    placeholder="e.g., 1-2 days"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="GB Base Price"
                    type="number"
                    value={editFormData.gbBasePrice}
                    onChange={(e) => setEditFormData({...editFormData, gbBasePrice: e.target.value})}
                    InputProps={{ startAdornment: '$' }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="LI Base Price"
                    type="number"
                    value={editFormData.liBasePrice}
                    onChange={(e) => setEditFormData({...editFormData, liBasePrice: e.target.value})}
                    InputProps={{ startAdornment: '$' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={editFormData.status}
                      label="Status"
                      onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                    >
                      <MenuItem value="ACTIVE">Active</MenuItem>
                      <MenuItem value="INACTIVE">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Negotiation Status</InputLabel>
                    <Select
                      value={editFormData.negotiationStatus}
                      label="Negotiation Status"
                      onChange={(e) => setEditFormData({...editFormData, negotiationStatus: e.target.value})}
                    >
                      <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                      <MenuItem value="DONE">Done</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained" 
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataFinal;
