import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, Tooltip, Typography, Avatar, Button, Box,
  Divider, TextField, Switch
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import AddMenuItemForm from './AddForm';
import EditMenuItemForm from './EditMenu';
import axios from 'axios';

const API_URL = 'https://caferiadbnode.glitch.me' || 'http://localhost:5000';

// 🔹 Filter Input with Clear Button
const FilterInputWithClear = ({ field, placeholder, filters, setFilters }) => (
  <Box display="flex" alignItems="center">
    <TextField
      size="small"
      variant="standard"
      placeholder={placeholder}
      value={filters[field]}
      onChange={(e) =>
        setFilters((prev) => ({ ...prev, [field]: e.target.value }))
      }
      fullWidth
    />
    {filters[field] && (
      <IconButton
        size="small"
        onClick={() => setFilters((prev) => ({ ...prev, [field]: '' }))}
        sx={{ color: 'black' }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    )}
  </Box>
);

const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filters, setFilters] = useState({ title: '', category: '', price: '', status: '' });
  const [confirmToggle, setConfirmToggle] = useState({ open: false, item: null });

  const fetchMenu = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/menu`);
      setMenuItems(data);
      setFilteredItems(data);
    } catch (err) {
      console.error('Error fetching menu:', err);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // 🔹 Filtering logic
  useEffect(() => {
    const { title, category, price, status } = filters;
    const filtered = menuItems.filter((item) =>
      item.title.toLowerCase().includes(title.toLowerCase()) &&
      (item.Category?.name || '').toLowerCase().includes(category.toLowerCase()) &&
      item.Price.toString().includes(price) &&
      (status === '' ? true : status === 'active' ? item.active : !item.active)
    );
    setFilteredItems(filtered);
  }, [filters, menuItems]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure to delete this item?')) return;
    try {
      await axios.delete(`${API_URL}/api/menu/${id}`);
      fetchMenu();
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  const handleUpdate = async (updatedItem) => {
    try {
      await axios.put(`${API_URL}/api/menu/${updatedItem._id}`, updatedItem);
      setEditItem(null);
      fetchMenu();
    } catch (err) {
      alert('Failed to update item');
    }
  };

  const confirmToggleActive = async () => {
    if (!confirmToggle.item) return;
    try {
      await axios.put(`${API_URL}/api/menu/${confirmToggle.item._id}`, {
        ...confirmToggle.item,
        active: !confirmToggle.item.active,
      });
      fetchMenu();
    } catch (err) {
      alert('Failed to update active status');
    } finally {
      setConfirmToggle({ open: false, item: null });
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">Menu Items</Typography>
        <Button variant="contained" onClick={() => setOpenAdd(true)}>
          Add New Item
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><strong>Image</strong></TableCell>
              <TableCell><strong>Title</strong></TableCell>
              <TableCell><strong>Category</strong></TableCell>
               <TableCell><strong>Type</strong></TableCell> {/* ✅ Added */}
              <TableCell><strong>Price</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>

            <TableRow>
              <TableCell />
              <TableCell>
                <FilterInputWithClear field="title" placeholder="Search title" filters={filters} setFilters={setFilters} />
              </TableCell>
              <TableCell>
                <FilterInputWithClear field="category" placeholder="Search category" filters={filters} setFilters={setFilters} />
              </TableCell>
                <TableCell>
              <FilterInputWithClear field="type" placeholder="Type" filters={filters} setFilters={setFilters} />  </TableCell>
              <TableCell>
                <FilterInputWithClear field="price" placeholder="Price" filters={filters} setFilters={setFilters} />
              </TableCell>
              <TableCell>
                <Box display="flex" gap={1} alignItems="center">
                  <Button
                    variant={filters.status === 'active' ? 'contained' : 'outlined'}
                    size="small"
                    color="success"
                    onClick={() => setFilters((prev) => ({ ...prev, status: 'active' }))}
                  >
                    Active
                  </Button>
                  <Button
                    variant={filters.status === 'inactive' ? 'contained' : 'outlined'}
                    size="small"
                    color="warning"
                    onClick={() => setFilters((prev) => ({ ...prev, status: 'inactive' }))}
                  >
                    Inactive
                  </Button>
                  {filters.status && (
                    <IconButton
                      size="small"
                      onClick={() => setFilters((prev) => ({ ...prev, status: '' }))}
                      sx={{ color: 'black' }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item._id} hover>
                <TableCell>
                  <Avatar
                    variant="square"
                    src={item.image}
                    sx={{ width: 50, height: 50, borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell>{item.title}</TableCell>
                <TableCell>{item.Category?.name || 'No Category'}</TableCell>
                <TableCell>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: item.type === 'Veg' ? 'green' : 'error.main',
          }}
        >
          {item.type}
        </Typography>
      </TableCell> {/* ✅ New cell for type */}
                <TableCell>₹{item.Price}</TableCell>
                <TableCell>
                  <Switch
                    checked={item.active}
                    onChange={() => setConfirmToggle({ open: true, item })}
                    size="small"
                    color="success"
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton onClick={() => setEditItem(item)} color="primary">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDelete(item._id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Add New Menu Item
          <IconButton onClick={() => setOpenAdd(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <AddMenuItemForm onClose={() => setOpenAdd(false)} onItemAdded={fetchMenu} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onClose={() => setEditItem(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Edit Menu Item
          <IconButton onClick={() => setEditItem(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <EditMenuItemForm item={editItem} onSave={handleUpdate} onClose={() => setEditItem(null)} />
        </DialogContent>
      </Dialog>

      {/* Confirm Toggle Dialog */}
      <Dialog open={confirmToggle.open} onClose={() => setConfirmToggle({ open: false, item: null })}>
        <DialogTitle>Confirm Status Change</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {confirmToggle.item?.active ? 'deactivate' : 'activate'}{' '}
            <strong>{confirmToggle.item?.title}</strong>?
          </Typography>
          <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
            <Button
              onClick={() => setConfirmToggle({ open: false, item: null })}
              variant="outlined"
              size="small"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmToggleActive}
              variant="contained"
              color={confirmToggle.item?.active ? 'warning' : 'success'}
              size="small"
            >
              Confirm
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

export default MenuManagement;
