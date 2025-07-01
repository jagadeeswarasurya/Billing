import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Tooltip, Stack
} from '@mui/material';
import { SwapVert } from '@mui/icons-material';
import axios from 'axios';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import PrintIcon from '@mui/icons-material/Print';
import IconButton from '@mui/material/IconButton';
const API_URL = 'https://caferiadbnode.glitch.me' || 'http://localhost:5000';

const STATUS_LIST = ['onBoard', 'preparing', 'ready', 'served', 'canceled'];

const BillReport = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/orders`);
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    let filtered = [...orders];

   if (searchText.trim() !== '') {
  const keyword = searchText.toLowerCase();
  filtered = filtered.filter(order =>
    order.ticketId.toLowerCase().includes(keyword) ||
    order.customer.name.toLowerCase().includes(keyword) ||
    order.customer.mobile.toLowerCase().includes(keyword) ||
    order.serviceType.toLowerCase().includes(keyword) ||
    (order.paymentMode && order.paymentMode.toLowerCase().includes(keyword)) ||
    order.items.some(item => item.title.toLowerCase().includes(keyword))
  );
}


    if (selectedStatus) {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(order => new Date(order.createdAt) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(order => new Date(order.createdAt) <= toDate);
    }

    filtered.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortNewestFirst ? timeB - timeA : timeA - timeB;
    });

    setFilteredOrders(filtered);
  }, [orders, searchText, selectedStatus, dateFrom, dateTo, sortNewestFirst]);


const handlePrintBill = async (order) => {
  const {
    customer,
    items,
    total,
    totalQty,
    paymentMode,
    serviceType,
    createdAt,
    ticketId,
    receivedCash,
    balance,
    bankName,
    cardDigits
  } = order;

  const itemHeight = 4;
  const estimatedHeight = 100 + (items.length * itemHeight) + 70;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, Math.max(estimatedHeight, 130)],
  });

  const pageWidth = 80;
  let y = 10;

  // Logo
  const logo = new Image();
  logo.src = '/logo.png';
  try {
    await new Promise((res, rej) => {
      logo.onload = res;
      logo.onerror = rej;
    });
    pdf.addImage(logo, 'PNG', (pageWidth - 20) / 2, y, 20, 20);
    y += 24;
  } catch {
    y += 4;
  }

  pdf.setFont('courier', 'normal');

  // Header
  pdf.setFontSize(13).setFont(undefined, 'bold');
  pdf.text('CAFÉRIA', pageWidth / 2, y, { align: 'center' });
  y += 6;

  pdf.setFontSize(7).setFont(undefined, 'normal');
  pdf.text(`Date: ${new Date(createdAt).toLocaleDateString()}`, 4, y);
  pdf.text(`Service: ${serviceType}`, pageWidth - 4, y, { align: 'right' });
  y += 5;

  // Customer Info
  pdf.text(`Customer: ${customer.name}`, 4, y);
  y += 4;
  pdf.text(`Phone: ${customer.mobile}`, 4, y);
  y += 6;

  // Table Headers
  pdf.setFont(undefined, 'bold');
  pdf.text('Item', 4, y);
  pdf.text('Qty', 42, y, { align: 'center' });
  pdf.text('Rate', 60, y, { align: 'right' });
  pdf.text('Amt', 76, y, { align: 'right' });
  y += 2;
  pdf.setLineWidth(0.3).line(4, y, 76, y);
  y += 3;

  // Items
  pdf.setFont(undefined, 'normal');
  items.forEach(item => {
    const itemTotal = item.qty * item.rate;
    pdf.text(item.title.slice(0, 22), 4, y);
    pdf.text(item.qty.toString(), 42, y, { align: 'center' });
    pdf.text(item.rate.toFixed(2), 60, y, { align: 'right' });
    pdf.text(itemTotal.toFixed(2), 76, y, { align: 'right' });
    y += 4;
  });

  y += 1;
  pdf.line(4, y, 76, y);
  y += 4;

  // Totals
  pdf.setFontSize(7.5).setFont(undefined, 'bold');
  pdf.text(`Total Qty: ${totalQty}`, 4, y);
  pdf.text(`Total: ${total.toFixed(2)}`, 76, y, { align: 'right' });
  y += 4;

  const taxableAmount = (total / 1.05).toFixed(2);
  const taxAmount = (total - taxableAmount).toFixed(2);

  pdf.text(`Taxable: ${taxableAmount}`, 4, y);
  pdf.text(`GST (5%): ${taxAmount}`, 76, y, { align: 'right' });
  y += 4;
  pdf.text(`Total (incl. GST): ${total.toFixed(2)}`, pageWidth / 2, y, { align: 'center' });
  y += 6;

  // Payment Info
  pdf.setFontSize(7.5).setFont(undefined, 'bold');
  pdf.text(`Payment Mode: ${paymentMode}`, 4, y);
  y += 4;
  pdf.setFontSize(7).setFont(undefined, 'normal');

  if (paymentMode === 'Cash') {
    pdf.text(`Received`, 4, y);
    pdf.text(receivedCash?.toFixed(2) || '0.00', 76, y, { align: 'right' });
    y += 4;
    pdf.text(`Balance`, 4, y);
    pdf.text(balance?.toFixed(2) || '0.00', 76, y, { align: 'right' });
    y += 4;
  } else if (paymentMode === 'Card') {
    pdf.text(`Bank: ${bankName || 'N/A'}`, 4, y);
    y += 4;
    pdf.text(`Card: **** **** **** ${cardDigits || 'XXXX'}`, 4, y);
    y += 4;
  } 

  // QR Code
  const ticketSuffix = ticketId.split('-')[1];
  const qrUrl = `https://caferiatrackorder.netlify.app/ticket/${ticketSuffix}`;
  const qrDataUrl = await QRCode.toDataURL(qrUrl);

  pdf.addImage(qrDataUrl, 'PNG', (pageWidth - 26) / 2, y, 26, 26);
  y += 28;

  pdf.setFontSize(6.5).setFont(undefined, 'italic');
  pdf.text('Scan to track your order.', pageWidth / 2, y, { align: 'center' });
  y += 5;

  pdf.setFontSize(7.5).setFont(undefined, 'bold');
  pdf.text(`Ticket ID: ${ticketId}`, pageWidth / 2, y, { align: 'center' });
  y += 6;

  // Footer
  pdf.setFontSize(6.2).setFont(undefined, 'italic');
  pdf.text('Please wait while your food is being prepared.', pageWidth / 2, y, { align: 'center' });
  y += 3.5;
  pdf.text('Estimated preparation time: 15–30 mins.', pageWidth / 2, y, { align: 'center' });

  pdf.save(`Order_${ticketId}.pdf`);
};


  return (
    <Box sx={{ p: 4, backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 600 }}>
       Bill Wise Report
      </Typography>

      <Paper sx={{ p: 2, mb: 3, boxShadow: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            label="Search orders"
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 200 }}
          />
          <TextField
            label="From Date"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <TextField
            label="To Date"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <Tooltip title={`Sort by ${sortNewestFirst ? 'Oldest' : 'Newest'}`}>
            <SwapVert
              onClick={() => setSortNewestFirst(prev => !prev)}
              style={{ cursor: 'pointer', fontSize: 30 }}
            />
          </Tooltip>
        </Stack>

        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {STATUS_LIST.map(status => (
            <Chip
              key={status}
              label={status.charAt(0).toUpperCase() + status.slice(1)}
              variant={selectedStatus === status ? 'filled' : 'outlined'}
              onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
            />
          ))}
          <Chip
            label="Clear Filter"
            variant="outlined"
            onClick={() => setSelectedStatus(null)}
          />
        </Box>
      </Paper>

      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
        Showing {filteredOrders.length} record(s)
      </Typography>

      <TableContainer component={Paper} elevation={2}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f0f0f0' }}>
            <TableRow>
              <TableCell><strong>Ticket ID</strong></TableCell>
              <TableCell><strong>Customer</strong></TableCell>
              <TableCell><strong>Service</strong></TableCell>
              <TableCell><strong>Qty</strong></TableCell>
              <TableCell><strong>Total</strong></TableCell>
              <TableCell><strong>Payment</strong></TableCell>
              <TableCell><strong>Items</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Print</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">No orders found.</TableCell>
              </TableRow>
            ) : (
              filteredOrders.map(order => (
                <TableRow key={order._id} hover>
                  <TableCell>{order.ticketId}</TableCell>
                  <TableCell>
                    {order.customer.name} <br />
                    <Typography variant="caption" color="text.secondary">
                      {order.customer.mobile}
                    </Typography>
                  </TableCell>
                  <TableCell>{order.serviceType}</TableCell>
                  <TableCell>{order.totalQty}</TableCell>
                  <TableCell>₹{order.total}</TableCell>
                  <TableCell>{order.paymentMode || 'N/A'}</TableCell>
                  <TableCell>
                {order.items.map((item, i) => (
  <Typography key={i} variant="caption" display="block">
    {item.title} × {item.qty} @ ₹{item.rate}
  </Typography>
))}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
  <Tooltip title="Print Bill">
    <IconButton onClick={() => handlePrintBill(order)} size="small" color="primary">
      <PrintIcon />
    </IconButton>
  </Tooltip>
</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default BillReport;
