import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Container,Grid,Card,CardContent,
} from '@mui/material';
import axios from 'axios';
import dayjs from 'dayjs';
import TodayIcon from '@mui/icons-material/Today';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ReceiptIcon from '@mui/icons-material/Receipt';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CategoryIcon from '@mui/icons-material/Category';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
const API_URL = 'https://billing-6qkq.onrender.com';
  ChartJS.register(ArcElement, Tooltip, Legend);
const ReportPage = () => {
  const [billwise, setBillwise] = useState([]);
  const [itemwise, setItemwise] = useState([]);
  const [categorywise, setCategorywise] = useState([]);
  const [range] = useState({ from: '', to: '' });
  const [visibleSection, setVisibleSection] = useState('billwise');
const [activeFilter, setActiveFilter] = useState('today');
const defaultColors = [
  '#42A5F5', // Blue
  '#66BB6A', // Green
  '#FFA726', // Orange
  '#AB47BC', // Purple
  '#EF5350', // Red
  '#26C6DA', // Cyan
  '#FFEE58', // Yellow
  '#8D6E63', // Brown
  '#EC407A', // Pink
  '#78909C'  // Grey
];

  const handleDateToggle = useCallback((type) => {
  setActiveFilter(type);

  const now = dayjs();
  let from = null;
  let to = now.endOf('day').toISOString();

  switch (type) {
    case 'today':
      from = now.startOf('day').toISOString();
      break;
    case 'week':
      from = now.startOf('week').toISOString();
      break;
    case 'month':
      from = now.startOf('month').toISOString();
      break;
    case 'custom':
      from = range.from;
      to = range.to;
      break;
    default:
      return;
  }

  if (from && to) {
    loadReports(from, to);
  }
}, [range]);


useEffect(() => {
  handleDateToggle('today');
}, [handleDateToggle]);

  const loadReports = async (from, to) => {
    try {
      const params = { from, to };
      const [b, i, c] = await Promise.all([
        axios.get(`${API_URL}/api/reports/billwise`, { params }),
        axios.get(`${API_URL}/api/reports/itemwise`, { params }),
        axios.get(`${API_URL}/api/reports/categorywise`, { params }),
      ]);
      setBillwise(b.data);
      setItemwise(i.data);
      setCategorywise(c.data);
    } catch (err) {
      console.error('Error loading reports:', err);
    }
  };

  const total = (data, qtyKey = 'qty', amountKey = 'amount') =>
    data.reduce((acc, row) => ({
      qty: acc.qty + (row[qtyKey] || 0),
      amount: acc.amount + (row[amountKey] || 0),
    }), { qty: 0, amount: 0 });

  const totalBill = total(billwise, 'totalQty', 'total');
  const totalItem = total(itemwise);
  const totalCategory = total(categorywise);

  const tableHeaderCell = {
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    fontSize: '0.85rem',
  };

  const tableBodyCell = {
    fontSize: '0.85rem',
  };

  const tableFooterRow = {
    backgroundColor: '#fafafa',
    fontWeight: 'bold',
  };
 // Pie chart data for item-wise and category-wise sales
 const itemAmountChartData = {
  labels: itemwise.map(item => item.title),
  datasets: [
    {
      label: 'Amount',
      data: itemwise.map(item => item.amount),
      backgroundColor: defaultColors.slice(0, itemwise.length),
    },
  ],
};

const itemQtyChartData = {
  labels: itemwise.map(item => item.title),
  datasets: [
    {
      label: 'Quantity',
      data: itemwise.map(item => item.qty),
      backgroundColor: defaultColors.slice(0, itemwise.length),
    },
  ],
};

const categoryAmountChartData = {
  labels: categorywise.map(cat => cat.category),
  datasets: [
    {
      label: 'Amount',
      data: categorywise.map(cat => cat.amount),
      backgroundColor: defaultColors.slice(0, categorywise.length),
    },
  ],
};

const categoryQtyChartData = {
  labels: categorywise.map(cat => cat.category),
  datasets: [
    {
      label: 'Quantity',
      data: categorywise.map(cat => cat.qty),
      backgroundColor: defaultColors.slice(0, categorywise.length),
    },
  ],
};


  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Typography variant="h5" fontWeight="bold" textAlign="center" mb={3}>
          Dashboard
        </Typography>

     <Box
  display="flex"
  justifyContent="space-between"
  alignItems="center"
  flexWrap="wrap"
  gap={2}
  mb={3}
>
  {/* Date Filter (Left Side) */}
  <ToggleButtonGroup
    value={activeFilter}
    exclusive
    onChange={(e, val) => val && handleDateToggle(val)}
    color="primary"
    size="small"
    sx={{
      borderRadius: 2,
      backgroundColor: '#f1f1f1',
    }}
  >
    <ToggleButton
      value="today"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textTransform: 'none',
        minWidth: 64,
        color: '#000',
        py: 1,
        '&.Mui-selected': {
          backgroundColor: '#1976d2',
          color: '#fff',
        },
      }}
    >
      <TodayIcon fontSize="small" />
      <Typography variant="caption" mt={0.5}>Today</Typography>
    </ToggleButton>

    <ToggleButton
      value="week"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textTransform: 'none',
        minWidth: 64,
        color: '#000',
        py: 1,
        '&.Mui-selected': {
          backgroundColor: '#1976d2',
          color: '#fff',
        },
      }}
    >
      <CalendarViewWeekIcon fontSize="small" />
      <Typography variant="caption" mt={0.5}>Week</Typography>
    </ToggleButton>

    <ToggleButton
      value="month"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textTransform: 'none',
        minWidth: 64,
        color: '#000',
        py: 1,
        '&.Mui-selected': {
          backgroundColor: '#1976d2',
          color: '#fff',
        },
      }}
    >
      <CalendarMonthIcon fontSize="small" />
      <Typography variant="caption" mt={0.5}>Month</Typography>
    </ToggleButton>
  </ToggleButtonGroup>

  {/* Section Toggle (Right Side) */}
  <ToggleButtonGroup
    color="secondary"
    value={visibleSection}
    exclusive
    onChange={(e, value) => value && setVisibleSection(value)}
    size="small"
    sx={{
      borderRadius: 2,
      backgroundColor: '#f1f1f1',
    }}
  >
    <ToggleButton
      value="billwise"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textTransform: 'none',
        minWidth: 64,
        py: 1,
        color: '#000',
        '&.Mui-selected': {
          backgroundColor: '#9c27b0',
          color: '#fff',
        },
      }}
    >
      <ReceiptIcon fontSize="small" />
      <Typography variant="caption" mt={0.5}>Bill</Typography>
    </ToggleButton>

    <ToggleButton
      value="itemwise"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textTransform: 'none',
        minWidth: 64,
        color: '#000',
        py: 1,
        '&.Mui-selected': {
          backgroundColor: '#9c27b0',
          color: '#fff',
        },
      }}
    >
      <Inventory2Icon fontSize="small" />
      <Typography variant="caption" mt={0.5}>Item</Typography>
    </ToggleButton>

    <ToggleButton
      value="categorywise"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textTransform: 'none',
        minWidth: 64,
        color: '#000',
        py: 1,
        '&.Mui-selected': {
          backgroundColor: '#9c27b0',
          color: '#fff',
        },
      }}
    >
      <CategoryIcon fontSize="small" />
      <Typography variant="caption" mt={0.5}>Category</Typography>
    </ToggleButton>
  </ToggleButtonGroup>
