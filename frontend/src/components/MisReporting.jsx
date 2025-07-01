import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Divider, Stack, Button, TextField
} from '@mui/material';
import axios from 'axios';
import dayjs from 'dayjs';

const API_URL = 'https://billing-6qkq.onrender.com/';

const fieldLabels = {
  customer: 'Customer',
  mobile: 'Mobile',
  ticketId: 'Ticket ID',
  serviceType: 'Service Type',
  paymentMode: 'Payment Mode',
  status: 'Status',
  category: 'Item Category'
};

const MISReporting = () => {
  const [orders, setOrders] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [selectedValue, setSelectedValue] = useState(null);
  const [search, setSearch] = useState('');
  const [valueSearch, setValueSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/orders`);
      setOrders(data);
    } catch (err) {
      console.error('Error fetching data', err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getDistinctValues = (field) => {
    const values = new Set();
    orders.forEach(order => {
      switch (field) {
        case 'customer':
          values.add(order.customer.name);
          break;
        case 'mobile':
          values.add(order.customer.mobile);
          break;
        case 'ticketId':
          values.add(order.ticketId);
          break;
        case 'serviceType':
          values.add(order.serviceType);
          break;
        case 'paymentMode':
          values.add(order.paymentMode);
          break;
        case 'status':
          values.add(order.status);
          break;
        case 'category':
          order.items.forEach(item => values.add(item.category || item.title));
          break;
        default:
          break;
      }
    });
    return Array.from(values);
  };

  const isWithinDateRange = (date) => {
    if (!fromDate && !toDate) return true;
    const d = dayjs(date);
    if (fromDate && d.isBefore(dayjs(fromDate), 'day')) return false;
    if (toDate && d.isAfter(dayjs(toDate), 'day')) return false;
    return true;
  };

  const filteredOrders = orders.filter(order => {
    if (!selectedField || !selectedValue) return false;
    const match = (() => {
      switch (selectedField) {
        case 'customer': return order.customer.name === selectedValue;
        case 'mobile': return order.customer.mobile === selectedValue;
        case 'ticketId': return order.ticketId === selectedValue;
        case 'serviceType': return order.serviceType === selectedValue;
        case 'paymentMode': return order.paymentMode === selectedValue;
        case 'status': return order.status === selectedValue;
        case 'category': return order.items.some(item => item.category === selectedValue || item.title === selectedValue);
        default: return false;
      }
    })();
    return match && isWithinDateRange(order.createdAt);
  }).filter(order => {
    const lower = search.toLowerCase();
    return (
      order.customer.name?.toLowerCase().includes(lower) ||
      order.ticketId?.toLowerCase().includes(lower) ||
      order.paymentMode?.toLowerCase().includes(lower) ||
      order.serviceType?.toLowerCase().includes(lower) ||
      order.status?.toLowerCase().includes(lower)
    );
  });

  const totalQty = filteredOrders.reduce((sum, o) => sum + o.totalQty, 0);
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);

  const handleBack = () => {
    if (selectedValue) {
      setSelectedValue(null);
      setSearch('');
    } else {
      setSelectedField(null);
      setValueSearch('');
    }
  };

  const applyQuickFilter = (range) => {
    const now = dayjs();
    switch (range) {
      case 'today':
        setFromDate(now.format('YYYY-MM-DD'));
        setToDate(now.format('YYYY-MM-DD'));
        break;
      case 'week':
        setFromDate(now.startOf('week').format('YYYY-MM-DD'));
        setToDate(now.endOf('week').format('YYYY-MM-DD'));
        break;
      case 'month':
        setFromDate(now.startOf('month').format('YYYY-MM-DD'));
        setToDate(now.endOf('month').format('YYYY-MM-DD'));
        break;
      default:
        setFromDate('');
        setToDate('');
    }
  };

  return (
    <Box sx={{ bgcolor: '#f4f6f8', p: { xs: 1, md: 3 }, minHeight: '100vh' }}>
  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
    
    {/* LEFT PANEL */}
    <Paper elevation={2} sx={{
      width: { xs: '100%', md: 260 },
      p: 2,
      maxHeight: { xs: 'none', md: '90vh' },
      overflowY: 'auto'
    }}>
      <Typography variant="h6" gutterBottom>🧭 MIS Fields</Typography>
      <Divider sx={{ mb: 2 }} />
      <Stack spacing={1}>
        {Object.entries(fieldLabels).map(([fieldKey, label]) => (
          <Box
            key={fieldKey}
            sx={{
              px: 2, py: 1,
              backgroundColor: selectedField === fieldKey ? 'primary.main' : 'grey.200',
              color: selectedField === fieldKey ? '#fff' : 'text.primary',
              borderRadius: 1,
              cursor: 'pointer',
              textAlign: 'center',
              '&:hover': {
                backgroundColor: selectedField === fieldKey ? 'primary.dark' : 'primary.light',
                color: '#fff'
              }
            }}
            onClick={() => {
              setSelectedField(fieldKey);
              setSelectedValue(null);
            }}
          >
            {label}
          </Box>
        ))}
      </Stack>
    </Paper>

    {/* RIGHT PANEL */}
    <Box sx={{ flex: 1 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
        MIS Reporting
      </Typography>

      {selectedField && (
        <Box sx={{ mb: 2 }}>
          <Button variant="outlined" size="small" onClick={handleBack}>⬅ Back</Button>
        </Box>
      )}

      {selectedField && !selectedValue && (
        <>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Select a <strong>{fieldLabels[selectedField]}</strong> value:
          </Typography>
          <Paper sx={{ p: 2 }}>
            <TextField
              fullWidth
              label={`Search ${fieldLabels[selectedField]} values`}
              size="small"
              value={valueSearch}
              onChange={(e) => setValueSearch(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Stack spacing={1}>
              {getDistinctValues(selectedField)
                .filter(val => val?.toLowerCase().includes(valueSearch.toLowerCase()))
                .map((value, idx) => (
                  <Box
                    key={idx}
                    onClick={() => setSelectedValue(value)}
                    sx={{
                      px: 2, py: 1,
                      backgroundColor: 'grey.100',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'primary.light', color: '#fff' }
                    }}
                  >
                    {value || 'N/A'}
                  </Box>
                ))}
            </Stack>
          </Paper>
        </>
      )}

      {/* Filtered Orders Table */}
      {selectedField && selectedValue && (
        <>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Showing orders where <strong>{fieldLabels[selectedField]}</strong> is <strong>{selectedValue}</strong>
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}>
            <TextField
              label="From"
              type="date"
              size="small"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              sx={{ width: 130 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="To"
              type="date"
              size="small"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              sx={{ width: 130 }}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="outlined" size="small" onClick={() => applyQuickFilter('today')}>Today</Button>
            <Button variant="outlined" size="small" onClick={() => applyQuickFilter('week')}>Week</Button>
            <Button variant="outlined" size="small" onClick={() => applyQuickFilter('month')}>Month</Button>
            <Button variant="text" color="error" size="small" onClick={() => { setFromDate(''); setToDate(''); }}>
              Clear
            </Button>
          </Stack>

          <TextField
            fullWidth
            label="Search orders"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Paper sx={{ p: 2, mb: 2, bgcolor: '#fffbe6' }}>
            <Typography variant="body1"><strong>Total Orders:</strong> {filteredOrders.length}</Typography>
            <Typography variant="body1"><strong>Total Quantity:</strong> {totalQty}</Typography>
            <Typography variant="body1"><strong>Total Revenue:</strong> ₹{totalRevenue}</Typography>
          </Paper>

          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 600 }}>
              <TableHead sx={{ backgroundColor: '#e0e0e0' }}>
                <TableRow>
                  <TableCell>Ticket ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Qty</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.map(order => (
                  <TableRow key={order._id}>
                    <TableCell>{order.ticketId}</TableCell>
                    <TableCell>{order.customer.name}</TableCell>
                    <TableCell>{order.serviceType}</TableCell>
                    <TableCell>{order.totalQty}</TableCell>
                    <TableCell>₹{order.total}</TableCell>
                    <TableCell>{order.paymentMode}</TableCell>
                    <TableCell>{order.status}</TableCell>
                  </TableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No matching records.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  </Stack>
</Box>

  );
};

export default MISReporting;
