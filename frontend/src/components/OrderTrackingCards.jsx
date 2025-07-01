import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Tabs,
  Tab,
  Card,
  Snackbar,
  Alert,
  Collapse,
  IconButton,
  Divider,
  Tooltip,
    ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import {
  
  ExpandLess,
  AccessTime,
  Restaurant,
  CheckCircle,
  DoneAll,
  CancelPresentation,
  InfoOutlined,
} from '@mui/icons-material';
import axios from 'axios';
import { TransitionGroup } from 'react-transition-group';
// import Ring from './bell.mp3';
const API_URL = 'https://billing-6qkq.onrender.com/';

const STATUS_FLOW = ['onBoard', 'preparing', 'ready', 'served'];
const STATUS_COLORS = {
  onBoard: '#1976d2',
  preparing: '#212121',
  ready: '#006994',
  served: '#2e7d32',
  canceled: '#d32f2f',
};


const STATUS_ICONS = {
  onBoard: <AccessTime fontSize="small" />,
  preparing: <Restaurant fontSize="small" />,
  ready: <CheckCircle fontSize="small" />,
  served: <DoneAll fontSize="small" />,
  canceled: <CancelPresentation fontSize="small" />,
};



function formatDuration(ms) {
  if (ms < 0) return '';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes > 0 ? minutes + 'm ' : ''}${seconds}s`;
}

const OrderTrackingCards = () => {
  const [orders, setOrders] = useState([]);
  const [tabView, setTabView] = useState('active');
  const [searchText, setSearchText] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [prevOrderIds, setPrevOrderIds] = useState([]);
  const [expanded, setExpanded] = useState({});
const [loadingOrderIds, setLoadingOrderIds] = useState([]);
const servedCount = orders.filter((o) => o.status === 'served').length;
const canceledCount = orders.filter((o) => o.status === 'canceled').length;

const [expandTimeouts, setExpandTimeouts] = useState({});

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/orders`);
      const today = new Date();
      const todayOrders = data.filter((order) => {
        const createdAt = new Date(order.createdAt);
        return (
          createdAt.getFullYear() === today.getFullYear() &&
          createdAt.getMonth() === today.getMonth() &&
          createdAt.getDate() === today.getDate()
        );
      });

      const currentIds = todayOrders.map((o) => o._id);
      const newOrder =
        prevOrderIds.length > 0 && currentIds.some((id) => !prevOrderIds.includes(id));
        
      if (newOrder) {
  setSnackbarOpen(true);

  // Browser notification
  if (Notification.permission === 'granted') {
    new Notification('New Order Received!', {
      body: 'Check the new ticket in your list.',
      icon: '/favicon.ico',
    });
  }

  // Sound alert
  const audio = new Audio({Ring});
  audio.play().catch((err) => {
    console.warn('Auto-play might be blocked', err);
  });
}
      setOrders(
        todayOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      );
      setPrevOrderIds(currentIds);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    }
  }, [prevOrderIds]);
useEffect(() => {
  if (Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
}, []);
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateOrderStatusLocally = (ticketId, newStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.ticketId === ticketId ? { ...order, status: newStatus } : order
      )
    );
  };

  const handleStatusChange = async (order, direction) => {
  const currentIndex = STATUS_FLOW.indexOf(order.status);
  let newStatus = order.status;

  if (direction === 'next' && currentIndex < STATUS_FLOW.length - 1) {
    newStatus = STATUS_FLOW[currentIndex + 1];
  } else if (direction === 'cancel') {
    newStatus = 'canceled';
  }

  const confirmed = window.confirm(`Change status to "${newStatus}"?`);
  if (!confirmed) return;

  // Mark this order as loading
  setLoadingOrderIds((prev) => [...prev, order.ticketId]);
  updateOrderStatusLocally(order.ticketId, newStatus);

  try {
    await axios.put(`${API_URL}/api/orders/${order.ticketId}`, {
      status: newStatus,
    });
  } catch (err) {
    alert('Failed to update status');
    fetchOrders();
  } finally {
    setLoadingOrderIds((prev) => prev.filter((id) => id !== order.ticketId));
  }
};

  const getStatusTimestamp = (order, status) => {
    if (order.statusTimestamps && order.statusTimestamps[status]) {
      return new Date(order.statusTimestamps[status]);
    }
    if (status === 'onBoard') return new Date(order.createdAt);
    return null;
  };

  const getDurationText = (order) => {
    const createdAt = new Date(order.createdAt);
    const now =
      order.status === 'served' || order.status === 'canceled'
        ? getStatusTimestamp(order, order.status) || new Date()
        : new Date();
    const diff = now - createdAt;
    return formatDuration(diff);
  };