</Box>


        <Divider sx={{ mb: 3 }} />

       <Paper
  elevation={2}
  sx={{
    p: 2,
    pt: 1.5,
    borderRadius: 2,
    backgroundColor: '#fff',
    overflowX: 'auto',
  }}
>
          {/* Bill-wise Summary */}
          {visibleSection === 'billwise' && (
            <> ;

<Grid container spacing={2} justifyContent="space-between" mb={3}>
  {[
    {
      label: 'Total Sales',
      value: `₹${totalBill.amount.toFixed(2)}`,
      sub: `${totalBill.qty} items`,
      bg: '#e3f2fd',
    },
    {
      label: 'Cash Sales',
      value: `₹${billwise
        .filter(b => b.paymentMode?.toLowerCase() === 'cash')
        .reduce((acc, b) => acc + b.total, 0)
        .toFixed(2)}`,
      bg: '#f1f8e9',
    },
    {
      label: 'UPI Sales',
      value: `₹${billwise
        .filter(b => b.paymentMode?.toLowerCase() === 'upi')
        .reduce((acc, b) => acc + b.total, 0)
        .toFixed(2)}`,
      bg: '#e8f5e9',
    },
    {
      label: 'Card Sales',
      value: `₹${billwise
        .filter(b => b.paymentMode?.toLowerCase() === 'card')
        .reduce((acc, b) => acc + b.total, 0)
        .toFixed(2)}`,
      bg: '#ede7f6',
    },
    {
      label: 'No. of Bills',
      value: billwise.length,
      bg: '#fff3e0',
    },
  ].map(({ label, value, sub, bg }, index) => (
    <Grid item xs={12} sm={6} md={2.4} lg={2.3} key={index}>
     <Card
  sx={{
    background: `linear-gradient(145deg, ${bg} 0%, #ffffff 100%)`,
    borderRadius: 3,
    height: '100%',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.06)',
    backdropFilter: 'blur(6px)',
    transition: 'all 0.3s ease',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 28px rgba(0, 0, 0, 0.12)',
    },
  }}
>
  <CardContent
    sx={{
      textAlign: 'center',
      py: 3,
    }}
  >
    <Typography
      variant="body2"
      color="textSecondary"
      fontWeight={600}
      sx={{ letterSpacing: 0.5 }}
      gutterBottom
    >
      {label}
    </Typography>

    <Typography
      variant="h6"
      fontWeight={700}
      sx={{ color: 'text.primary', fontSize: '1.4rem' }}
    >
      {value}
    </Typography>

    {sub && (
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 500 }}
      >
        {sub}
      </Typography>
    )}
  </CardContent>
</Card>

    </Grid>
  ))}
