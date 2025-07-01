import React, { useState } from 'react';
import {
  Box,
  Typography,
  Divider,
  ButtonGroup,
  Button,
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import InventoryIcon from '@mui/icons-material/Inventory';
import DashboardIcon from '@mui/icons-material/SpaceDashboard';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import DescriptionIcon from '@mui/icons-material/Description';
import BarChartIcon from '@mui/icons-material/BarChart';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
const MenuDropdown = ({ onMenuAction }) => {
  const [activeTab, setActiveTab] = useState('All');

  const allIcons = [
    { label: 'Add Category', icon: <CategoryIcon />, key: 'Add Category', group: 'Master' },
    { label: 'Item List', icon: <InventoryIcon />, key: 'Item List', group: 'Master' },
    { label: 'Overall Sales', icon: <DashboardIcon />, key: 'Overall Sales Report', group: 'Reports' },
    { label: 'Bill Report', icon: <ReceiptIcon />, key: 'Bill Report', group: 'Reports' },
    { label: 'Order Report', icon: <DescriptionIcon />, key: 'Order Report', group: 'Reports' },
    { label: 'Analysis Report', icon: <BarChartIcon />, key: 'Analysis Report', group: 'Reports' },
    { label: 'Order Process', icon: <AssignmentTurnedInIcon />, key: 'Order ProcessCards', group: 'Process' },
    { label: 'Order Process Report', icon: <TrackChangesIcon />, key: 'Order Tracking', group: 'Process' },
    { label: 'Order TimeTrack', icon: <AccessTimeIcon />, key: 'Order TimeTrack', group: 'Process' },
       { label: 'Dashboard', icon: <TrendingUpIcon />, key: 'Dashboard', group: 'Reports' },
  ];

  const renderIconButton = ({ label, icon, key }) => (
    <Box
      key={key}
      onClick={() => onMenuAction(key)}
      sx={{
        width: '33.33%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        mb: 2,
        '&:hover': { opacity: 0.9 },
      }}
    >
      <Box
        sx={{
          bgcolor: '#111',
          width: 56,
          height: 56,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 0.5,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        {React.cloneElement(icon, {
          sx: { color: '#fff', fontSize: 28 },
        })}
      </Box>
      <Typography variant="caption" sx={{ textAlign: 'center', color: '#333' }}>
        {label}
      </Typography>
    </Box>
  );

  const getFilteredIcons = () => {
    if (activeTab === 'All') return allIcons;
    return allIcons.filter((item) => item.group === activeTab);
  };

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Box>
        {/* Logo and Title */}
        <Box
          onClick={() => onMenuAction('POS')}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 2,
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.9,
            },
          }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="Logo"
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #111',
            }}
          />
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: '#000', mt: 1 }}
          >
            POS
          </Typography>
        </Box>

        {/* Tab Selector */}
       <ButtonGroup
  fullWidth
  variant="text"
  size="small"
  sx={{
    mb: 2,
    borderRadius: 1,
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  }}
>
  {['All', 'Process','Reports','Master'  ].map((tab) => (
    <Button
      key={tab}
      onClick={() => setActiveTab(tab)}
      sx={{
        flex: 1,
        py: 1,
        fontWeight: activeTab === tab ? 'bold' : 500,
        color: activeTab === tab ? '#fff' : '#555',
        backgroundColor: activeTab === tab ? '#111' : 'transparent',
        borderRight: '1px solid #ddd',
        '&:last-child': {
          borderRight: 'none',
        },
        '&:hover': {
          backgroundColor: activeTab === tab ? '#000' : '#f0f0f0',
        },
        transition: 'background-color 0.2s ease',
      }}
    >
      {tab}
    </Button>
  ))}
</ButtonGroup>


        <Divider sx={{ mb: 2, borderColor: '#ccc', maxWidth: 180, mx: 'auto' }} />

        {/* Icon Grid */}
        <Box display="flex" flexWrap="wrap" justifyContent="center">
          {getFilteredIcons().map(renderIconButton)}
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Divider sx={{ mb: 1.5, borderColor: '#ccc' }} />
        <Typography variant="caption" color="text.secondary">
          &copy; {new Date().getFullYear()} AISylvester. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default MenuDropdown;
