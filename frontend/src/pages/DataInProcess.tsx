import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

const DataInProcess: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Data Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        View and manage guest blog website data in process
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
            No data available. Upload a CSV file to get started.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DataInProcess;
