import React, { useState, useEffect, useMemo } from 'react';
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
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Checkbox,
} from '@mui/material';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface PushedDataRecord {
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
  mainProjectId: string;
  pushedAt: string;
  pushedBy?: string;
  pushedByUser?: {
    firstName: string;
    lastName: string;
  };
}

const PushedData: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<PushedDataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<PushedDataRecord | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPublisher, setSelectedPublisher] = useState('');
  
  // Delete state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<'single' | 'bulk'>('single');
  const [recordToDelete, setRecordToDelete] = useState<PushedDataRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Get unique publishers for filter dropdown
  const publishers = useMemo(() => {
    const uniquePublishers = new Set<string>();
    data.forEach(record => {
      if (record.publisherName) {
        uniquePublishers.add(record.publisherName);
      }
    });
    return Array.from(uniquePublishers).sort();
  }, [data]);

  // Filter data based on search and publisher filter
  const filteredData = useMemo(() => {
    return data.filter(record => {
      // Search filter - match site URL
      const matchesSearch = searchQuery === '' || 
        record.websiteUrl.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Publisher filter
      const matchesPublisher = selectedPublisher === '' || 
        record.publisherName === selectedPublisher;
      
      return matchesSearch && matchesPublisher;
    });
  }, [data, searchQuery, selectedPublisher]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedPublisher('');
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/data-final/pushed', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Get pushed records directly from the new endpoint
      const pushedRecords = response.data.data || [];
      
      setData(pushedRecords);
      setError('');
    } catch (err: any) {
      console.error('Error fetching pushed data:', err);
      setError(err.response?.data?.message || 'Failed to fetch pushed data');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (record: PushedDataRecord) => {
    setSelectedRecord(record);
    setShowViewDialog(true);
  };

  // Selection handlers
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedIds(filteredData.map(record => record.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  // Delete handlers
  const handleDeleteClick = (record: PushedDataRecord) => {
    setRecordToDelete(record);
    setDeleteTarget('single');
    setShowDeleteDialog(true);
  };

  const handleBulkDeleteClick = () => {
    setDeleteTarget('bulk');
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const idsToDelete = deleteTarget === 'single' && recordToDelete 
        ? [recordToDelete.id] 
        : selectedIds;

      const response = await axios.delete('http://localhost:5000/api/data-final/pushed', {
        headers: { Authorization: `Bearer ${token}` },
        data: { ids: idsToDelete }
      });

      if (response.data.success) {
        setSuccessMessage(`Successfully deleted ${idsToDelete.length} record(s)`);
        setSelectedIds([]);
        fetchData();
      }
    } catch (err: any) {
      console.error('Error deleting records:', err);
      setError(err.response?.data?.message || 'Failed to delete records');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
      setRecordToDelete(null);
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
      case 'DONE':
        return 'success';
      case 'IN_PROGRESS':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Pushed Data
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        View all sites that have been successfully transferred to the Link Management Tool
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      <Card>
        <CardContent>
          {/* Search and Filter Section */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search by site URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Publisher</InputLabel>
              <Select
                value={selectedPublisher}
                onChange={(e) => setSelectedPublisher(e.target.value)}
                label="Filter by Publisher"
              >
                <MenuItem value="">All Publishers</MenuItem>
                {publishers.map((publisher) => (
                  <MenuItem key={publisher} value={publisher}>
                    {publisher}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {(searchQuery || selectedPublisher) && (
              <Button
                variant="outlined"
                size="small"
                onClick={handleClearFilters}
                startIcon={<ClearIcon />}
              >
                Clear Filters
              </Button>
            )}
          </Box>

          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6">
                {filteredData.length === data.length 
                  ? `Total Pushed Sites: ${data.length}`
                  : `Showing ${filteredData.length} of ${data.length} sites`
                }
              </Typography>
              {selectedIds.length > 0 && (
                <Chip 
                  label={`${selectedIds.length} selected`} 
                  color="primary" 
                  size="small"
                  onDelete={() => setSelectedIds([])}
                />
              )}
            </Box>
            {selectedIds.length > 0 && (
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<DeleteIcon />}
                onClick={handleBulkDeleteClick}
              >
                Delete Selected ({selectedIds.length})
              </Button>
            )}
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : data.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="body1" color="text.secondary">
                No pushed sites yet. Sites will appear here after being transferred to the Link Management Tool.
              </Typography>
            </Box>
          ) : filteredData.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="body1" color="text.secondary">
                No sites match your search criteria.
              </Typography>
              <Button 
                variant="text" 
                onClick={handleClearFilters}
                sx={{ mt: 1 }}
              >
                Clear Filters
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedIds.length > 0 && selectedIds.length < filteredData.length}
                        checked={filteredData.length > 0 && selectedIds.length === filteredData.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell><strong>Site URL</strong></TableCell>
                    <TableCell><strong>Publisher</strong></TableCell>
                    <TableCell><strong>DA</strong></TableCell>
                    <TableCell><strong>DR</strong></TableCell>
                    <TableCell><strong>Traffic</strong></TableCell>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell><strong>GB Base Price</strong></TableCell>
                    <TableCell><strong>LI Base Price</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Pushed At</strong></TableCell>
                    <TableCell><strong>Pushed By</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map((row) => (
                    <TableRow 
                      key={row.id} 
                      hover
                      selected={selectedIds.includes(row.id)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(row.id)}
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
                        {row.category || <Typography variant="caption" color="text.secondary">Not set</Typography>}
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
                        <Typography variant="caption">
                          {new Date(row.pushedAt).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {row.pushedByUser ? (
                          <Typography variant="body2">
                            {row.pushedByUser.firstName} {row.pushedByUser.lastName}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">Unknown</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              color="info"
                              onClick={() => handleView(row)}
                            >
                              <RemoveRedEyeIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteClick(row)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onClose={() => setShowViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Site Details</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Site URL</Typography>
              <Typography variant="body1" sx={{ mb: 2, fontFamily: 'monospace', fontWeight: 'bold' }}>
                {selectedRecord.websiteUrl}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">Publisher Information</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedRecord.publisherName || 'Not set'} ({selectedRecord.publisherEmail || 'No email'})
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">Metrics</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                DA: {selectedRecord.da || '-'} | DR: {selectedRecord.dr || '-'} | 
                Traffic: {selectedRecord.traffic || '-'} | SS: {selectedRecord.ss || '-'}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">Pricing</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                GB Base Price: ${selectedRecord.gbBasePrice || 'Not set'} | 
                LI Base Price: ${selectedRecord.liBasePrice || 'Not set'}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">Transfer Information</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Main Project ID: {selectedRecord.mainProjectId}<br />
                Pushed At: {new Date(selectedRecord.pushedAt).toLocaleString()}<br />
                Pushed By: {selectedRecord.pushedByUser ? 
                  `${selectedRecord.pushedByUser.firstName} ${selectedRecord.pushedByUser.lastName}` : 
                  'Unknown'}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">Status</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label={selectedRecord.status} color={getStatusColor(selectedRecord.status) as any} />
                <Chip label={selectedRecord.negotiationStatus} color={getNegotiationStatusColor(selectedRecord.negotiationStatus) as any} />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={showDeleteDialog} 
        onClose={() => !deleting && setShowDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {deleteTarget === 'single' && recordToDelete ? (
              <>
                Are you sure you want to delete <strong>{recordToDelete.websiteUrl}</strong>?
                <br /><br />
                This will remove the record from the pushed data list. The site will remain in the main tool.
              </>
            ) : (
              <>
                Are you sure you want to delete <strong>{selectedIds.length}</strong> selected record(s)?
                <br /><br />
                This will remove the records from the pushed data list. The sites will remain in the main tool.
              </>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowDeleteDialog(false)} 
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PushedData;
