import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UploadCSV from './pages/UploadCSV';
import DataManagement from './pages/DataManagement';
import DataFinal from './pages/DataFinal';
import PushedData from './pages/PushedData';
import Users from './pages/Users';
import ActivityLog from './pages/ActivityLog';
import AppLayout from './components/layout/AppLayout';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="upload" element={<UploadCSV />} />
        <Route path="data" element={<DataManagement />} />
        <Route path="data-final" element={<DataFinal />} />
        <Route path="pushed-data" element={<PushedData />} />
        <Route path="users" element={<Users />} />
        <Route path="activity-log" element={<ActivityLog />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
