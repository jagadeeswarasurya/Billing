import React, { useState, useEffect } from 'react';
import {
  TextField, Button, Stack, FormControlLabel, Switch, MenuItem,
  Avatar, Box, Typography, ToggleButton, ToggleButtonGroup, Paper
} from '@mui/material';
import axios from 'axios';

const API_URL = 'https://billing-6qkq.onrender.com';

const AddMenuItemForm = ({ onClose, onItemAdded }) => {
  const [form, setForm] = useState({
    title: '',
    Description: '',
    Category: '',
    Price: '',
    image: null,
    active: true,
    type: 'Veg',
  });

  const [categories, setCategories] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/categories`)
      .then(res => setCategories(res.data))
      .catch(err => console.error('Error loading categories', err));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      setForm(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    } else if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    for (const key in form) {
      formData.append(key, form[key]);
    }

    try {
      await axios.post(`${API_URL}/api/menu`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      onItemAdded();
      onClose();
    } catch (err) {
      console.error('Failed to add menu item:', err);
      alert('Error adding item.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2} sx={{ p: 2 }}>
        <TextField
          label="Title"
          name="title"
          size="small"
          value={form.title}
          onChange={handleChange}
          required
          fullWidth
        />
        <TextField
          label="Price (₹)"
          name="Price"
          type="number"
          size="small"
          value={form.Price}
          onChange={handleChange}
          required
          fullWidth
        />
        <TextField
          label="Description"
          name="Description"
          size="small"
          multiline
          rows={2}
          value={form.Description}
          onChange={handleChange}
          required
          fullWidth
        />
        <TextField
          select
          label="Category"
          name="Category"
          size="small"
          value={form.Category}
          onChange={handleChange}
          required
          fullWidth
        >
          {categories.map((cat) => (
            <MenuItem key={cat._id} value={cat._id}>
              {cat.name}
            </MenuItem>
          ))}
        </TextField>

    
          <Typography variant="caption" fontWeight={500} sx={{ mb: 0.5, display: 'block' }}>
            Type
          </Typography>
          <ToggleButtonGroup
            value={form.type}
            exclusive
            onChange={(e, value) => {
              if (value) {
                setForm(prev => ({ ...prev, type: value }));
              }
            }}
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
                color: form.type === 'Veg' ? '#2e7d32' : '#555',
                backgroundColor: form.type === 'Veg' ? '#e8f5e9' : '#fdfdfd',
                '&:hover': { backgroundColor: '#c8e6c9' },
              }}
            >
              Veg
            </ToggleButton>
            <ToggleButton
              value="Non-Veg"
              sx={{
                color: form.type === 'Non-Veg' ? '#c62828' : '#555',
                backgroundColor: form.type === 'Non-Veg' ? '#ffebee' : '#fdfdfd',
                '&:hover': { backgroundColor: '#ffcdd2' },
              }}
            >
              Non-Veg
            </ToggleButton>
          </ToggleButtonGroup>
   

        <FormControlLabel
          control={
            <Switch
              checked={form.active}
              onChange={handleChange}
              name="active"
              color="primary"
            />
          }
          label="Active"
        />

        <Box>
          <Button
            variant="outlined"
            component="label"
            size="small"
            fullWidth
          >
            Upload Image
            <input
              type="file"
              name="image"
              accept="image/*"
              hidden
              onChange={handleChange}
            />
          </Button>
          {imagePreview && (
            <Paper
              elevation={1}
              sx={{
                mt: 1,
                p: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Avatar
                src={imagePreview}
                variant="square"
                sx={{ width: 60, height: 60, borderRadius: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                {form.image?.name}
              </Typography>
            </Paper>
          )}
        </Box>

        <Box display="flex" justifyContent="flex-end" gap={1}>
          <Button onClick={onClose} variant="outlined" size="small">
            Cancel
          </Button>
          <Button type="submit" variant="contained" size="small">
            Add Item
          </Button>
        </Box>
      </Stack>
    </form>
  );
};

export default AddMenuItemForm;
