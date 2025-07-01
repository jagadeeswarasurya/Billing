import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Table, TableHead, TableRow, TableCell,
  TableBody, Paper, Grid, Stack, TextField
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import TodayIcon from '@mui/icons-material/Today';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

import axios from 'axios';
import * as XLSX from 'xlsx';

const API_URL = 'https://billing-6qkq.onrender.com/';

const OrderReporting = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/orders`);
      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const applyFilter = () => {
    let filtered = [...orders];

    if (fromDate) {
      filtered = filtered.filter(order => new Date(order.createdAt) >= new Date(fromDate));
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59);
      filtered = filtered.filter(order => new Date(order.createdAt) <= to);
    }

    if (searchText.trim()) {
      const keyword = searchText.toLowerCase();
      filtered = filtered.filter(order =>
        order.ticketId.toLowerCase().includes(keyword) ||
        order.customer.name.toLowerCase().includes(keyword) ||
        order.customer.mobile.toLowerCase().includes(keyword) ||
        order.status.toLowerCase().includes(keyword) ||
        order.serviceType.toLowerCase().includes(keyword) ||
        order.paymentMode.toLowerCase().includes(keyword) ||
        String(order.total).includes(keyword) ||
        String(order.totalQty).includes(keyword)
      );
    }

    setFilteredOrders(filtered);
  };

  const quickFilter = (type) => {
    const today = new Date();
    const start = new Date(today);
    let end = new Date(today);

    if (type === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (type === 'week') {
      const day = today.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      start.setDate(today.getDate() - diffToMonday);
      start.setHours(0, 0, 0, 0);
    } else if (type === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    }

    setFromDate(start);
    setToDate(type === 'today' ? end : today);
    setTimeout(applyFilter, 100);
  };

  const downloadExcel = () => {
    const data = filteredOrders.map(order => ({
      TicketID: order.ticketId,
      Customer: `${order.customer.name} (${order.customer.mobile})`,
      Service: order.serviceType,
      Qty: order.totalQty,
      Total: order.total,
      Payment: order.paymentMode,
      Status: order.status,
      Date: new Date(order.createdAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    XLSX.writeFile(workbook, 'Order_Report.xlsx');
  };
const applyFilterOnInput = (text) => {
  let filtered = [...orders];

  if (fromDate) {
    filtered = filtered.filter(order => new Date(order.createdAt) >= new Date(fromDate));
  }
  if (toDate) {
    const to = new Date(toDate);
    to.setHours(23, 59, 59);
    filtered = filtered.filter(order => new Date(order.createdAt) <= to);
  }

  if (text.trim()) {
    const keyword = text.toLowerCase();
    filtered = filtered.filter(order =>
      order.ticketId.toLowerCase().includes(keyword) ||
      order.customer.name.toLowerCase().includes(keyword) ||
      order.customer.mobile.toLowerCase().includes(keyword) ||
      order.status.toLowerCase().includes(keyword) ||
      order.serviceType.toLowerCase().includes(keyword) ||
      order.paymentMode.toLowerCase().includes(keyword) ||
      String(order.total).includes(keyword) ||
      String(order.totalQty).includes(keyword)
    );
  }

  setFilteredOrders(filtered);
};
const downloadJSON = () => {
  const jsonData = filteredOrders.map(order => ({
    ticketId: order.ticketId,
    customer: {
      name: order.customer.name,
      mobile: order.customer.mobile
    },
    serviceType: order.serviceType,
    totalQty: order.totalQty,
    total: order.total,
    paymentMode: order.paymentMode,
    status: order.status,
    createdAt: order.createdAt
  }));

  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Order_Report.json';
  link.click();
  URL.revokeObjectURL(url);
};
  return (
  <LocalizationProvider dateAdapter={AdapterDateFns}>
  <Box sx={{ p: { xs: 2, sm: 3 } }}>
    {/* Title */}
    <Typography
      variant="h5"
      align="center"
      sx={{
        fontWeight: 600,
        mb: 3,
        fontSize: { xs: '1.3rem', sm: '1.6rem' },
        color: '#1a1a1a',
      }}
    >
      Order Reports
    </Typography>

    {/* Filters Section */}
   {/* Filters Section */}
<Grid container spacing={2} alignItems="center" mb={1}>
  {/* Date Pickers */}
  <Grid item xs={6} sm={2.5}>
    <DatePicker
      label="From"
      value={fromDate}
      onChange={setFromDate}
      slotProps={{
        textField: {
          size: 'small',
          fullWidth: true,
          sx: {
            backgroundColor: '#fff',
            input: { color: '#000', fontSize: '0.8rem' },
            label: { color: '#000', fontSize: '0.75rem' },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#000',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#000',
            },
            '& .MuiSvgIcon-root': {
              color: '#000',
            },
          },
        },
      }}
    />
  </Grid>
  <Grid item xs={6} sm={2.5}>
    <DatePicker
      label="To"
      value={toDate}
      onChange={setToDate}
      slotProps={{
        textField: {
          size: 'small',
          fullWidth: true,
          sx: {
            backgroundColor: '#fff',
            input: { color: '#000', fontSize: '0.8rem' },
            label: { color: '#000', fontSize: '0.75rem' },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#000',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#000',
            },
            '& .MuiSvgIcon-root': {
              color: '#000',
            },
          },
        },
      }}
    />
  </Grid>

  {/* Quick Filters */}
{/* Icon Quick Filters */}
{/* Icon Quick Filters */}
<Grid item xs={12}>
  <Box display="flex" justifyContent="flex-end">
    <Stack direction="row" spacing={3} alignItems="center">
      {[
        {
          label: 'Today',
          icon: <TodayIcon fontSize="small" />,
          action: () => quickFilter('today'),
        },
        {
          label: 'This Week',
          icon: <CalendarViewWeekIcon fontSize="small" />,
          action: () => quickFilter('week'),
        },
        {
          label: 'This Month',
          icon: <CalendarMonthIcon fontSize="small" />,
          action: () => quickFilter('month'),
        },
      ].map(({ label, icon, action }) => (
        <Box key={label} textAlign="center">
          <Button
            onClick={action}
            variant="outlined"
            size="small"
            sx={{
              minWidth: 40,
              minHeight: 40,
              borderRadius: '50%',
              p: 1,
              mb: 0.5,
              borderColor: '#000',
              color: '#000',
            }}
          >
            {icon}
          </Button>
          <Typography variant="caption" display="block" fontSize="0.7rem">
            {label}
          </Typography>
        </Box>
      ))}
    </Stack>
  </Box>
</Grid>

</Grid>

{/* Centered Apply and Download Buttons */}
<Box textAlign="center" mb={2}>
  <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
    <Button
      variant="contained"
      size="small"
      onClick={applyFilter}
      sx={{
        fontSize: '0.75rem',
        px: 2,
        py: 0.7,
        textTransform: 'none',
        fontWeight: 500,
        borderRadius: 1,
      }}
    >
      Apply
    </Button>
    <Button
      variant="contained"
      color="success"
      size="small"
      onClick={downloadExcel}
      sx={{
        fontSize: '0.75rem',
        px: 2,
        py: 0.7,
        textTransform: 'none',
        fontWeight: 500,
        borderRadius: 1,
      }}
    >
      Download Excel
    </Button>
    <Button
      variant="contained"
      color="primary"
      size="small"
      onClick={downloadJSON}
      sx={{
        fontSize: '0.75rem',
        px: 2,
        py: 0.7,
        textTransform: 'none',
        fontWeight: 500,
        borderRadius: 1,
      }}
    >
      Download JSON
    </Button>
  </Stack>
</Box>


    {/* Search Input */}
    <Box mb={2}>
      <TextField
        label="Search Records"
        variant="outlined"
        size="small"
        fullWidth
        value={searchText}
       onChange={(e) => {
  setSearchText(e.target.value);
  applyFilterOnInput(e.target.value);
  }}
        sx={{
          backgroundColor: '#fff',
          input: { color: '#000' },
          label: { color: '#000' },
        }}
      />
    </Box>

    {/* Responsive Table */}
    <Paper elevation={2} sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            {[
              'Ticket ID',
              'Customer',
              'Service',
              'Qty',
              'Total',
              'Payment',
              'Status',
              'Date',
            ].map((head) => (
              <TableCell key={head} sx={{ fontWeight: 600 }}>
                {head}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredOrders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                No records found.
              </TableCell>
            </TableRow>
          ) : (
            filteredOrders.map((order) => (
              <TableRow key={order._id}>
                <TableCell>{order.ticketId}</TableCell>
                <TableCell>
                  {order.customer.name} ({order.customer.mobile})
                </TableCell>
                <TableCell>{order.serviceType}</TableCell>
                <TableCell>{order.totalQty}</TableCell>
                <TableCell>₹{order.total}</TableCell>
                <TableCell>{order.paymentMode}</TableCell>
                <TableCell>{order.status}</TableCell>
                <TableCell>
                  {new Date(order.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Paper>
  </Box>
</LocalizationProvider>

  );
};

export default OrderReporting;
