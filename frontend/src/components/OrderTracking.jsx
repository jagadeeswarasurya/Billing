import React, { useEffect, useState, useCallback} from 'react';
import {
  Box, Typography, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Grid, Tabs, Tab, IconButton, Tooltip,Snackbar, Alert
} from '@mui/material';
import { ArrowForward, Cancel, SwapVert  } from '@mui/icons-material';
import axios from 'axios';

const API_URL = 'https://billing-6qkq.onrender.com/';

const STATUS_STEPS = ['all', 'onBoard', 'preparing', 'ready', 'served', 'canceled'];
const STATUS_COLORS = {
  all: 'default',
  onBoard: 'primary',
  preparing: 'info',
  ready: 'warning',
  served: 'success',
  canceled: 'error',
};

const OrderTracking = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedTab, setSelectedTab] = useState('onBoard');
  const [searchText, setSearchText] = useState('');
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
const [snackbarOpen, setSnackbarOpen] = useState(false);
const [prevOrderIds, setPrevOrderIds] = useState([]);
const getDurationText = (createdAt, status, updatedAt) => {
  const start = new Date(createdAt).getTime();
  const end = ['served', 'canceled'].includes(status) && updatedAt
    ? new Date(updatedAt).getTime()
    : Date.now();

  const durationMs = end - start;
  const minutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(minutes / 60);

  if (['served', 'canceled'].includes(status)) {
    const label = status === 'served' ? 'Served in' : 'Canceled in';
    return hours > 0
      ? `${label} ${hours}h ${minutes % 60}m`
      : `${label} ${minutes} mins`;
  }

  return hours > 0
    ? `${hours}h ${minutes % 60}m ago`
    : `${minutes} mins ago`;
};

 const fetchOrders = useCallback(async () => {
  try {
    const { data } = await axios.get(`${API_URL}/api/orders`);

    const currentOrderIds = data.map(order => order._id);
    const newOrderExists = prevOrderIds.length > 0 && currentOrderIds.some(id => !prevOrderIds.includes(id));

    if (newOrderExists) {
      setSnackbarOpen(true);
    }

    setPrevOrderIds(currentOrderIds);
    setOrders(data);
  } catch (err) {
    console.error('Failed to fetch orders', err);
  }
}, [prevOrderIds]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Apply filter and sort
  useEffect(() => {
  let filtered = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    const today = new Date();

    return (
      orderDate.getFullYear() === today.getFullYear() &&
      orderDate.getMonth() === today.getMonth() &&
      orderDate.getDate() === today.getDate()
    );
  });

  if (selectedTab !== 'all') {
    filtered = filtered.filter(order => order.status === selectedTab);
  }

  if (searchText.trim() !== '') {
    const keyword = searchText.toLowerCase();
    filtered = filtered.filter(order =>
      order.ticketId.toLowerCase().includes(keyword) ||
      order.customer.name.toLowerCase().includes(keyword) ||
      order.customer.mobile.toLowerCase().includes(keyword) ||
      order.serviceType.toLowerCase().includes(keyword)
    );
  }

  filtered.sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortNewestFirst ? timeB - timeA : timeA - timeB;
  });

  setFilteredOrders(filtered);
}, [orders, selectedTab, searchText, sortNewestFirst]);

  const handleStatusChange = async (order, direction) => {
  const currentIndex = STATUS_STEPS.indexOf(order.status);
  let newStatus = order.status;

  if (direction === 'next' && currentIndex < STATUS_STEPS.length - 1) {
    newStatus = STATUS_STEPS[currentIndex + 1];
  } else if (direction === 'cancel') {
    newStatus = 'canceled';
  }

  const confirmed = window.confirm(`Are you sure you want to change status to "${newStatus}"?`);
  if (!confirmed) return;

  try {
    await axios.put(`${API_URL}/api/orders/${order.ticketId}`, { status: newStatus });
    fetchOrders();
  } catch (err) {
    alert('Failed to update status');
  }
};
const statusCounts = orders.reduce((acc, order) => {
  const createdAt = new Date(order.createdAt);
  const today = new Date();

  const isToday =
    createdAt.getFullYear() === today.getFullYear() &&
    createdAt.getMonth() === today.getMonth() &&
    createdAt.getDate() === today.getDate();

  if (isToday) {
    acc.all = (acc.all || 0) + 1;
    acc[order.status] = (acc[order.status] || 0) + 1;
  }

  return acc;
}, {});

