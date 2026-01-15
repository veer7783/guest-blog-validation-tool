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
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Collapse,
  Paper
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import axios from 'axios';

interface ActivityLogEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

const ActivityLog: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const params: any = {
        page: page + 1,
        limit: rowsPerPage
      };
      
      if (actionFilter) params.action = actionFilter;
      if (entityTypeFilter) params.entityType = entityTypeFilter;
      
      const response = await axios.get(`${API_BASE_URL}/activity-logs`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      if (response.data.success) {
        setLogs(response.data.data.logs);
        setTotal(response.data.data.pagination.total);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, rowsPerPage, actionFilter, entityTypeFilter]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getActionColor = (action: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    if (action.includes('DELETE')) return 'error';
    if (action.includes('CREATE') || action.includes('UPLOAD')) return 'success';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'info';
    if (action.includes('LOGIN')) return 'primary';
    if (action.includes('LOGOUT')) return 'warning';
    if (action.includes('PUSH') || action.includes('MOVE')) return 'secondary';
    return 'default';
  };

  const formatAction = (action: string): string => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const actionOptions = [
    'LOGIN',
    'LOGOUT',
    'CSV_UPLOADED',
    'DATA_IN_PROCESS_UPDATED',
    'DATA_IN_PROCESS_DELETED',
    'DATA_IN_PROCESS_BULK_DELETED',
    'DATA_MARKED_AS_REACHED',
    'DATA_FINAL_UPDATED',
    'DATA_FINAL_DELETED',
    'DATA_FINAL_BULK_DELETED',
    'PUSH_TO_MAIN_PROJECT',
    'PUSHED_DATA_DELETED',
    'USER_CREATED',
    'USER_UPDATED',
    'USER_DELETED',
    'PASSWORD_CHANGED'
  ];

  const entityTypeOptions = [
    'User',
    'DataInProcess',
    'DataFinal',
    'DataUploadTask'
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Activity Log
        </Typography>
        <Box>
          <Tooltip title="Toggle Filters">
            <IconButton onClick={() => setShowFilters(!showFilters)} color={showFilters ? 'primary' : 'default'}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchLogs} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Collapse in={showFilters}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Action</InputLabel>
                <Select
                  value={actionFilter}
                  label="Action"
                  onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
                >
                  <MenuItem value="">All Actions</MenuItem>
                  {actionOptions.map(action => (
                    <MenuItem key={action} value={action}>{formatAction(action)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Entity Type</InputLabel>
                <Select
                  value={entityTypeFilter}
                  label="Entity Type"
                  onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(0); }}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {entityTypeOptions.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>
      </Collapse>

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : logs.length === 0 ? (
            <Typography color="text.secondary" align="center" py={4}>
              No activity logs found
            </Typography>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width={40}></TableCell>
                      <TableCell>Date & Time</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Entity Type</TableCell>
                      <TableCell>IP Address</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.map((log) => (
                      <React.Fragment key={log.id}>
                        <TableRow 
                          hover 
                          sx={{ cursor: 'pointer' }}
                          onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                        >
                          <TableCell>
                            <IconButton size="small">
                              {expandedRow === log.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(log.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {log.user.firstName} {log.user.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {log.user.email}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={formatAction(log.action)} 
                              size="small" 
                              color={getActionColor(log.action)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {log.entityType}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {log.ipAddress || '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                        
                        {/* Expanded Details Row */}
                        <TableRow>
                          <TableCell colSpan={6} sx={{ py: 0, borderBottom: expandedRow === log.id ? 1 : 0 }}>
                            <Collapse in={expandedRow === log.id} timeout="auto" unmountOnExit>
                              <Box sx={{ py: 2, px: 2, bgcolor: 'grey.50', borderRadius: 1, my: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Details
                                </Typography>
                                {log.entityId && (
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    <strong>Entity ID:</strong> {log.entityId}
                                  </Typography>
                                )}
                                {log.details && (
                                  <Paper variant="outlined" sx={{ p: 1, mt: 1, bgcolor: 'background.paper' }}>
                                    <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>
                                      {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                  </Paper>
                                )}
                                {log.userAgent && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                    <strong>User Agent:</strong> {log.userAgent}
                                  </Typography>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[25, 50, 100, 250, 500]}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ActivityLog;
