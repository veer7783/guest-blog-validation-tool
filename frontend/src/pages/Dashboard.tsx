import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { API_BASE_URL } from '../config';
import {
  People as PeopleIcon,
  CloudUpload as AssignmentIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface UserTaskBreakdown {
  name: string;
  assignedTasks: number;
  pendingTasks: number;
  completedTasks: number;
}

interface DashboardStats {
  totalUsers?: number;
  assignedTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completedDataRows?: number;
  pendingDataRows?: number;
  totalDataRows?: number;
  pendingTasksTotalData?: number;
  superAdminCompletedRows?: number;
  userTaskBreakdown?: UserTaskBreakdown[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    assignedTasks: 0,
    completedTasks: 0,
    pendingTasks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards: Array<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    dataRowCount?: number;
    totalDataCount?: number;
    showRatioForCompleted?: boolean;
    showRatioForPending?: boolean;
    superAdminCount?: number;
  }> = [];

  // Only Super Admin sees Total Users
  if (user?.role === 'SUPER_ADMIN' && stats.totalUsers !== undefined) {
    statCards.push({
      title: 'Total Users',
      value: stats.totalUsers,
      icon: <PeopleIcon />,
      color: '#1976d2'
    });
  }

  // Both Admin and Super Admin see these
  statCards.push(
    {
      title: 'Assigned Tasks',
      value: stats.assignedTasks,
      icon: <AssignmentIcon />,
      color: '#ff9800'
    },
    {
      title: 'Completed Tasks',
      value: stats.completedTasks,
      icon: <CheckIcon />,
      color: '#4caf50',
      dataRowCount: stats.completedDataRows,
      totalDataCount: stats.totalDataRows,
      showRatioForCompleted: true,
      superAdminCount: stats.superAdminCompletedRows
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks,
      icon: <Typography sx={{ fontSize: '24px' }}>⏳</Typography>,
      color: '#9c27b0',
      dataRowCount: stats.pendingDataRows,
      totalDataCount: stats.pendingTasksTotalData || stats.pendingDataRows,
      showRatioForPending: true
    }
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Welcome back, {user?.firstName}!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {user?.role === 'SUPER_ADMIN'
          ? "Here's an overview of your guest blog validation system"
          : "Here's an overview of your assigned tasks"}
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {statCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" variant="body2" gutterBottom>
                        {stat.title}
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {stat.value}
                      </Typography>
                      {stat.dataRowCount !== undefined && stat.dataRowCount > 0 && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontSize: '0.7rem', 
                            color: 'text.secondary',
                            display: 'block',
                            mt: 0.5
                          }}
                        >
                          {stat.showRatioForCompleted && stat.totalDataCount
                            ? `${stat.dataRowCount} completed out of ${stat.totalDataCount} data`
                            : stat.showRatioForPending && stat.totalDataCount
                              ? `${stat.dataRowCount} pending out of ${stat.totalDataCount} data`
                              : `${stat.dataRowCount} data`
                          }
                        </Typography>
                      )}
                      {stat.superAdminCount !== undefined && stat.superAdminCount > 0 && user?.role === 'SUPER_ADMIN' && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontSize: '0.7rem', 
                            color: 'primary.main',
                            display: 'block',
                            mt: 0.3,
                            fontWeight: 500
                          }}
                        >
                          {stat.superAdminCount} by Super Admin
                        </Typography>
                      )}
                    </Box>
                    <Box
                      sx={{
                        backgroundColor: stat.color,
                        borderRadius: 2,
                        p: 1.5,
                        color: 'white',
                      }}
                    >
                      {stat.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* User Task Breakdown - Only for Super Admin */}
      {user?.role === 'SUPER_ADMIN' && stats.userTaskBreakdown && stats.userTaskBreakdown.length > 0 && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              User Task Breakdown
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {stats.userTaskBreakdown.map((userStat, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {userStat.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Assigned: <strong>{userStat.assignedTasks}</strong> tasks
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending: <strong>{userStat.pendingTasks}</strong> tasks
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed: <strong>{userStat.completedTasks}</strong> tasks
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.role === 'SUPER_ADMIN'
              ? 'Upload a new CSV file to start processing guest blog submissions'
              : 'View and manage your assigned data processing tasks'}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
