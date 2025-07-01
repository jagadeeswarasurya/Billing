import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import {
  Box,  Table, TableHead, TableRow, TableCell,
  TableBody, TextField, Typography, Button, Grid,
  useMediaQuery, Divider, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';

const API_URL = 'https://billing-6qkq.onrender.com';
const OrderSummary = ({ customer, setCustomer, orders, setOrders, total }) => {
  const [lastSavedId, setLastSavedId] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const printRef = useRef();
const [serviceType, setServiceType] = useState('Dine In');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const totalQty = orders.reduce((sum, item) => sum + item.qty, 0);
const [receivedCash, setReceivedCash] = useState('');
const [cardDigits, setCardDigits] = useState('');
const [bankName, setBankName] = useState('');
const [isSaving, setIsSaving] = useState(false);
const [paymentError, setPaymentError] = useState(false)
const mobileRegex = /^[0-9]{10}$/;
const mobileError = customer.mobile && !mobileRegex.test(customer.mobile);

const handleSavePDF = async () => {
  if (!customer.name || !customer.mobile || orders.length === 0) {
    alert('Please complete customer details and add items.');
    return;
  }
// Mobile number must be 10 digits
const mobileRegex = /^[0-9]{10}$/;
if (!mobileRegex.test(customer.mobile)) {
  alert('Please enter a valid 10-digit mobile number.');
  return;
}
if (!paymentMode) {
  setPaymentError(true);
  alert('Please select a payment mode.');
  return;
}
setPaymentError(false);
setIsSaving(true); // start saving
  try {
    const response = await axios.post(`${API_URL}/api/orders`, {
      customer,
      items: orders,
      total,
      totalQty,
      paymentMode,
      serviceType,
      receivedCash: paymentMode === 'Cash' ? receivedCash : null,
  balance: paymentMode === 'Cash' ? (parseFloat(receivedCash || 0) - total).toFixed(2) : null,
  bankName: paymentMode === 'Card' ? bankName : null,
  cardDigits: paymentMode === 'Card' ? cardDigits : null,
    });

    const generatedId = response.data.ticketId;
    setLastSavedId(generatedId);

    const itemHeight = 4;
    const estimatedHeight = 100 + (orders.length * itemHeight) + 60;
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
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 4, y);
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
    orders.forEach(item => {
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
  const received = parseFloat(receivedCash || 0);
  const balance = (received - total).toFixed(2);

  pdf.text(`Received`, 4, y);
  pdf.text(received.toFixed(2), 76, y, { align: 'right' });
  y += 4;

  pdf.text(`Balance`, 4, y);
  pdf.text(balance, 76, y, { align: 'right' });
  y += 4;

} else if (paymentMode === 'Card') {
  pdf.text(`Bank`, 4, y);
  pdf.text(bankName || '-', 76, y, { align: 'right' });
  y += 4;

  pdf.text(`Card Ending`, 4, y);
  pdf.text(cardDigits || '****', 76, y, { align: 'right' });
  y += 4;

} else if (paymentMode === 'Upi') {
  pdf.text(`Paid`, pageWidth / 2, y, { align: 'center' });
  y += 4;
}

    // QR Code
    const ticketSuffix = generatedId.split('-')[1];
    const qrUrl = `https://caferiatrackorder.netlify.app/ticket/${ticketSuffix}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl);

    pdf.addImage(qrDataUrl, 'PNG', (pageWidth - 26) / 2, y, 26, 26);
    y += 28;

    // QR Instruction & Ticket ID
    pdf.setFontSize(6.5).setFont(undefined, 'italic');
    pdf.text('Scan the above QR to track your order.', pageWidth / 2, y, { align: 'center' });
    y += 5;

    pdf.setFontSize(7.5).setFont(undefined, 'bold');
    pdf.text(`Ticket ID: ${generatedId}`, pageWidth / 2, y, { align: 'center' });
    y += 6;

    // Footer
    pdf.setFontSize(6.2).setFont(undefined, 'italic');
    pdf.text('Please wait while your food is being prepared.', pageWidth / 2, y, { align: 'center' });
    y += 3.5;
    pdf.text('Estimated preparation time: 15–30 mins.', pageWidth / 2, y, { align: 'center' });

    // Save
  pdf.save(`Order_${generatedId}.pdf`);

alert('Order saved and PDF downloaded ✅');
setCustomer({ name: '', mobile: '' });
setOrders([]);
setReceivedCash('');
setCardDigits('');
setBankName('');
setLastSavedId('');
setServiceType('Dine In');   // or '' if you want it blank
setPaymentMode('');      // or '' if you want it blank
  } catch (error) {
    console.error('Save Error:', error);
    alert('Enter Mandatory Fields, Kindly Check! ');
  } finally {
    setIsSaving(false); // done saving
  }
};

  return (
    <Box sx={{ flex: 1, p: isMobile ? 1 : 2, fontSize: '0.75rem' }}>
      <div ref={printRef}>
      <Box
  sx={{
    backgroundColor: '#bdbdbd', // light grey background
    color: '#000',              // white text
    px: 2,
    py: 1,
    borderRadius: 1,
    textAlign: 'center',
    mb: 2,
  }}
>
  <Typography
    align="center"
    fontWeight="bold"
    sx={{ fontSize: '1.1rem', mb: 0 }}
  >
    Order Summary
  </Typography>
</Box>

        <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
          <Grid item><Typography fontSize="0.75rem"> {new Date().toLocaleDateString()}</Typography></Grid>
          <Grid item><Typography fontSize="0.75rem">Ticket ID: {lastSavedId}</Typography></Grid>
        </Grid>

        <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography fontWeight="bold" fontSize="0.8rem">Total Qty: {totalQty}</Typography>
          <Typography fontWeight="bold" fontSize="0.8rem">Total: ₹{total}</Typography>
        </Grid>

        {orders.length === 0 ? (
          <Typography align="center" fontSize="0.6rem" sx={{ my: 2 }}>
            No items in the order.
          </Typography>
        ) : (
         
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
  <TableRow>
    <TableCell  sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}>Item</TableCell>
    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}>Qty</TableCell>
    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}>Rate</TableCell>
    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}>Amt</TableCell>
    <TableCell sx={{ width: 10 }} /> {/* Delete column */}
  </TableRow>
</TableHead>

<TableBody>
  {orders.map((order, index) => (
    <TableRow key={index} sx={{ '&:nth-of-type(even)': { backgroundColor: '#fafafa' } }}>
      <TableCell sx={{ fontSize: '0.65rem' }}>{order.title}</TableCell>

      <TableCell sx={{ fontSize: '0.65rem' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            size="small"
            onClick={() =>
              setOrders(prev =>
                prev
                  .map(o => o.id === order.id ? { ...o, qty: o.qty - 1 } : o)
                  .filter(o => o.qty > 0)
              )
            }
            sx={{ minWidth: 24 }}
          >
            ➖
          </Button>
          <Typography sx={{ mx: 1, fontSize: '0.65rem' }}>{order.qty}</Typography>
          <Button
            size="small"
            onClick={() =>
              setOrders(prev =>
                prev.map(o => o.id === order.id ? { ...o, qty: o.qty + 1 } : o)
              )
            }
            sx={{ minWidth: 24 }}
          >
            ➕
          </Button>
        </Box>
      </TableCell>

      <TableCell align="right" sx={{ fontSize: '0.65rem' }}>₹{order.rate}</TableCell>
      <TableCell align="right" sx={{ fontSize: '0.65rem' }}>₹{order.qty * order.rate}</TableCell>

      <TableCell align="center">
      <Button
  onClick={() => setOrders(prev => prev.filter(o => o.id !== order.id))}
  size="small"
  sx={{
    minWidth: 0,
    p: 0.5,
    color: '#e53935',
    fontWeight: 'bold',
    fontSize: '0.85rem',
    lineHeight: 1,
    '&:hover': {
      backgroundColor: '#fdecea',
    },
  }}
>
  ×
</Button>

      </TableCell>
    </TableRow>
  ))}

  <TableRow sx={{ backgroundColor: '#e0f7fa' }}>
    <TableCell sx={{ fontSize: '0.65rem' }}><b>Total</b></TableCell>
    <TableCell align="center" sx={{ fontSize: '0.65rem' }}><b>{totalQty}</b></TableCell>
    <TableCell />
    <TableCell align="right" sx={{ fontSize: '0.65rem' }}><b>₹{total}</b></TableCell>
    <TableCell />
  </TableRow>
</TableBody>

            </Table>
     
        )}
      </div>

      <Divider sx={{ my: 2 }} />
<Typography fontWeight="bold" fontSize="0.65rem" mb={1}>Service Type</Typography>
<ToggleButtonGroup
  value={serviceType}
  exclusive
  onChange={(e, value) => value && setServiceType(value)}
  fullWidth
  sx={{
    mb: 2,
    '& .MuiToggleButton-root': {
      borderColor: '#ccc',
      fontSize: '0.65rem',
      fontWeight: 'bold',
      py: 0.5,
      px: 1,
      minHeight: '32px',
    },
  }}
>
  <ToggleButton
    value="Dine In"
    sx={{
      color: '#333',
      '&.Mui-selected': {
        backgroundColor: '#388e3c',
        color: '#fff',
        borderColor: '#2e7d32',
      },
    }}
  >
    Dine In
  </ToggleButton>

  <ToggleButton
    value="Take Away"
    sx={{
      color: '#333',
      '&.Mui-selected': {
        backgroundColor: '#d32f2f',
        color: '#fff',
        borderColor: '#b71c1c',
      },
    }}
  >
    Take Away
  </ToggleButton>
</ToggleButtonGroup>


      <Typography fontWeight="bold" fontSize="0.65rem" mb={1}>Customer Info</Typography>
     <TextField
  label="Customer Name"
  fullWidth
  value={customer.name}
  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
  size="small"
  sx={{
    mb: 1,
    '& .MuiInputBase-input': {
      fontSize: '0.7rem',
      py: 0.5,
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.7rem',
    },
  }}
/>

    <TextField
  label="Mobile Number"
  fullWidth
  value={customer.mobile}
  onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })}
  error={mobileError}
  helperText={mobileError ? 'Enter a valid 10-digit number' : ''}
  size="small"
  sx={{
    mb: 2,
    '& .MuiInputBase-input': {
      fontSize: '0.7rem',
      py: 0.5,
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.7rem',
    },
  }}
/>

<Typography fontWeight="bold" fontSize="0.65rem" mb={1} color={paymentError ? 'error' : 'inherit'}>
  Payment Mode {paymentError && <span style={{ color: 'red' }}>* Required</span>}
</Typography>

<ToggleButtonGroup
  value={paymentMode}
  exclusive
  onChange={(e, value) => {
    if (value) {
      setPaymentMode(value);
      setPaymentError(false); // clear error when selected
    }
  }}
  fullWidth
  sx={{
    mb: 2,
    border: paymentError ? '1px solid red' : '1px solid #ccc',
    borderRadius: 1,
    '& .MuiToggleButton-root': {
      borderColor: '#ccc',
      fontSize: '0.65rem',
      fontWeight: 'bold',
      py: 0.5,
      px: 1,
      minHeight: '32px',
    },
  }}
>
  <ToggleButton
    value="Cash"
    sx={{
      color: '#333',
      '&.Mui-selected': {
        backgroundColor: '#388e3c', // Green
        color: '#fff',
        borderColor: '#2e7d32',
      },
    }}
  >
    Cash
  </ToggleButton>

  <ToggleButton
    value="Card"
    sx={{
      color: '#333',
      '&.Mui-selected': {
        backgroundColor: '#d32f2f', // Red
        color: '#fff',
        borderColor: '#b71c1c',
      },
    }}
  >
    Card
  </ToggleButton>

  <ToggleButton
    value="Upi"
    sx={{
      color: '#333',
      '&.Mui-selected': {
        backgroundColor: '#fbc02d', // Yellow
        color: '#fff',
        borderColor: '#f9a825',
      },
    }}
  >
    UPI
  </ToggleButton>
</ToggleButtonGroup>

{/* Cash Payment Mode */}
{/* Cash Payment Mode */}
{paymentMode === 'Cash' && (
  <Grid
    container
    spacing={1}
    alignItems="center"
    justifyContent="space-between"
    sx={{
      mb: 2,
      px: 1,
      py: 1,
      backgroundColor: '#fafafa',
      borderRadius: 1,
      border: '1px solid #e0e0e0',
    }}
  >
    <Grid item xs={6}>
      <TextField
        label="Received Cash"
        fullWidth
        type="number"
        size="small"
        value={receivedCash}
        onChange={(e) => setReceivedCash(e.target.value)}
        sx={{
          '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.7 },
          '& .MuiInputLabel-root': { fontSize: '0.75rem' },
        }}
      />
    </Grid>
    <Grid
      item
      xs={6}
      sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}
    >
      <Typography
        fontSize="0.75rem"
        sx={{
          backgroundColor: '#f0f0f0',
          px: 2,
          py: 0.8,
          borderRadius: 1,
          border: '1px solid #ccc',
          fontWeight: 500,
        }}
      >
        Balance: ₹{(parseFloat(receivedCash || 0) - total).toFixed(2)}
      </Typography>
    </Grid>
  </Grid>
)}

{/* Card Payment Mode */}
{paymentMode === 'Card' && (
  <Grid
    container
    spacing={1}
    alignItems="center"
    justifyContent="space-between"
    sx={{
      mb: 2,
      px: 1,
      py: 1,
      backgroundColor: '#fafafa',
      borderRadius: 1,
      border: '1px solid #e0e0e0',
    }}
  >
    <Grid item xs={6}>
      <TextField
        label="Last 4 Digits"
        fullWidth
        size="small"
        inputProps={{ maxLength: 4 }}
        value={cardDigits}
        onChange={(e) => setCardDigits(e.target.value.replace(/\D/g, ''))}
        sx={{
          '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.7 },
          '& .MuiInputLabel-root': { fontSize: '0.75rem' },
        }}
      />
    </Grid>
    <Grid item xs={6}>
      <TextField
        label="Bank Name"
        fullWidth
        size="small"
        value={bankName}
        onChange={(e) => setBankName(e.target.value)}
        sx={{
          '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.7 },
          '& .MuiInputLabel-root': { fontSize: '0.75rem' },
        }}
      />
    </Grid>
  </Grid>
)}
{/* UPI Payment Mode */}
{paymentMode === 'Upi' && (
  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
    <Box
      sx={{
        border: '1px solid #ccc',
        borderRadius: 2,
        p: 1,
        backgroundColor: '#fafafa',
      }}
    >
      <img
        src="/upi_qr.png"
        alt="Scan to pay"
        style={{ width: '120px', height: '120px' }}
      />
    </Box>
  </Box>
)}

      <Typography fontSize="0.7rem" align="center" sx={{ mb: 2, color: '#666' }}>
        *(Inclusive of GST)
      </Typography>

<Button
  variant="contained"
  fullWidth
  onClick={handleSavePDF}
  disabled={isSaving}
  sx={{
      backgroundColor: '#ffeb3b', // Yellow background
    color: '#000',  
        fontWeight: 'bold',               // Black text
    mb: 2,                      // Adds spacing below the button (16px if using default theme spacing)
    '&:hover': {
      backgroundColor: '#fdd835', // Darker yellow on hover
    },
  }}
>
  {isSaving ? 'Saving...' : 'Save'}
</Button>

<Button
  variant="outlined"
  color="error"
  fullWidth
  onClick={() => {
  if (window.confirm('Clear the current order?')) {
    setCustomer({ name: '', mobile: '' });
    setOrders([]);
    setReceivedCash('');
    setCardDigits('');
    setBankName('');
    setLastSavedId('');
    setServiceType('Dine In');   // Reset to default or blank
    setPaymentMode('cash');      // Reset to default or blank
  }
}}

>
  Clear Order
</Button>
    </Box>
  );
};

export default OrderSummary;
