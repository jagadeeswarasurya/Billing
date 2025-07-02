import React, { useState, useEffect, useCallback } from 'react';

import {
  AppBar, Box, CssBaseline, IconButton, Toolbar, Typography,
  createTheme, ThemeProvider, Badge, Dialog, DialogTitle, DialogActions, Button
} from '@mui/material';
import { ReceiptLong, DinnerDining,HomeRounded , Dehaze,Logout } from '@mui/icons-material';

import { useMediaQuery } from '@mui/material';
import axios from 'axios';
import MenuDropdown from './components/MenuDropdown.jsx';
import Menu from './components/Menu.jsx';
import OrderSummary from './components/OrderSummary.jsx';
import CategoryManagement from './components/Categorymas.jsx';
import MenuManagement from './components/MenuManagementForm.jsx';
import ReportPage from './components/SalesReport.jsx';
import OrderTracking from './components/OrderTracking.jsx';
import LoginPage from './components/LoginPage.jsx'; 
import OrderReporting from './components/OrderReporting.jsx';
import BillReport from './components/Billwisereport.jsx';
import MISReporting from './components/MisReporting.jsx';
import OrderTimeReport from './components/OrderTimeReport.jsx';
import OrderTrackingCards from './components/OrderTrackingCards.jsx';
import Dashboard from './components/Dashboard.jsx';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#000000' },
    secondary: { main: '#ffffff' },
    background: {
      default: '#ffffff',
      paper: '#f0f0f0',
    },
    text: {
      primary: '#000000',
      secondary: '#555555',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #ffffff 0%, #eaeaea 100%)',
          color: '#000000',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 1,
          boxShadow: '0 1px 1px rgba(0, 0, 0, 0.1)',
          background: '#ffffff',
        },
      },
    },
  },
});
const APPBAR_HEIGHT = {
  xs: 64, // reduced from 100 to 64
  sm: 70,
};
export default function App() {
  const isMobile = useMediaQuery('(max-width:768px)');
  const [orders, setOrders] = useState([]);
  const [menuList, setMenuList] = useState([]);
  const [showOrderPanel, setShowOrderPanel] = useState(!isMobile);
  const [customer, setCustomer] = useState({ name: '', mobile: '' });
 
  const [showMenuPanel, setShowMenuPanel] = useState(false); // ✅ New state
  const [currentView, setCurrentView] = useState('POS'); // 'POS' | 'ItemList' | 'AddCategory' | etc.

  const totalQty = orders.reduce((sum, item) => sum + item.qty, 0);
  const total = orders.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const ticketId = `KOT-${Date.now().toString().slice(-6)}`;
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // 📦 Fetch menu list
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/menu');
        const formatted = data.map(item => ({ ...item, id: item._id }));
        setMenuList(formatted);
      } catch (error) {
        console.error('Failed to fetch menu:', error);
      }
    };
    fetchMenu();
  }, []);

  // ➕ Add to order
  const handleAddToOrder = useCallback((item) => {
    setOrders(prev => {
      const existing = prev.find(order => order.id === item.id);
      if (existing) {
        return prev.map(order =>
          order.id === item.id ? { ...order, qty: order.qty + 1 } : order
        );
      }
      const rate = parseInt(item.Price, 10) || 0;
      return [...prev, { id: item.id, title: item.title, qty: 1, rate }];
    });
  }, []);

  // ➖ Remove from order
  const handleRemoveFromOrder = useCallback((item) => {
    setOrders(prev => {
      const existing = prev.find(order => order.id === item.id);
      if (existing && existing.qty > 1) {
        return prev.map(order =>
          order.id === item.id ? { ...order, qty: order.qty - 1 } : order
        );
      }
      return prev.filter(order => order.id !== item.id);
    });
  }, []);
if (!isLoggedIn) {
  return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
}
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

   
{/* Header */}
<AppBar
  position="fixed"
  elevation={10}
