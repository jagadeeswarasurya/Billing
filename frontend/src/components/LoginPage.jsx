import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Avatar,
  useTheme,
  useMediaQuery,
  CssBaseline,
} from '@mui/material';

// Import custom Google font using @fontsource (if using MUI v5+)
import '@fontsource/pacifico'; // Stylish font for "Cafe`Ria"

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === '123456') {
      onLogin();
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(to bottom right, #f9f9f9, #dfe3e8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          px: 2,
        }}
      >
        <Paper
          elevation={4}
          sx={{
            px: 4,
            py: 5,
            width: { xs: '100%', sm: 380 },
            borderRadius: 3,
            textAlign: 'center',
            backgroundColor: '#ffffff',
          }}
        >
          <Avatar
            src="/logo.png"
            alt="Caféria Logo"
            sx={{
              width: isMobile ? 64 : 80,
              height: isMobile ? 64 : 80,
              mx: 'auto',
              mb: 2,
              border: '2px solid #111',
            }}
          />

          {/* Stylish Brand Title */}
          <Typography
            variant={isMobile ? 'h4' : 'h3'}
            sx={{
              fontFamily: 'Pacifico, cursive',
              fontWeight: 600,
              color: '#000',
              mb: 0.5,
            }}
          >
            Snack Attack
          </Typography>

       

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              margin="dense"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{ sx: { borderRadius: 2 } }}
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              margin="dense"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{ sx: { borderRadius: 2 } }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                py: 1.2,
                borderRadius: 2,
                backgroundColor: '#FFEB3B', // Yellow
                color: '#000',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
                '&:hover': {
                  backgroundColor: '#FDD835',
                },
              }}
            >
              Login
            </Button>
          </form>
        </Paper>
      </Box>
    </>
  );
};

export default LoginPage;