</Grid>


              <Typography variant="subtitle1" fontWeight="bold" mb={2} textAlign="center">
                Bill-wise Summary
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={tableHeaderCell}>Date</TableCell>
                    <TableCell sx={tableHeaderCell}>Ticket ID</TableCell>
                    <TableCell sx={tableHeaderCell}>Total Qty</TableCell>
                    <TableCell sx={tableHeaderCell}>Payment Mode</TableCell>
                    <TableCell sx={tableHeaderCell}>Total Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {billwise.map((bill) => (
                    <TableRow key={bill.ticketId}>
                      <TableCell sx={tableBodyCell}>{dayjs(bill.date).format('DD-MM-YYYY HH:mm')}</TableCell>
                      <TableCell sx={tableBodyCell}>{bill.ticketId}</TableCell>
                      <TableCell sx={tableBodyCell}>{bill.totalQty}</TableCell>
                      <TableCell sx={tableBodyCell}>{bill.paymentMode || '-'}</TableCell>
                      <TableCell sx={tableBodyCell}>₹{bill.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={tableFooterRow}>
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell>{totalBill.qty}</TableCell>
                    <TableCell />
                    <TableCell>₹{totalBill.amount.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </>
          )}

          {/* Item-wise Summary */}
          {visibleSection === 'itemwise' && (
            <><Grid container spacing={3} justifyContent="center" mt={3}>
  <Grid item xs={12} md={6}>
    <Typography variant="subtitle2" textAlign="center">Item-wise Amount Distribution</Typography>
    <Pie data={itemAmountChartData} />
  </Grid>
  <Grid item xs={12} md={6}>
    <Typography variant="subtitle2" textAlign="center">Item-wise Quantity Distribution</Typography>
    <Pie data={itemQtyChartData} />
  </Grid>
</Grid>
              <Typography variant="subtitle1" fontWeight="bold" mb={2} textAlign="center">
                Item-wise Summary
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={tableHeaderCell}>Item</TableCell>
                    <TableCell sx={tableHeaderCell}>Qty</TableCell>
                    <TableCell sx={tableHeaderCell}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {itemwise.map((item) => (
                    <TableRow key={item.title}>
                      <TableCell sx={tableBodyCell}>{item.title}</TableCell>
                      <TableCell sx={tableBodyCell}>{item.qty}</TableCell>
                      <TableCell sx={tableBodyCell}>₹{item.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={tableFooterRow}>
                    <TableCell>Total</TableCell>
                    <TableCell>{totalItem.qty}</TableCell>
                    <TableCell>₹{totalItem.amount.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </>
          )}

          {/* Category-wise Summary */}
          {visibleSection === 'categorywise' && (
            <><Grid container spacing={3} justifyContent="center" mt={3}>
  <Grid item xs={12} md={6}>
    <Typography variant="subtitle2" textAlign="center">
      Category-wise Quantity Distribution
    </Typography>
    <Pie data={categoryQtyChartData} />
  </Grid>

  <Grid item xs={12} md={6}>
    <Typography variant="subtitle2" textAlign="center">
      Category-wise Amount Distribution
    </Typography>
    <Pie data={categoryAmountChartData} />
  </Grid>
</Grid>


              <Typography variant="subtitle1" fontWeight="bold" mb={2} textAlign="center">
                Category-wise Summary
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={tableHeaderCell}>Category</TableCell>
                    <TableCell sx={tableHeaderCell}>Qty</TableCell>
                    <TableCell sx={tableHeaderCell}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categorywise.map((cat) => (
                    <TableRow key={cat.category}>
                      <TableCell sx={tableBodyCell}>{cat.category}</TableCell>
                      <TableCell sx={tableBodyCell}>{cat.qty || 0}</TableCell>
                      <TableCell sx={tableBodyCell}>₹{cat.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={tableFooterRow}>
                    <TableCell>Total</TableCell>
                    <TableCell>{totalCategory.qty}</TableCell>
                    <TableCell>₹{totalCategory.amount.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ReportPage;