sx={{
  height: { xs: `${APPBAR_HEIGHT.xs}px`, sm: `${APPBAR_HEIGHT.sm}px` },
 background: 'linear-gradient(90deg, #ffffff 40%, #fff176 100%)', // bright white to soft lemon
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  borderBottom: '1px solid rgba(0, 0, 0, 0.05)', // light bottom border
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)', // elegant soft shadow
  zIndex: 1200,
  px: { xs: 1.5, sm: 2 },
}}
>
  <Toolbar
    sx={{
      display: 'flex',
      justifyContent: isMobile ? 'flex-start' : 'space-between',
      alignItems: 'center',
      height: '100%',
      flexWrap: 'wrap',
      gap: { xs: 1.5, sm: 0 },
      px: { xs: 1, sm: 2 },
    }}
  >
    {/* Mobile: Home icon, then heading */}
    {isMobile && (
      <>
        <IconButton
          onClick={() => {
            setCurrentView('POS');
            setShowMenuPanel(false);
          }}
          sx={{ color: '#000' }}
        >
          <HomeRounded />
        </IconButton>

        <Typography
          variant="h6"
          onClick={() => {
            setCurrentView('POS');
            setShowMenuPanel(false);
          }}
          sx={{
            fontWeight: 800,
            color: '#1A1A1A',
            fontSize: '1.1rem',
            fontFamily: '"Segoe UI", Roboto, sans-serif',
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 },
          }}
        >
          Cafe`Ria
        </Typography>

        <Box sx={{ flexGrow: 1 }} /> {/* Push right icons to end */}

       {isMobile && (
  <IconButton onClick={() => setShowOrderPanel(!showOrderPanel)} sx={{ color: '#1A1A1A' }}>
    <Badge
      badgeContent={totalQty}
      color="error"
      overlap="circular"
      invisible={totalQty === 0}
    >
      <ReceiptLong sx={{ fontSize: 24 }} />
    </Badge>
  </IconButton>
)}


        <IconButton
          onClick={() => {
            const newState = !showMenuPanel;
            setShowMenuPanel(newState);
            if (!newState) setCurrentView('POS');
            setShowOrderPanel(newState);
          }}
          sx={{ color: '#1A1A1A' }}
        >
          <Dehaze sx={{ fontSize: 24 }} />
        </IconButton>
        <IconButton
  onClick={() => setLogoutDialogOpen(true)}
  sx={{ color: '#1A1A1A', ml: 'auto' }}
>
  <Logout sx={{ fontSize: 24 }} />
</IconButton>
      </>
    )}

    {/* Desktop Left Section: Navigation Buttons */}
    {!isMobile && (
      <Box
        display="flex"
        alignItems="center"
        flexWrap="wrap"
        sx={{ gap: 0 }}
      >
        {[
          {
            label: 'Home',
            icon: <HomeRounded />,
            onClick: () => {
              setCurrentView('POS');
              setShowMenuPanel(false);
            },
            color: '#fbc02d',
          },
          {
            label: 'Process',
            icon: <DinnerDining />,
            onClick: () => setCurrentView('OrderProcess'),
            color: '#fb8c00',
          },
          {
            label: 'Dashboard',
            icon: <TrendingUpIcon/>,
            onClick: () => setCurrentView('Dashboard'),
            color: '#4FC3F7',
          },
          {
            label: 'Tracking',
            icon: <ReceiptLong />,
            onClick: () => setCurrentView('TimeTrack'),
            color: '#388e3c',
          },
          {
            label: 'Logout',
            icon: <Logout />,
            onClick: () => setLogoutDialogOpen(true),
            color: '#d32f2f',
          },
        ].map(({ label, icon, onClick, color }, index, array) => (
          <React.Fragment key={label}>
            <Button
              onClick={onClick}
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 64,
                px: 1.5,
                py: 0.8,
                borderRadius: 2,
                backgroundColor: color,
               color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 600,
                boxShadow:
                  'inset 0 0 0.5px rgba(255,255,255,0.4), 0 2px 6px rgba(0,0,0,0.1)',
                '&:hover': {
                  backgroundColor: `${color}cc`,
                },
              }}
            >
              {icon}
              <Box component="span" sx={{ ml: 1 }}>
                {label}
              </Box>
            </Button>

            {index < array.length - 1 && (
              <Box
                sx={{
                  height: 32,
                  mx: 1,
                  borderLeft: '1px solid rgba(0,0,0,0.2)',
                }}
              />
            )}
          </React.Fragment>
        ))}
      </Box>
    )}

    {/* Right section (only on desktop) */}
    {!isMobile && (
      <Box display="flex" alignItems="center" gap={1}>
      

        <Typography
          variant="h6"
          onClick={() => {
            setCurrentView('POS');
            setShowMenuPanel(false);
          }}
          sx={{
            fontWeight: 800,
            color: '#1A1A1A',
            fontSize: '1.2rem',
            letterSpacing: 1,
            cursor: 'pointer',
            fontFamily: '"Segoe UI", Roboto, sans-serif',
            '&:hover': { opacity: 0.8 },
          }}
        >
          Snack Attack
        </Typography>
           <IconButton
          onClick={() => {
            const newState = !showMenuPanel;
            setShowMenuPanel(newState);
            if (!newState) setCurrentView('POS');
          }}
          sx={{ color: '#1A1A1A' }}
        >
          <Dehaze sx={{ fontSize: 24 }} />
        </IconButton>
      </Box>
    )}
  </Toolbar>
</AppBar>

      {/* Main Body */}
     <Box
  sx={{
    display: 'flex',
    mt: { xs: `${APPBAR_HEIGHT.xs}px`, sm: `${APPBAR_HEIGHT.sm}px` },
    height: {
      xs: `calc(100vh - ${APPBAR_HEIGHT.xs}px)`,
      sm: `calc(100vh - ${APPBAR_HEIGHT.sm}px)`,
    },
    overflow: 'hidden',
    width: '100%',
    flexDirection: isMobile ? 'column' : 'row',
  }}
>
        {(!isMobile || !showOrderPanel) && (
          <Box sx={{ flex: isMobile ? 1 : 2.5, overflowY: 'auto', borderRight: isMobile ? 'none' : '1px solid #ccc' }}>
           {currentView === 'POS' && (
  <Menu
    menulist={menuList}
    orders={orders}
    setOrders={setOrders}
    handleAddToOrder={handleAddToOrder}
    handleRemoveFromOrder={handleRemoveFromOrder}
  />
)}

{currentView === 'ItemList' && (
  <MenuManagement />
)}

{currentView === 'AddCategory' && (
 <CategoryManagement/>
)}

{currentView === 'Report' && (
 <ReportPage/>
)}
{currentView === 'Tracking' && (
 <OrderTracking/>
)}
{currentView === 'Reporting' && (
 <OrderReporting/>
)}
{currentView === 'BillReporting' && (
 <BillReport/>
)}
{currentView === 'Analysis' && (
 <MISReporting/>
)}
{currentView === 'TimeTrack' && (
 <OrderTimeReport/>
)}
{currentView === 'OrderProcess' && (
 <OrderTrackingCards/>
)}
{currentView === 'Dashboard' && (
 <Dashboard/>
)}
          </Box>
        )}
 {(!isMobile || showOrderPanel) && (
  <Box sx={{ flex: isMobile ? 1 : 1, overflowY: 'auto' }}>
    {showMenuPanel ? (
      <MenuDropdown
  onMenuAction={(action) => {
    const viewMap = {
      'Add Category': 'AddCategory',
      'Item List': 'ItemList',
      'Overall Sales Report': 'Report',
      'Order Tracking': 'Tracking',
      'Order Report': 'Reporting',
      'Bill Report':'BillReporting',
      'Analysis Report':'Analysis',
      'Order TimeTrack':'TimeTrack',
      'Order ProcessCards':'OrderProcess',
      'Dashboard':'Dashboard',
    };

    setCurrentView(viewMap[action] || 'POS');

    // ✅ Auto-hide the menu panel on mobile
    if (isMobile) {
      setShowMenuPanel(false);
      setShowOrderPanel(false); // Show left section (POS/Menu/Report)
    }
  }}
/>

    ) : (
      <OrderSummary
        customer={customer}
        setCustomer={setCustomer}
        orders={orders}
        setOrders={setOrders}
        total={total}
        ticketId={ticketId}
      />
    )}
  </Box>
)}
      </Box>
<Dialog
  open={logoutDialogOpen}
  onClose={() => setLogoutDialogOpen(false)}
  PaperProps={{
    sx: {
      borderRadius: 3,
      px: 2,
      py: 1,
      minWidth: 320,
      boxShadow: '0px 8px 20px rgba(0,0,0,0.15)',
    },
  }}
>
  <DialogTitle
    sx={{
      fontWeight: 600,
      fontSize: '1.1rem',
      color: '#333',
      pb: 0,
    }}
  >
    Confirm Logout
  </DialogTitle>

  <Typography sx={{ px: 3, pt: 1.5, pb: 2, color: '#555', fontSize: '0.95rem' }}>
    Are you sure you want to log out of the Caferia POS system?
  </Typography>

  <DialogActions
    sx={{ px: 3, pb: 2, justifyContent: 'flex-end' }}
  >
    <Button
      onClick={() => setLogoutDialogOpen(false)}
      sx={{
        textTransform: 'none',
        fontWeight: 500,
        borderRadius: 2,
        px: 2,
        color: '#555',
        backgroundColor: '#f1f1f1',
        '&:hover': {
          backgroundColor: '#e0e0e0',
        },
      }}
    >
      Cancel
    </Button>
    <Button
      onClick={() => {
        setLogoutDialogOpen(false);
        setIsLoggedIn(false);
      }}
      variant="contained"
      color="error"
      sx={{
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: 2,
        px: 2,
        boxShadow: 'none',
      }}
    >
      Logout
    </Button>
  </DialogActions>
</Dialog>


    </ThemeProvider>
  );
}
