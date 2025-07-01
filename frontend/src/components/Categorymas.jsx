import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, Tooltip, Typography, TextField, Button, Box, Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const API_URL = 'https://billing-6qkq.onrender.com';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/categories`);
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditCategory(null);
    setCategoryName('');
    setOpenDialog(true);
  };

  const handleOpenEdit = (category) => {
    setEditCategory(category);
    setCategoryName(category.name);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setEditCategory(null);
    setCategoryName('');
    setOpenDialog(false);
  };

  const handleSave = async () => {
    try {
      if (editCategory) {
        await axios.put(`${API_URL}/api/categories/${editCategory._id}`, { name: categoryName });
      } else {
        await axios.post(`${API_URL}/api/categories`, { name: categoryName });
      }
      fetchCategories();
      handleCloseDialog();
    } catch (err) {
      alert('Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await axios.delete(`${API_URL}/api/categories/${id}`);
        fetchCategories();
      } catch (err) {
        alert('Failed to delete category');
      }
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">Category Management</Typography>
        <Button variant="contained" onClick={handleOpenAdd}>
          Add Category
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><strong>#</strong></TableCell>
              <TableCell><strong>Category Name</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((cat, idx) => (
              <TableRow
                key={cat._id}
                hover
                sx={{ transition: 'background 0.2s ease-in-out' }}
              >
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{cat.name}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleOpenEdit(cat)} color="primary">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDelete(cat._id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">No categories found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editCategory ? 'Edit Category' : 'Add Category'}
          <IconButton onClick={handleCloseDialog}>
            <DeleteIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Category Name"
            fullWidth
            variant="outlined"
            margin="normal"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
          <Box display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={!categoryName.trim()}
              sx={{ mt: 2 }}
            >
              {editCategory ? 'Update' : 'Add'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

export default CategoryManagement;