const filteredOrders = orders.filter((order) => {
  const keyword = searchText.trim().toLowerCase();

  // If searching, match across all statuses
  if (keyword) {
    return (
      order.ticketId.toLowerCase().includes(keyword) ||
      order.customer.name.toLowerCase().includes(keyword)
    );
  }

  // If not searching, apply tab filter
  if (tabView === 'active') {
    return ['onBoard', 'preparing', 'ready'].includes(order.status);
  }
  return order.status === tabView;
});



  const toggleExpand = (id) => {
  setExpanded((prev) => {
    const isExpanding = !prev[id];

    // If expanding, set a timeout to auto-collapse
    if (isExpanding) {
      const timeoutId = setTimeout(() => {
        setExpanded((prev) => ({ ...prev, [id]: false }));
        setExpandTimeouts((prev) => {
          const newTimeouts = { ...prev };
          delete newTimeouts[id];
          return newTimeouts;
        });
      }, 120000); // 2 minutes

      setExpandTimeouts((prev) => {
        // Clear any existing timeout for the same order
        if (prev[id]) clearTimeout(prev[id]);
        return { ...prev, [id]: timeoutId };
      });
    } else {
      // If collapsing manually, clear the timeout
      if (expandTimeouts[id]) {
        clearTimeout(expandTimeouts[id]);
        setExpandTimeouts((prev) => {
          const newTimeouts = { ...prev };
          delete newTimeouts[id];
          return newTimeouts;
        });
      }
    }

    return { ...prev, [id]: isExpanding };
  });
};


  const renderHorizontalTimeline = (order) => {
    const steps = order.status === 'canceled' ? ['onBoard', 'canceled'] : STATUS_FLOW;
    const currentIndex = STATUS_FLOW.indexOf(order.status);

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.8 }}>
        {steps.map((step, idx) => {
          const isActive = step === order.status;
          const isCompleted = STATUS_FLOW.indexOf(step) < currentIndex;
          const isCanceled = step === 'canceled';
          const iconColor = isActive || isCompleted || isCanceled ? STATUS_COLORS[step] : '#ccc';

          return (
            <React.Fragment key={step}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: 55,
                  minWidth: 45,
                }}
              >
             <Box
  sx={{
    backgroundColor: iconColor,
    borderRadius: '50%',
    width: 26,
    height: 26,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
    border: isActive ? `2px solid ${STATUS_COLORS[order.status]}` : 'none',
    boxShadow: isActive
      ? `0 0 8px 2px ${STATUS_COLORS[step]}`
      : isCompleted
      ? `0 0 4px ${STATUS_COLORS[step]}`
      : 'none',
    transition: 'all 0.2s ease-in-out',
  }}
>
  {React.cloneElement(STATUS_ICONS[step], { fontSize: 'inherit' })}
</Box>
                <Typography
                  variant="caption"
                  sx={{
                    mt: 0.2,
                    fontSize: '0.6rem',
                    color: isActive
                      ? STATUS_COLORS[step]
                      : isCompleted || isCanceled
                      ? '#666'
                      : '#aaa',
                    fontWeight: isActive ? 600 : 400,
                    textTransform: 'capitalize',
                  }}
                >
                  {step}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#777' }}>
                  {(() => {
                    const ts = getStatusTimestamp(order, step);
                    return ts
                      ? ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '-';
                  })()}
                </Typography>
              </Box>

              {idx < steps.length - 1 && (
                <Box
                  sx={{
                    height: 2,
                    flex: 1,
                    backgroundColor:
                      STATUS_FLOW.indexOf(steps[idx + 1]) <= currentIndex
                        ? STATUS_COLORS[order.status]
                        : '#ccc',
                    mx: 0.7,
                    mt: 0.9,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 2, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <Typography
        variant="h6"
        align="center"
        sx={{ fontWeight: 600, mb: 1.5, fontSize: '1.25rem', color: '#2d3e50' }}
      >
        Order Processing
      </Typography>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
          mb: 1.5,
        }}
      >
        <TextField
          label="Search by Ticket or Name"
          size="small"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{
            width: 280,
            backgroundColor: '#fff',
            borderRadius: 2,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            '& .MuiInputBase-input': { fontSize: '0.8rem' },
            '& .MuiInputLabel-root': { fontSize: '0.8rem' },
          }}
        />
<Tabs
  value={tabView}
  onChange={(e, val) => setTabView(val)}
  variant="scrollable"
  scrollButtons="auto"
  allowScrollButtonsMobile
  sx={{ minHeight: 36 }}
  TabIndicatorProps={{ style: { height: 3 } }}
>
  <Tab
    label={`Active (${orders.filter(o => ['onBoard', 'preparing', 'ready'].includes(o.status)).length})`}
    value="active"
    sx={{ fontSize: '0.8rem', minHeight: 36, paddingX: 1.5 }}
  />
  <Tab
    label={`On Board (${orders.filter(o => o.status === 'onBoard').length})`}
    value="onBoard"
    sx={{ fontSize: '0.8rem', minHeight: 36, paddingX: 1.5 }}
  />
  <Tab
    label={`Preparing (${orders.filter(o => o.status === 'preparing').length})`}
    value="preparing"
    sx={{ fontSize: '0.8rem', minHeight: 36, paddingX: 1.5 }}
  />
  <Tab
    label={`Ready (${orders.filter(o => o.status === 'ready').length})`}
    value="ready"
    sx={{ fontSize: '0.8rem', minHeight: 36, paddingX: 1.5 }}
  />
  <Tab
    label={`Served (${servedCount})`}
    value="served"
    sx={{ fontSize: '0.8rem', minHeight: 36, paddingX: 1.5 }}
  />
  <Tab
    label={`Canceled (${canceledCount})`}
    value="canceled"
    sx={{ fontSize: '0.8rem', minHeight: 36, paddingX: 1.5 }}
  />
</Tabs>
      </Box>
<TransitionGroup>
    {filteredOrders.length === 0 ? (
  <Typography align="center" variant="body2" sx={{ mt: 3, fontSize: '0.75rem' }}>
    No orders found.
  </Typography>
) : (
  filteredOrders.map((order) => {
    const isLoading = loadingOrderIds.includes(order.ticketId);
    return (
      <Collapse>
      
      
        <Card key={order._id}
            sx={{
              mb: 1,
              p: 1,
              borderRadius: 1,
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
              fontSize: '0.8rem',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 0.5,
                mb: 0.5,
              }}
            >
           <Box sx={{ flex: 1 }}>
  {/* Top row: Ticket left, Created time + Duration right */}
  <Box
  sx={{
    display: 'flex',
    flexDirection: { xs: 'column', sm: 'row' },
    justifyContent: 'space-between',
    alignItems: { xs: 'flex-start', sm: 'center' },
    mb: 0.3,
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#333',
    width: '100%',
    gap: { xs: 0.5, sm: 0 },
  }}
>
<Typography
  noWrap
  sx={{
    fontSize: '1rem',
    fontWeight: 'bold',
    color:'#fff',
    backgroundColor: '#000000', 
    padding: '2px 6px',
    borderRadius: '4px',
    display: 'inline-block',
  }}
>
  Ticket: {order.ticketId}
</Typography>

  <Box
    sx={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: { xs: 'flex-start', sm: 'flex-end' },
      gap: 1.5,
      fontWeight: 300,
      fontSize: '0.625rem',
      color: 'text.secondary',
      width: { xs: '100%', sm: 'auto' },
    }}
  >
    <Typography noWrap sx={{ fontSize: '0.625rem', fontWeight: 600 }}>
      Created: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </Typography>

    <Typography noWrap sx={{ fontSize: '0.625rem', fontWeight: 600 }}>
      Duration: {getDurationText(order)}
    </Typography>

    <Tooltip title={expanded[order._id] ? 'Hide Items' : 'Show Items'}>
      <IconButton
        onClick={() => toggleExpand(order._id)}
        size="small"
        sx={{ p: 0.4, color: '#000' }}
      >
        {expanded[order._id] ? <ExpandLess fontSize="small" /> : <InfoOutlined fontSize="small" />}
      </IconButton>
    </Tooltip>
  </Box>
</Box>


  {/* Name | ServiceType single line */}
<Box
  sx={{
    display: 'flex',
    flexDirection: { xs: 'column', sm: 'row' },
    justifyContent: 'space-between',
    alignItems: { xs: 'flex-start', sm: 'center' },
    mt: 0.3,
    gap: { xs: 0.3, sm: 0 },
  }}
>
  <Typography
    variant="body2"
    color="text.secondary"
    sx={{
      fontSize: '0.75rem',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontWeight: 500,
      maxWidth: '100%',
    }}
  >
    {order.customer.name} | {order.serviceType}
  </Typography>

<Typography
  variant="body2"
  sx={{
    fontSize: '0.90rem',
    fontWeight: 500,
    color: '#000', // black text for readability
    backgroundColor: (() => {
      switch (order.status) {
        case 'onBoard':
          return '#e0e0e0'; // light grey
        case 'preparing':
          return '#87ceeb'; // sky blue
        case 'ready':
          return '#ffa726'; // orange
        case 'served':
          return '#a5d6a7'; // light green
        default:
          return '#e0e0e0'; // fallback light grey
      }
    })(),
    whiteSpace: 'nowrap',
    padding: '2px 6px',
    borderRadius: '4px',
    display: 'inline-block',
  }}
>
  Current: {order.status}
</Typography>


</Box>

  {/* Qty and total */}
  <Typography variant="body2" sx={{ fontSize: '0.75rem', mt: 0.5 }}>
    Qty: {order.totalQty} | ₹{order.total}
  </Typography>
</Box>

      
            </Box>

           

            <Collapse in={expanded[order._id]} timeout="auto" unmountOnExit>
              <Divider sx={{ my: 1 }} />

               {renderHorizontalTimeline(order)}
              <Box sx={{ fontSize: '0.75rem', color: '#444', whiteSpace: 'pre-line' }}>
                <strong>Order Details:</strong>
                {'\n'}
                {order.items
                  .map((item) => `${item.title} x ${item.qty} - ₹${item.rate * item.qty}`)
                  .join('\n')}
              </Box>
            </Collapse>

{!['served', 'canceled'].includes(order.status) && (
  <ToggleButtonGroup
    value={order.status}
    exclusive
    fullWidth
    sx={{
      mt: 1.5,
      '& .MuiToggleButton-root': {
        borderColor: '#ccc',
        fontSize: '0.7rem',
        fontWeight: 600,
        py: 0.4,
        px: 1,
        color: '#000',
        minHeight: '30px',
        borderRadius: 1,
      },
    }}
  >
    {/* Prepare */}
    <ToggleButton
      value="onBoard"
      disabled={order.status !== 'onBoard' || isLoading}
      onClick={() => handleStatusChange(order, 'next')}
      sx={{
        backgroundColor: order.status === 'onBoard' ? '#b3e5fc' : '#f0f0f0',
        '&.Mui-disabled': {
  color: '#bbb',
  backgroundColor: '#f5f5f5',
},
        '&.Mui-selected': {
          backgroundColor: '#4fc3f7',
          color: '#000',
          borderColor: '#29b6f6',
        },
      }}
    >
      {isLoading ? '...' : 'Prepare'}
    </ToggleButton>

    {/* Ready */}
    <ToggleButton
      value="preparing"
      disabled={order.status !== 'preparing' || isLoading}
      onClick={() => handleStatusChange(order, 'next')}
      sx={{
        backgroundColor: order.status === 'preparing' ? '#ffe082' : '#f0f0f0',
        '&.Mui-disabled': {
  color: '#bbb',
  backgroundColor: '#f5f5f5',
},
        '&.Mui-selected': {
          backgroundColor: '#ffca28',
          color: '#000',
          borderColor: '#fbc02d',
        },
      }}
    >
      {isLoading ? '...' : 'Ready'}
    </ToggleButton>

    {/* Serve */}
    <ToggleButton
      value="ready"
      disabled={order.status !== 'ready' || isLoading}
      onClick={() => handleStatusChange(order, 'next')}
      sx={{
        backgroundColor: order.status === 'ready' ? '#c8e6c9' : '#f0f0f0',
        '&.Mui-disabled': {
  color: '#bbb',
  backgroundColor: '#f5f5f5',
},
        '&.Mui-selected': {
          backgroundColor: '#81c784',
          color: '#000',
          borderColor: '#66bb6a',
        },
      }}
    >
      {isLoading ? '...' : 'Serve'}
    </ToggleButton>

    {/* Cancel */}
    <ToggleButton
      value="cancel"
      disabled={isLoading}
      onClick={() => handleStatusChange(order, 'cancel')}
      sx={{
        backgroundColor: '#ef9a9a',
        color: '#000',
        borderColor: '#e57373',
        '&:hover': {
          backgroundColor: '#e57373',
        },
      }}
    >
      {isLoading ? '...' : 'Cancel'}
    </ToggleButton>
  </ToggleButtonGroup>
)}
</Card> </Collapse>
    );
  })
)}</TransitionGroup>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setSnackbarOpen(false)}>
          New order received!
        </Alert>
      </Snackbar>
    </Box>
)
};
export default OrderTrackingCards;
