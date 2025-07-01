import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, TextField, CircularProgress, Divider,
  Chip, Paper, Grid, useTheme, useMediaQuery
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import LocalGroceryStoreIcon from '@mui/icons-material/LocalGroceryStore';
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import RoomServiceIcon from '@mui/icons-material/RoomService';
import CancelIcon from '@mui/icons-material/Cancel';

const API_URL = 'https://billing-6qkq.onrender.com/';

const STATUS_FLOW = ['onBoard', 'preparing', 'ready', 'served'];
const STATUS_COLORS = {
  onBoard: '#1976d2',
  preparing: '#f9a825',
  ready: '#388e3c',
  served: '#7b1fa2',
  canceled: '#d32f2f'
};
const STATUS_ICONS = {
  onBoard: <LocalGroceryStoreIcon fontSize="small" />,     // Ingredients ready
  preparing: <SoupKitchenIcon fontSize="small" />,         // Cooking
  ready: <RestaurantMenuIcon fontSize="small" />,          // Ready to serve
  served: <RoomServiceIcon fontSize="small" />,            // Delivered
  canceled: <CancelIcon fontSize="small" />,               // Canceled
};

const formatDuration = (start, end) => {
  if (!start || !end) return '-';
  const duration = Math.floor((new Date(end) - new Date(start)) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}m ${seconds}s`;
};

const getCurrentStatus = (ts) => {
  if (ts.served) return '🍽️ Served';
  if (ts.ready) return '✅ Ready';
  if (ts.preparing) return '🛠️ Preparing';
  if (ts.onBoard) return '🟢 OnBoard';
  return '🕑 Waiting';
};

const getStatusTimestamp = (order, status) => {
  return order.statusTimestamps ? order.statusTimestamps[status] : null;
};

const renderHorizontalTimeline = (order) => {
  const steps = order.status === 'canceled' ? ['onBoard', 'canceled'] : STATUS_FLOW;
  const currentIndex = STATUS_FLOW.indexOf(order.status);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
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
                    ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

const renderVerticalTimeline = (order) => {
  const steps = order.status === 'canceled' ? ['onBoard', 'canceled'] : STATUS_FLOW;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {steps.map((step) => {
        const ts = getStatusTimestamp(order, step);
        const isActive = step === order.status;
        const isCompleted = STATUS_FLOW.indexOf(step) < STATUS_FLOW.indexOf(order.status);
        const iconColor = isActive || isCompleted ? STATUS_COLORS[step] : '#ccc';

        return (
          <Box key={step} sx={{ display: 'flex', alignItems: 'center' }}>
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
                mr: 2,
                boxShadow: isActive
                  ? `0 0 8px 2px ${STATUS_COLORS[step]}`
                  : isCompleted
                  ? `0 0 4px ${STATUS_COLORS[step]}`
                  : 'none',
              }}
            >
              {React.cloneElement(STATUS_ICONS[step], { fontSize: 'inherit' })}
            </Box>
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: isActive ? 'bold' : 'normal',
                  color: isActive
                    ? STATUS_COLORS[step]
                    : isCompleted
                    ? '#666'
                    : '#aaa',
                }}
              >
                {step}
              </Typography>
              <Typography variant="caption" sx={{ color: '#777' }}>
                {ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

const OrderTimeReport = () => {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [ticketSuffix, setTicketSuffix] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const ticketDate = (() => {
    const today = new Date();
    return `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  })();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_URL}/api/orders`);
        const today = new Date();
        const todayOrders = data.filter(order => {
          const createdAt = new Date(order.createdAt);
          return (
            createdAt.getFullYear() === today.getFullYear() &&
            createdAt.getMonth() === today.getMonth() &&
            createdAt.getDate() === today.getDate()
          );
        });
        setOrders(todayOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleSearch = () => {
    setSubmitted(true);
    const ticketId = ticketSuffix ? `${ticketDate}-${ticketSuffix}` : '';
    const qTicket = ticketId.trim().toLowerCase();
    const qMobile = mobile.trim().toLowerCase();

    const matched = orders.filter(order =>
      (qTicket && order.ticketId.toLowerCase() === qTicket) ||
      (qMobile && order.customer.mobile.toLowerCase() === qMobile)
    );

    setFiltered(matched);
  };

  const handleClear = () => {
    setTicketSuffix('');
    setMobile('');
    setFiltered([]);
    setSubmitted(false);
  };

  return (
    <Box p={{ xs: 2, sm: 3 }} bgcolor={theme.palette.grey[50]} minHeight="100vh">
      <Typography variant="h5" textAlign="center" fontWeight="bold" mb={2} color="primary.dark">
        Order Track Report
      </Typography>

      <Paper elevation={1} sx={{ p: 2, maxWidth: 700, mx: 'auto', mb: 3, borderRadius: 2 }}>
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth
              label="Ticket ID (Last 4 digits)"
              value={ticketSuffix}
              onChange={(e) => setTicketSuffix(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm="auto">
            <Typography textAlign="center" color="text.secondary" variant="body2" fontWeight="medium">OR</Typography>
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth
              label="Mobile Number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              size="small"
            />
          </Grid>
  <Grid item xs={12}>
  <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
    <Button
      variant="contained"
      size="small"
      startIcon={<SearchIcon />}
      onClick={handleSearch}
      disabled={loading}
      sx={{ minWidth: 120 }}
    >
      Submit
    </Button>
    <Button
      variant="contained"
      color="error"
      size="small"
      startIcon={<ClearIcon />}
      onClick={handleClear}
      sx={{ minWidth: 120 }}
    >
      Clear
    </Button>
  </Box>
</Grid>

        </Grid>
        <Typography variant="caption" color="text.secondary" mt={1} display="block">
          Searching from today's records: <strong>{ticketDate}</strong>
        </Typography>
      </Paper>

      {loading ? (
        <Box textAlign="center"><CircularProgress /></Box>
      ) : (
        submitted && (
          filtered.length === 0 ? (
            <Typography textAlign="center" color="text.secondary">No matching records found.</Typography>
          ) : (
            filtered.map(order => {
              const ts = order.statusTimestamps || {};
              const status = getCurrentStatus(ts);
              const totalTime = formatDuration(ts.onBoard, ts.served);

              return (
                <Paper key={order._id} elevation={2} sx={{ p: 2, mb: 3, maxWidth: 700, mx: 'auto', borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    🎟️ {order.ticketId} - {order.customer.name}
                  </Typography>
                  <Chip label={status} color="primary" size="small" sx={{ my: 1 }} />
                  <Typography variant="body2"><strong>Mobile:</strong> {order.customer.mobile}</Typography>
                  <Typography variant="body2" mb={2}><strong>Total Time:</strong> {totalTime}</Typography>

                  <Divider sx={{ mb: 2 }} />

                  {isMobile ? renderVerticalTimeline(order) : renderHorizontalTimeline(order)}
                </Paper>
              );
            })
          )
        )
      )}
    </Box>
  );
};

export default OrderTimeReport;
