import React, { useState, useEffect } from 'react';
import {
  TextField, Button, Stack, FormControlLabel, Checkbox, MenuItem,
  Box, Typography, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import axios from 'axios';

const API_URL = 'https://billing-6qkq.onrender.com';

const EditMenuItemForm = ({ item, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    ...item,
    Category: item?.Category?._id || '',
    type: item?.type || 'Veg',
  });

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/api/categories`)
      .then(res => setCategories(res.data))
      .catch(err => console.error('Error loading categories', err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    setFormData(prev => ({ ...prev, active: e.target.checked }));
  };

  const handleTypeChange = (e, value) => {
    if (value !== null) {
      setFormData(prev => ({ ...prev, type: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2} sx={{ p: 2 }}>
        <TextField
          label="Title"
          name="title"
          size="small"
          value={formData.title}
          onChange={handleChange}
          required
          fullWidth
        />

        <TextField
          label="Description"
          name="Description"
          size="small"
          value={formData.Description}
          onChange={handleChange}
          required
          fullWidth
        />

        <TextField
          select
          label="Category"
          name="Category"
          size="small"
          value={formData.Category}
          onChange={handleChange}
          fullWidth
          required
        >
          {categories.map((cat) => (
            <MenuItem key={cat._id} value={cat._id}>
              {cat.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Price (₹)"
          name="Price"
          type="number"
          size="small"
          value={formData.Price}
          onChange={handleChange}
          required
          fullWidth
        />

        <Box>
          <Typography variant="caption" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
            Type
          </Typography>
          <ToggleButtonGroup
            value={formData.type}
            exclusive
            onChange={handleTypeChange}
            fullWidth
            size="small"
            sx={{
              borderRadius: 1,
              overflow: 'hidden',
              '& .MuiToggleButton-root': {
                flex: 1,
                fontSize: '0.75rem',
                fontWeight: 500,
                py: 0.5,
                border: '1px solid #ddd',
                borderLeft: 0,
                '&:first-of-type': { borderLeft: '1px solid #ddd' },
              },
            }}
          >
            <ToggleButton
              value="Veg"
              sx={{
                color: formData.type === 'Veg' ? '#2e7d32' : '#555',
                backgroundColor: formData.type === 'Veg' ? '#e8f5e9' : '#fdfdfd',
                '&:hover': { backgroundColor: '#c8e6c9' },
              }}
            >
              Veg
            </ToggleButton>
            <ToggleButton
              value="Non-Veg"
              sx={{
                color: formData.type === 'Non-Veg' ? '#c62828' : '#555',
                backgroundColor: formData.type === 'Non-Veg' ? '#ffebee' : '#fdfdfd',
                '&:hover': { backgroundColor: '#ffcdd2' },
              }}
            >
              Non-Veg
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={formData.active}
              onChange={handleCheckboxChange}
              size="small"
            />
          }
          label="Active"
        />

        <Box display="flex" justifyContent="flex-end" gap={1}>
          <Button onClick={onClose} variant="outlined" size="small">
            Cancel
          </Button>
          <Button type="submit" variant="contained" size="small">
            Update
          </Button>
        </Box>
      </Stack>
    </form>
  );
};

export default EditMenuItemForm;
