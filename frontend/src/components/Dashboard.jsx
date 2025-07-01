import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Container,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Pie, Line } from 'react-chartjs-2';
import axios from 'axios';
import dayjs from 'dayjs';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
);

const API_URL = 'https://caferiadbnode.glitch.me' || 'http://localhost:5000';

const defaultColors = [
  '#1E88E5',
  '#43A047',
  '#F4511E',
  '#8E24AA',
  '#3949AB',
  '#00897B',
  '#FDD835',
  '#6D4C41',
  '#D81B60',
  '#546E7A',
];

const Dashboard = () => {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));

  const [billwise, setBillwise] = useState([]);
  const [itemwise, setItemwise] = useState([]);
  const [categorywise, setCategorywise] = useState([]);
  const [last7Days, setLast7Days] = useState([]);
  const [todaySales, setTodaySales] = useState(0);

  const [salesBreakdown, setSalesBreakdown] = useState({
    cash: 0,
    card: 0,
    upi: 0,
    totalBills: 0,
  });
  const [timeComparison, setTimeComparison] = useState({
    todayHourly: {},
    yesterdayHourly: {},
    allHours: [],
  });

  const fetchData = useCallback(async () => {
    const now = dayjs();
    const todayStart = now.startOf('day').toISOString();
    const todayEnd = now.endOf('day').toISOString();
    const yesterdayStart = now.subtract(1, 'day').startOf('day').toISOString();
    const yesterdayEnd = now.subtract(1, 'day').endOf('day').toISOString();
    const weekStart = now.subtract(6, 'day').startOf('day').toISOString();

    try {
      const [today, yesterday, last7, items, cats] = await Promise.all([
        axios.get(`${API_URL}/api/reports/billwise`, {
          params: { from: todayStart, to: todayEnd },
        }),
        axios.get(`${API_URL}/api/reports/billwise`, {
          params: { from: yesterdayStart, to: yesterdayEnd },
        }),
        axios.get(`${API_URL}/api/reports/billwise`, {
          params: { from: weekStart, to: todayEnd },
        }),
        axios.get(`${API_URL}/api/reports/itemwise`, {
          params: { from: todayStart, to: todayEnd },
        }),
        axios.get(`${API_URL}/api/reports/categorywise`, {
          params: { from: todayStart, to: todayEnd },
        }),
      ]);

      setBillwise(today.data);
      setItemwise(items.data);
      setCategorywise(cats.data);
      setTodaySales(today.data.reduce((acc, b) => acc + b.total, 0));








      const grouped = {};
      last7.data.forEach((b) => {
        const d = dayjs(b.date).format('DD MMM');
        if (!grouped[d]) grouped[d] = { qty: 0, amount: 0 };
        grouped[d].qty += b.totalQty;
        grouped[d].amount += b.total;
      });
      setLast7Days(grouped);

      const cash = today.data
        .filter((b) => b.paymentMode === 'Cash')
        .reduce((a, b) => a + b.total, 0);
      const card = today.data
        .filter((b) => b.paymentMode === 'Card')
        .reduce((a, b) => a + b.total, 0);
      const upi = today.data
        .filter((b) => b.paymentMode === 'Upi')
        .reduce((a, b) => a + b.total, 0);
      const totalBills = today.data.length;

      setSalesBreakdown({ cash, card, upi, totalBills });

      const groupByHour = (data) => {
        const hourly = {};
        data.forEach((b) => {
          const hour = dayjs(b.date).format('HH:00');
          if (!hourly[hour]) hourly[hour] = 0;
          hourly[hour] += b.total;
        });
        return hourly;
      };

      const todayHourly = groupByHour(today.data);
      const yesterdayHourly = groupByHour(yesterday.data);
      const allHours = Array.from(
        new Set([...Object.keys(todayHourly), ...Object.keys(yesterdayHourly)])
      ).sort();

      setTimeComparison({ todayHourly, yesterdayHourly, allHours });
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const itemPieData = {
    labels: itemwise.map((i) => i.title),
    datasets: [
      {
        data: itemwise.map((i) => i.amount),
        backgroundColor: defaultColors,
        borderWidth: 1,
        borderColor: '#fff',
      },
    ],
  };

  const categoryPieData = {
    labels: categorywise.map((c) => c.category),
    datasets: [
      {
        data: categorywise.map((c) => c.amount),
        backgroundColor: defaultColors,
        borderWidth: 1,
        borderColor: '#fff',
      },
    ],
  };

  const dates = Object.keys(last7Days).sort((a, b) =>
  dayjs(a, 'DD MMM').diff(dayjs(b, 'DD MMM'))
);
  const qtyData = dates.map((d) => last7Days[d].qty);
  const amtData = dates.map((d) => last7Days[d].amount);

  const lineChartData = {
    labels: dates,
    datasets: [
      {
        label: 'Quantity',
        data: qtyData,
        borderColor: '#43A047',
        backgroundColor: 'rgba(67,160,71,0.15)',
        tension: 0.3,
        fill: true,
        pointRadius: 4,
      },
      {
        label: 'Amount (₹)',
        data: amtData,
        borderColor: '#1E88E5',
        backgroundColor: 'rgba(30,136,229,0.15)',
        tension: 0.3,
        fill: true,
        pointRadius: 4,
      },
    ],
  };

 const cardStyle = (bgColor) => ({
  background: `linear-gradient(145deg, ${bgColor}, ${bgColor}CC)`,
  borderRadius: 12,
  color: '#fff',
  height: '100%',
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
  cursor: 'default',
  transition: 'all 0.3s ease-in-out',
  backdropFilter: 'blur(1px)',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
    '&::after': {
      opacity: 0.08,
    },
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background:
      'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%)',
    zIndex: 0,
    opacity: 0.04,
    transition: 'opacity 0.3s ease-in-out',
  },
  '& > *': {
    position: 'relative',
    zIndex: 1,
  },
});


  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
    <Typography
  fontWeight="500"
  textAlign="center"
  mb={5}
  sx={{ color: '#222', fontSize: isSmDown ? '1 rem' : '1.5rem' }} // smaller sizes
>
  Sales Dashboard
</Typography>

      {/* Summary Cards */}
      <Box
  display="flex"
  justifyContent="space-between"
  flexWrap={isSmDown ? 'wrap' : 'nowrap'}
  gap={2}
  mb={6}
>
        {[
          {
            label: 'Overall Sales',
            value: todaySales,
            color: '#1E88E5',
            count: salesBreakdown.totalBills,
          },
          {
            label: 'Cash Sales',
            value: salesBreakdown.cash,
            color: '#43A047',
            count: billwise.filter((b) => b.paymentMode === 'Cash').length,
          },
          {
            label: 'Card Sales',
            value: salesBreakdown.card,
            color: '#F4511E',
            count: billwise.filter((b) => b.paymentMode === 'Card').length,
          },
          {
            label: 'UPI Sales',
            value: salesBreakdown.upi,
            color: '#8E24AA',
            count: billwise.filter((b) => b.paymentMode === 'Upi').length,
          },
        ].map(({ label, value, color, count }) => (
          
          <Card
  key={label}
  sx={{
    ...cardStyle(color),
    flex: '1 1 100%',
    minWidth: 160,
    maxWidth: { xs: '100%', sm: '48%', md: '23%' },
    px: 2,
    py: 2,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  }}
  elevation={3}
>
            <CardContent>
              <Typography
                variant="subtitle2"
                sx={{ opacity: 0.8, letterSpacing: 1, mb: 1 }}
              >
                {label}
              </Typography>
              <Typography variant="h5" fontWeight="700" sx={{ mb: 1 }}>
                ₹{value.toFixed(2)}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {count} Bills
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Line Charts */}
      <Box display="flex" flexWrap="wrap" gap={4} mb={6}>
       <Card sx={{ flex: 1, minWidth: 320, p: 3, height: 460, borderRadius: 4 }}>
          <Typography
            variant="h6"
            textAlign="center"
            fontWeight="700"
            mb={3}
            color="#333"
          >
            Today vs Yesterday - Hourly Sales
          </Typography>
          <Line
            data={{
              labels: timeComparison.allHours,
              datasets: [
                {
                  label: 'Today',
                  data: timeComparison.allHours.map(
                    (hour) => timeComparison.todayHourly[hour] || 0
                  ),
                  borderColor: '#1E88E5',
                  backgroundColor: 'rgba(30,136,229,0.15)',
                  tension: 0.3,
                  fill: true,
                  pointRadius: 3,
                },
                {
                  label: 'Yesterday',
                  data: timeComparison.allHours.map(
                    (hour) => timeComparison.yesterdayHourly[hour] || 0
                  ),
                  borderColor: '#E53935',
                  backgroundColor: 'rgba(229,57,53,0.15)',
                  tension: 0.3,
                  fill: true,
                  pointRadius: 3,
                },
              ],
            }}
            height={260}
            options={{
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      bottom: 30, // extra space for labels
    },
  },
  scales: {
    x: {
      ticks: {
        autoSkip: false, // don't skip labels
        maxRotation: 45,
        minRotation: 45,
        color: '#555',
      },
      grid: { color: '#eee' },
    },
    y: {
      beginAtZero: true,
      ticks: { color: '#555' },
      grid: { color: '#eee' },
    },
  },
  plugins: {
    legend: { position: 'top', labels: { color: '#555' } },
    tooltip: { mode: 'index', intersect: false },
  },
  interaction: {
    mode: 'nearest',
    intersect: false,
  },
}}

          />
        </Card>

       <Card sx={{ flex: 1, minWidth: 320, p: 3, height: 460, borderRadius: 4 }}>
          <Typography
            variant="h6"
            textAlign="center"
            fontWeight="700"
            mb={3}
            color="#333"
          >
            Last 7 Days - Quantity & Sales
          </Typography>
          <Line
            data={lineChartData}
            height={260}
            options={{
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      bottom: 30, // extra space for labels
    },
  },
  scales: {
    x: {
      ticks: {
        autoSkip: false, // don't skip labels
        maxRotation: 45,
        minRotation: 45,
        color: '#555',
      },
      grid: { color: '#eee' },
    },
    y: {
      beginAtZero: true,
      ticks: { color: '#555' },
      grid: { color: '#eee' },
    },
  },
  plugins: {
    legend: { position: 'top', labels: { color: '#555' } },
    tooltip: { mode: 'index', intersect: false },
  },
  interaction: {
    mode: 'nearest',
    intersect: false,
  },
}}

          />
        </Card>
      </Box>

      {/* Pie Charts */}
      <Box display="flex" flexWrap="wrap" gap={4}>
        <Card sx={{ flex: 1, minWidth: 320, p: 3, height: 460, borderRadius: 4 }}>
          <Typography
            variant="h6"
            textAlign="center"
            fontWeight="700"
            mb={3}
            color="#333"
          >
            Item-wise Sales (Today)
          </Typography>
          <Pie
           data={itemPieData}
  height={290}
            options={{
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                  labels: {
                    color: '#555',
                    boxWidth: 12,
                    padding: 8,
                  },
                },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const label = context.label || '';
                      const value = context.parsed || 0;
                      return `${label}: ₹${value.toFixed(2)}`;
                    },
                  },
                },
              },
            }}
          />
        </Card>

        <Card sx={{ flex: 1, minWidth: 320, p: 3, height: 460, borderRadius: 4 }}>
          <Typography
            variant="h6"
            textAlign="center"
            fontWeight="700"
            mb={3}
            color="#333"
          >
            Category-wise Sales (Today)
          </Typography>
          <Pie
            data={categoryPieData}
            height={290}
            options={{
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                  labels: {
                    color: '#555',
                    boxWidth: 12,
                    padding: 8,
                  },
                },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const label = context.label || '';
                      const value = context.parsed || 0;
                      return `${label}: ₹${value.toFixed(2)}`;
                    },
                  },
                },
              },
            }}
          />
        </Card>
      </Box>
      

    </Container>
  );
};

export default Dashboard;
