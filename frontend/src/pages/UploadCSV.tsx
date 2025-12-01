import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Button, 
  CircularProgress, 
  Alert,
  LinearProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  CloudUpload as UploadIcon, 
  Download as DownloadIcon,
  CheckCircle as CheckIcon 
} from '@mui/icons-material';
import axios from 'axios';

interface UploadResult {
  uploadTask: {
    fileName: string;
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    duplicateRecords: number;
  };
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    uniqueRows: number;
    duplicateRows: number;
    duplicatesInCSV?: number;
    duplicatesInSystem?: number;
    duplicatesInMainProject?: number;
    duplicatesInCurrentSystem?: number;
  };
  invalidRows?: Array<{
    row: number;
    data: any;
    errors: string[];
  }>;
  duplicateDomains?: string[];
  duplicateDetails?: Array<{
    domain: string;
    source: string;
  }>;
  csvDuplicates?: string[];
  newDomains?: string[];
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

const UploadCSV: React.FC = () => {
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showDuplicatesDialog, setShowDuplicatesDialog] = useState(false);
  const [showNewDomainsDialog, setShowNewDomainsDialog] = useState(false);
  const [showInvalidDialog, setShowInvalidDialog] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch admin users on component mount
  React.useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/users', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          console.log('Fetched response:', response.data);
          // Backend returns { success: true, data: { users: [...], pagination: {...} } }
          const allUsers = response.data.data.users || [];
          console.log('All users:', allUsers);
          
          // Filter only Admin users (not Super Admin)
          const adminUsers = allUsers.filter((user: User) => user.role === 'ADMIN');
          console.log('Admin users:', adminUsers);
          setUsers(adminUsers);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/upload/template', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'guest_blog_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading template:', err);
      setError('Failed to download template. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setSelectedFile(file);
      setError('');
      setSuccess('');
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    if (!assignedTo) {
      setError('Please assign the task to an admin user before uploading');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setUploadResult(null);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('assignedTo', assignedTo);

      const response = await axios.post('http://localhost:5000/api/upload/csv', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setSuccess('CSV file uploaded successfully!');
        setUploadResult(response.data.data);
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else if (!response.data.success && response.data.message.includes('All domains are duplicates')) {
        // Handle case where all domains are duplicates
        setError(response.data.message);
        setUploadResult(response.data.data);
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (err: any) {
      console.error('Error uploading file:', err);
      const errorData = err.response?.data?.error;
      let errorMessage = 'Failed to upload file. Please try again.';
      
      if (errorData) {
        errorMessage = errorData.message;
        if (errorData.details) {
          errorMessage += ` ${errorData.details}`;
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Upload CSV File
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Upload a CSV file containing guest blog website data for validation
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

      {uploadResult && (
        <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: '#f5f5f5' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CheckIcon sx={{ color: 'success.main', mr: 1 }} />
            <Typography variant="h6" fontWeight="bold">
              Upload Complete!
            </Typography>
          </Box>
          <Box sx={{ borderTop: '2px solid #ddd', borderBottom: '2px solid #ddd', py: 2, my: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              📊 <strong>Total Domains:</strong> {uploadResult.summary.totalRows}
            </Typography>
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1" sx={{ color: 'success.main' }}>
                  ✅ <strong>New Domains:</strong> {uploadResult.summary.uniqueRows}
                </Typography>
                {uploadResult.newDomains && uploadResult.newDomains.length > 2 && (
                  <Chip 
                    label={`+${uploadResult.newDomains.length - 2} more`}
                    size="small"
                    color="success"
                    onClick={() => setShowNewDomainsDialog(true)}
                    sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
                  />
                )}
              </Box>
              {uploadResult.newDomains && uploadResult.newDomains.length > 0 && (
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', ml: 3, fontStyle: 'italic' }}>
                  {uploadResult.newDomains.slice(0, 2).join(', ')}
                  {uploadResult.newDomains.length > 2 && '...'}
                </Typography>
              )}
            </Box>
            
            {uploadResult.summary.duplicateRows > 0 && (
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" sx={{ color: 'warning.main' }}>
                    ⏭️ <strong>Skipped (Duplicates):</strong> {uploadResult.summary.duplicateRows}
                  </Typography>
                  {uploadResult.duplicateDomains && uploadResult.duplicateDomains.length > 5 && (
                    <Chip 
                      label={`+${uploadResult.duplicateDomains.length - 5} more`}
                      size="small"
                      color="warning"
                      onClick={() => setShowDuplicatesDialog(true)}
                      sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
                    />
                  )}
                </Box>
                
                {/* Show CSV duplicates */}
                {uploadResult.summary.duplicatesInCSV && uploadResult.summary.duplicatesInCSV > 0 && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', ml: 3, mt: 0.5 }}>
                    • {uploadResult.summary.duplicatesInCSV} duplicate(s) within CSV file
                  </Typography>
                )}
                
                {/* Show Main Project duplicates */}
                {uploadResult.summary.duplicatesInMainProject && uploadResult.summary.duplicatesInMainProject > 0 && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', ml: 3, mt: 0.5 }}>
                    • {uploadResult.summary.duplicatesInMainProject} already exist in Link Management App
                  </Typography>
                )}
                
                {/* Show Current System duplicates */}
                {uploadResult.summary.duplicatesInCurrentSystem && uploadResult.summary.duplicatesInCurrentSystem > 0 && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', ml: 3, mt: 0.5 }}>
                    • {uploadResult.summary.duplicatesInCurrentSystem} already exist in current project
                  </Typography>
                )}
                
                {uploadResult.duplicateDomains && uploadResult.duplicateDomains.length > 0 && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', ml: 3, fontStyle: 'italic', mt: 1 }}>
                    {uploadResult.duplicateDomains.slice(0, 5).join(', ')}
                    {uploadResult.duplicateDomains.length > 5 && '...'}
                  </Typography>
                )}
              </Box>
            )}
            
            {uploadResult.summary.invalidRows > 0 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" sx={{ color: 'error.main' }}>
                    ❌ <strong>Invalid Records:</strong> {uploadResult.summary.invalidRows}
                  </Typography>
                  {uploadResult.invalidRows && uploadResult.invalidRows.length > 5 && (
                    <Chip 
                      label={`+${uploadResult.invalidRows.length - 5} more`}
                      size="small"
                      color="error"
                      onClick={() => setShowInvalidDialog(true)}
                      sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
                    />
                  )}
                </Box>
                {uploadResult.invalidRows && uploadResult.invalidRows.length > 0 && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', ml: 3, fontStyle: 'italic' }}>
                    {uploadResult.invalidRows.slice(0, 5).map(inv => {
                      const domain = inv.data.site || inv.data.domain || 'Unknown';
                      return `${domain} (${inv.errors.join(', ')})`;
                    }).join('; ')}
                    {uploadResult.invalidRows.length > 5 && '...'}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
          {uploadResult.uploadTask && (
            <Typography variant="body2" color="text.secondary">
              File: {uploadResult.uploadTask.fileName}
            </Typography>
          )}
        </Paper>
      )}

      <Card>
        <CardContent>
          {/* Assign To Dropdown */}
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth required>
              <InputLabel id="assign-to-label">Assign To Admin User *</InputLabel>
              <Select
                labelId="assign-to-label"
                id="assign-to"
                value={assignedTo}
                label="Assign To Admin User *"
                onChange={(e) => setAssignedTo(e.target.value)}
                disabled={loadingUsers}
              >
                <MenuItem value="">
                  <em>-- Select an admin user --</em>
                </MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block', fontWeight: 'bold' }}>
              * Required: You must assign this task to an admin user before uploading.
            </Typography>
          </Box>

          <Box
            sx={{
              border: selectedFile ? '2px solid #1976d2' : '2px dashed #ccc',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              backgroundColor: selectedFile ? '#e3f2fd' : '#fafafa',
            }}
          >
            <UploadIcon sx={{ fontSize: 64, color: selectedFile ? '#1976d2' : '#999', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {selectedFile ? selectedFile.name : 'Drag and drop your CSV file here'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {selectedFile ? `Size: ${(selectedFile.size / 1024).toFixed(2)} KB` : 'or click to browse'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="contained" component="label">
                {selectedFile ? 'Change File' : 'Select File'}
                <input type="file" hidden accept=".csv" onChange={handleFileSelect} />
              </Button>
              {selectedFile && (
                <Button 
                  variant="contained" 
                  color="success"
                  onClick={handleUpload}
                  disabled={uploading}
                  startIcon={uploading ? <CircularProgress size={16} /> : <UploadIcon />}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              )}
            </Box>
          </Box>

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                Processing CSV file...
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="outlined"
              startIcon={downloading ? <CircularProgress size={16} /> : <DownloadIcon />}
              size="small"
              onClick={handleDownloadTemplate}
              disabled={downloading}
            >
              {downloading ? 'Downloading...' : 'Download CSV Template'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Duplicates Dialog */}
      <Dialog 
        open={showDuplicatesDialog} 
        onClose={() => setShowDuplicatesDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
          ⏭️ Skipped Domains (Already Exist)
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            These domains were skipped because they already exist:
          </Typography>
          
          {/* CSV Duplicates */}
          {uploadResult?.csvDuplicates && uploadResult.csvDuplicates.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'warning.main' }}>
                📄 Duplicates within CSV file ({uploadResult.csvDuplicates.length})
              </Typography>
              <List dense>
                {uploadResult.csvDuplicates.map((domain, index) => (
                  <ListItem key={`csv-${index}`} sx={{ py: 0.5, pl: 3 }}>
                    <ListItemText 
                      primary={domain}
                      primaryTypographyProps={{ 
                        variant: 'body2',
                        sx: { fontFamily: 'monospace' }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          
          {/* System/Main Project Duplicates */}
          {uploadResult?.duplicateDetails && uploadResult.duplicateDetails.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'warning.main' }}>
                💾 Already in system ({uploadResult.duplicateDetails.length})
              </Typography>
              <List dense>
                {uploadResult.duplicateDetails.map((item, index) => (
                  <ListItem key={`sys-${index}`} sx={{ py: 0.5, pl: 3 }}>
                    <ListItemText 
                      primary={item.domain}
                      secondary={`Source: ${item.source}`}
                      primaryTypographyProps={{ 
                        variant: 'body2',
                        sx: { fontFamily: 'monospace' }
                      }}
                      secondaryTypographyProps={{
                        variant: 'caption',
                        color: 'text.secondary'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDuplicatesDialog(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Domains Dialog */}
      <Dialog 
        open={showNewDomainsDialog} 
        onClose={() => setShowNewDomainsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
          ✅ New Domains Added
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            These new domains were successfully added to the system:
          </Typography>
          <List dense>
            {uploadResult?.newDomains?.map((domain, index) => (
              <ListItem key={index} sx={{ py: 0.5, pl: 2 }}>
                <ListItemText 
                  primary={`${index + 1}. ${domain}`}
                  primaryTypographyProps={{ 
                    variant: 'body2',
                    sx: { fontFamily: 'monospace' }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewDomainsDialog(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invalid Records Dialog */}
      <Dialog 
        open={showInvalidDialog} 
        onClose={() => setShowInvalidDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
          ❌ Invalid Records
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            These records have validation errors and were not processed:
          </Typography>
          <List dense>
            {uploadResult?.invalidRows?.map((inv, index) => {
              const domain = inv.data.site || inv.data.domain || 'Unknown';
              return (
                <ListItem key={index} sx={{ py: 1, borderBottom: '1px solid #eee' }}>
                  <ListItemText 
                    primary={domain}
                    secondary={`Error: ${inv.errors.join(', ')}`}
                    primaryTypographyProps={{ 
                      variant: 'body2',
                      sx: { fontFamily: 'monospace', fontWeight: 'bold' }
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      color: 'error'
                    }}
                  />
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInvalidDialog(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UploadCSV;