const getRowStyle = (createdAt, status) => {
  const baseStyle = {
    color: '#000000' // black text
  };

  if (status === 'served') {
    return { ...baseStyle, backgroundColor: '#c8e6c9' }; // strong light green
  }

  if (status === 'ready') {
    return { ...baseStyle, backgroundColor: '#dcedc8' }; // light lime green
  }

  const age = Date.now() - new Date(createdAt).getTime();

  if (age > 15 * 60 * 1000) {
    return { ...baseStyle, backgroundColor: '#ffcdd2' }; // pinkish red
  }

  if (age > 10 * 60 * 1000) {
    return { ...baseStyle, backgroundColor: '#ffecb3' }; // stronger yellow
  }

  return { ...baseStyle, backgroundColor: '#e0e0e0' }; // neutral grey
};


  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={2}>
   <Typography variant="h6" sx={{ mb: 2 }}>
  {selectedTab === 'all'
    ? 'Today Orders'
    : `${selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} Orders`}
</Typography>
</Box>

      <Tabs
  value={selectedTab}
  onChange={(e, newValue) => setSelectedTab(newValue)}
  sx={{ mb: 2 }}
  variant="scrollable"
  scrollButtons="auto"
>
  {STATUS_STEPS.map(status => (
    <Tab
      key={status}
      value={status}
      icon={
        <Chip
          label={`${status.charAt(0).toUpperCase() + status.slice(1)} (${statusCounts[status] || 0})`}
          color={STATUS_COLORS[status]}
          size="small"
        />
      }
      iconPosition="start"
    />
  ))}
</Tabs>


      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
        <TextField
          label="Search orders (name, mobile, ticket ID, service)"
          size="small"
          fullWidth
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ mr: 2 }}
        />
        <Tooltip title={`Sort by ${sortNewestFirst ? 'Oldest' : 'Newest'}`}>
          <IconButton onClick={() => setSortNewestFirst(prev => !prev)}>
            <SwapVert sx={{ color: 'black' }} />
          </IconButton>
        </Tooltip>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Ticket ID</TableCell>
                          <TableCell>Customer</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Qty</TableCell>
                           <TableCell>Items</TableCell>
              {selectedTab === 'all' && <TableCell>Status</TableCell>}
                <TableCell>Duration</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">No orders found.</TableCell>
              </TableRow>
            ) : (
              filteredOrders.map(order => (
               <TableRow key={order._id} style={getRowStyle(order.createdAt, order.status)}>
                  <TableCell>{order.ticketId}</TableCell>
                                    <TableCell>{order.customer.name} ({order.customer.mobile})</TableCell>
                  <TableCell>{order.serviceType}</TableCell>
                  <TableCell>{order.totalQty}</TableCell>
                                   <TableCell>
                    {order.items.map((item, i) => (
                      <Typography key={i} variant="caption" display="block">
                        {item.title} × {item.qty}
                      </Typography>
                    ))}
                  </TableCell>
                  {selectedTab === 'all' && (
                    <TableCell>
                      <Chip label={order.status} color={STATUS_COLORS[order.status]} size="small" />
                    </TableCell>
                  )}<TableCell>{getDurationText(order.createdAt, order.status, order.updatedAt)}</TableCell>
                  <TableCell align="center">
                    {order.status !== 'served' && order.status !== 'canceled' ? (
                      <Grid container spacing={1} justifyContent="center">
                        <Grid item>
                          <Tooltip title="Next">
                            <IconButton
                              color="primary"
                              onClick={() => handleStatusChange(order, 'next')}
                            >
                              <ArrowForward />
                            </IconButton>
                          </Tooltip>
                        </Grid>
                        <Grid item>
                          <Tooltip title="Cancel">
                            <IconButton
                              color="error"
                              onClick={() => handleStatusChange(order, 'cancel')}
                            >
                              <Cancel />
                            </IconButton>
                          </Tooltip>
                        </Grid>
                      </Grid>
                    ) : (
                      <Typography
                        variant="caption"
                        color={order.status === 'served' ? 'green' : 'red'}
                      >
                        {order.status === 'served' ? '✅ Served' : '❌ Canceled'}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
  <Snackbar
  open={snackbarOpen}
  onClose={() => setSnackbarOpen(false)}
  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
>
  <Alert
    onClose={() => setSnackbarOpen(false)}
    severity="info"
    sx={{ width: '100%' }}
  >
    New order received!
  </Alert>
</Snackbar>
    </Box>

  );
  
};

export default OrderTracking;
