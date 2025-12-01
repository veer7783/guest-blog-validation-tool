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
  Tooltip
} from '@mui/material';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

interface DataInProcess {
  id: string;
  websiteUrl: string;
  publisherEmail?: string;
  publisherName?: string;
  da?: number;
  dr?: number;
  traffic?: number;
  ss?: number;
  category?: string;
  country?: string;
  language?: string;
  tat?: string;
  status: string;
  createdAt: string;
  uploadTask?: {
    fileName: string;
    assignedTo: string;
    assignedToUser?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

const DataManagement: React.FC = () => {
  const [data, setData] = useState<DataInProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<DataInProcess | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  
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
    status: ''
  });

  // Get user role from localStorage or auth context
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || '');
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/data-in-process', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Backend returns { data: { data: [...], pagination: {...} } }
        const result = response.data.data;
        setData(result.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'REACHED':
        return 'success';
      case 'NOT_REACHED':
        return 'error';
      case 'VERIFIED':
        return 'info';
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

  const handleView = (record: DataInProcess) => {
    setSelectedRecord(record);
    setShowViewDialog(true);
  };

  const handleEdit = (record: DataInProcess) => {
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
      status: record.status
    });
    setShowEditDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/data-in-process/${id}`, {
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
        status: editFormData.status
      };

      const response = await axios.put(
        `http://localhost:5000/api/data-in-process/${selectedRecord.id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // If status changed to REACHED, remove from list (moved to Data Final)
        if (editFormData.status === 'REACHED') {
          setData(data.filter(item => item.id !== selectedRecord.id));
          alert('Record marked as Reached and moved to Data Final!');
        } else {
          // Update the record in the list
          setData(data.map(item => 
            item.id === selectedRecord.id 
              ? { ...item, ...updateData }
              : item
          ));
          alert('Record updated successfully');
        }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '🕓';
      case 'REACHED':
        return '🟢';
      case 'NOT_REACHED':
        return '🔴';
      case 'NO_ACTION_NEEDED':
        return '⚪';
      default:
        return '🕓';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'REACHED':
        return 'Reached';
      case 'NOT_REACHED':
        return 'Not Reached';
      case 'NO_ACTION_NEEDED':
        return 'No Action Needed';
      default:
        return status;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Data Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        View and manage guest blog website data in process
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : data.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="body1" color="text.secondary">
                No data available. Upload a CSV file to get started.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Site URL</strong></TableCell>
                    <TableCell><strong>Publisher Email</strong></TableCell>
                    <TableCell><strong>Publisher Name</strong></TableCell>
                    <TableCell><strong>DA</strong></TableCell>
                    <TableCell><strong>DR</strong></TableCell>
                    <TableCell><strong>Traffic</strong></TableCell>
                    <TableCell><strong>SS</strong></TableCell>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell><strong>Country</strong></TableCell>
                    <TableCell><strong>Language</strong></TableCell>
                    <TableCell><strong>TAT</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Last Modified By</strong></TableCell>
                    {userRole === 'SUPER_ADMIN' && <TableCell><strong>Assigned To</strong></TableCell>}
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                          {row.websiteUrl}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {row.publisherEmail || <Typography variant="caption" color="text.secondary">Not set</Typography>}
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{getStatusIcon(row.status)}</span>
                          <Chip 
                            label={getStatusLabel(row.status)} 
                            color={getStatusColor(row.status) as any}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {(row as any).lastModifiedByName || 'Not modified'}
                        </Typography>
                      </TableCell>
                      {userRole === 'SUPER_ADMIN' && (
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {row.uploadTask?.assignedToUser 
                              ? `${row.uploadTask.assignedToUser.firstName} ${row.uploadTask.assignedToUser.lastName}`
                              : 'Not assigned'}
                          </Typography>
                        </TableCell>
                      )}
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {row.uploadTask?.fileName || 'Unknown'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(row.createdAt)}
                        </Typography>
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
                        <Tooltip title="Edit Status">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEdit(row)}
                            sx={{ ml: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {userRole === 'SUPER_ADMIN' && (
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
                        )}
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
                  label="Category"
                  value={selectedRecord.category || 'Not set'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={6}>
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
                  label="Country"
                  value={selectedRecord.country || 'Not set'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Status"
                  value={`${getStatusIcon(selectedRecord.status)} ${getStatusLabel(selectedRecord.status)}`}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Upload Source"
                  value={selectedRecord.uploadTask?.fileName || 'Unknown'}
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
                    label="Publisher Email"
                    value={editFormData.publisherEmail}
                    onChange={(e) => setEditFormData({...editFormData, publisherEmail: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Publisher Name"
                    value={editFormData.publisherName}
                    onChange={(e) => setEditFormData({...editFormData, publisherName: e.target.value})}
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="TAT (Turnaround Time)"
                    value={editFormData.tat}
                    onChange={(e) => setEditFormData({...editFormData, tat: e.target.value})}
                    placeholder="e.g., 1-2 days"
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
                      <MenuItem value="PENDING">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>🕓</span> Pending
                        </Box>
                      </MenuItem>
                      <MenuItem value="REACHED">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>🟢</span> Reached
                        </Box>
                      </MenuItem>
                      <MenuItem value="NOT_REACHED">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>🔴</span> Not Reached
                        </Box>
                      </MenuItem>
                      <MenuItem value="NO_ACTION_NEEDED">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>⚪</span> No Action Needed
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              {editFormData.status === 'REACHED' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <strong>Note:</strong> Marking as "Reached" will move this record to Data Final page.
                </Alert>
              )}
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

export default DataManagement;
