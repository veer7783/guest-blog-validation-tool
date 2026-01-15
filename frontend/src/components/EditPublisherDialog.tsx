import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';

interface EditPublisherDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (publisherName: string, publisherEmail: string) => Promise<void>;
  currentPublisherName?: string;
  currentPublisherEmail?: string;
  currentContactName?: string;
  currentContactEmail?: string;
}

const EditPublisherDialog: React.FC<EditPublisherDialogProps> = ({
  open,
  onClose,
  onSave,
  currentPublisherName,
  currentPublisherEmail,
  currentContactName,
  currentContactEmail,
}) => {
  const [publisherName, setPublisherName] = useState('');
  const [publisherEmail, setPublisherEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      // Set initial values from either publisher or contact fields
      setPublisherName(currentPublisherName || currentContactName || '');
      setPublisherEmail(currentPublisherEmail || currentContactEmail || '');
      setError('');
    }
  }, [open, currentPublisherName, currentPublisherEmail, currentContactName, currentContactEmail]);

  const handleSave = async () => {
    if (!publisherEmail.trim()) {
      setError('Email is required');
      return;
    }

    if (!publisherName.trim()) {
      setError('Name is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(publisherEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSave(publisherName.trim(), publisherEmail.trim());
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update publisher');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Publisher Information</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>How it works:</strong>
            </Typography>
            <Typography variant="body2" component="div">
              ✅ If email <strong>matches</strong> a publisher in main tool → Stays as Publisher
            </Typography>
            <Typography variant="body2" component="div">
              ⚠️ If email <strong>does not match</strong> → Converts to Contact
            </Typography>
          </Alert>

          <TextField
            fullWidth
            label="Publisher Name"
            value={publisherName}
            onChange={(e) => setPublisherName(e.target.value)}
            margin="normal"
            disabled={loading}
            required
          />

          <TextField
            fullWidth
            label="Publisher Email"
            type="email"
            value={publisherEmail}
            onChange={(e) => setPublisherEmail(e.target.value)}
            margin="normal"
            disabled={loading}
            required
            helperText="Email will be validated against main tool publishers"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPublisherDialog;
