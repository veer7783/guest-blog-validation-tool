import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Divider,
  Typography,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  CloudUpload as UploadIcon,
  Storage as DataIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import HistoryIcon from '@mui/icons-material/History';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  drawerWidth: number;
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
  collapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ drawerWidth, mobileOpen, handleDrawerToggle, collapsed = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/', roles: ['ADMIN', 'SUPER_ADMIN', 'CONTRIBUTOR'] },
    { text: 'Upload CSV', icon: <UploadIcon />, path: '/upload', roles: ['SUPER_ADMIN', 'CONTRIBUTOR'] },
    { text: 'Data Management', icon: <DataIcon />, path: '/data', roles: ['ADMIN', 'SUPER_ADMIN', 'CONTRIBUTOR'] },
    { text: 'Data Finalization', icon: <TaskAltIcon />, path: '/data-final', roles: ['SUPER_ADMIN', 'CONTRIBUTOR'] },
    { text: 'Pushed Data', icon: <SendIcon />, path: '/pushed-data', roles: ['SUPER_ADMIN', 'CONTRIBUTOR'] },
    { text: 'Users', icon: <PeopleIcon />, path: '/users', roles: ['SUPER_ADMIN'] },
    { text: 'Activity Log', icon: <HistoryIcon />, path: '/activity-log', roles: ['SUPER_ADMIN'] },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  const drawer = (
    <Box>
      <Toolbar>
        {!collapsed && (
          <Typography variant="h6" noWrap component="div" fontWeight="bold">
            Hypwave Data Processing
          </Typography>
        )}
        {collapsed && (
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Typography variant="h6" component="div" fontWeight="bold">
              H
            </Typography>
          </Box>
        )}
      </Toolbar>
      <Divider />
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            {collapsed ? (
              <Tooltip title={item.text} placement="right">
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => {
                    navigate(item.path);
                    if (mobileOpen) handleDrawerToggle();
                  }}
                  sx={{ justifyContent: 'center', px: 2.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
                    {item.icon}
                  </ListItemIcon>
                </ListItemButton>
              </Tooltip>
            ) : (
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  if (mobileOpen) handleDrawerToggle();
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile drawer - always full width */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: 240 // Always full width on mobile
          },
        }}
      >
        {drawer}
      </Drawer>
      {/* Desktop drawer - collapsible */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            transition: 'width 0.3s ease', // Smooth transition
            overflowX: 'hidden', // Hide overflow when collapsed
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
