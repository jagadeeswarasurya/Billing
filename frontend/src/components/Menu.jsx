import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Card, CardMedia, CardContent, Typography, Grid, CircularProgress,
  IconButton, Stack, useMediaQuery, Chip, Fade,ToggleButton, ToggleButtonGroup,Tooltip
} from '@mui/material';
import { Add, Remove } from '@mui/icons-material';


const API_URL = 'https://caferiadbnode.glitch.me' || 'http://localhost:5000';

const MenuListDisplay = ({ handleAddToOrder, handleRemoveFromOrder, orders }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [loading, setLoading] = useState(true);
  
  const isMobile = useMediaQuery('(max-width:768px)');
const [itemTypeFilter, setItemTypeFilter] = useState('all');
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/menu`);
        const itemsWithId = res.data.map(item => ({
          ...item,
          id: item._id,
        }));
        setMenuItems(itemsWithId);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch menu items:', err);
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/categories`);
        setCategories(res.data);
       
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    fetchMenuItems();
    fetchCategories();
  }, []);

  const getItemQty = (itemId) => {
    const item = orders.find(o => o.id === itemId);
    return item ? item.qty : 0;
  };


 const handleCategoryClick = (categoryId) => {
  setSelectedCategoryId(categoryId);

  };
  const renderCard = (item) => {
    const currentQty = getItemQty(item.id);
    const isActive = item.active;

    return (
      <Grid item xs={6} sm={4} md={3} lg={2} key={item.id}>
       <Tooltip title={item.Description || 'No description available'} arrow placement="top"> <Card
          onClick={() => {
            if (isActive) handleAddToOrder(item);
          }}
          sx={{
            width: 150,
            height: 200,
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            cursor: isActive ? 'pointer' : 'not-allowed',
            background: isActive
              ? (currentQty > 0
                ? 'linear-gradient(135deg,rgb(8, 9, 12),rgb(7, 7, 7))'
                : '#fff')
              : '#f5f5f5',
            color: isActive && currentQty > 0 ? '#fff' : '#000',
            boxShadow: isActive && currentQty > 0
              ? '0 6px 14px rgba(13, 71, 161, 0.4)'
              : '0 2px 6px rgba(0,0,0,0.05)',
            border: currentQty > 0 ? '2px solidrgb(155, 156, 158)' : '1px solid #ddd',
            opacity: isActive ? 1 : 0.5,
            pointerEvents: isActive ? 'auto' : 'none',
            transition: 'transform 0.25s ease, background-color 0.3s ease',
            '&:hover': {
              transform: isActive ? 'scale(1.04)' : 'none',
              background: isActive && currentQty > 0 ? '#000000' : '#f5f5f5',
            },
          
          }}
        >
          <CardMedia
            component="img"
            image={item.image}
            alt={item.title}
            sx={{
              height: 100,
              objectFit: 'cover',
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              filter: isActive ? 'none' : 'grayscale(100%)',
            }}
          />
          <CardContent
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              px: 1,
              py: 1,
              position: 'relative',
            }}
          >
            <Box
  sx={{
    backgroundColor:
      item.type?.toLowerCase() === 'veg' ? '#388e3c' : '#d32f2f',
    color: '#fff',
    borderRadius: 1,
    px: 0.5,
    py: 0.2,
    textAlign: 'center',
    mb: 0.5,
  }}
>
  <Typography
    fontSize="0.7rem"
    fontWeight="bold"
    noWrap
    sx={{
      color: '#fff',
      lineHeight: 1.2,
    }}
  >
    {item.title}
  </Typography>
</Box>

            <Typography
              align="center"
              fontSize='0.6rem'
              sx={{ color: currentQty > 0 ? '#fff' : '#666' }}
            >
              ₹{item.Price}
            </Typography>

            {isActive && (
              <Stack
                direction="row"
                justifyContent="center"
                alignItems="center"
                spacing={0.5}
                sx={{ mt: 1 }}
              >
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFromOrder(item);
                  }}
                  sx={{
                    width: 24,
                    height: 24,
                    backgroundColor: '#d32f2f',
                    '&:hover': { backgroundColor: '#b71c1c' },
                  }}
                >
                  <Remove sx={{ fontSize: 16, color: '#fff' }} />
                </IconButton>

                <Typography
                  fontSize={isMobile ? '0.75rem' : '0.85rem'}
                  fontWeight="bold"
                  sx={{ minWidth: 16, textAlign: 'center' }}
                >
                  {currentQty}
                </Typography>

                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToOrder(item);
                  }}
                  sx={{
                    width: 24,
                    height: 24,
                    backgroundColor: '#43a047',
                    '&:hover': { backgroundColor: '#2e7d32' },
                  }}
                >
                  <Add sx={{ fontSize: 16, color: '#fff' }} />
                </IconButton>
              </Stack>
            )}

            {!isActive && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                  zIndex: 2,
                }}
              >
                <Box
                  sx={{
                    backgroundColor: '#ff5252',
                    color: '#fff',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    boxShadow: '0px 2px 6px rgba(0,0,0,0.2)',
                  }}
                >
                  Not Available
                </Box>
              </Box>
            )}
           
          </CardContent>
        </Card>
        </Tooltip>
      </Grid>
    );
  };

  if (loading) {
    return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
  }

  return (
 <Box sx={{ p: 2 }}>


      {/* Category Filter Chips */}
   <Stack
  direction="row"
  spacing={1.5}
  sx={{
    mb: 1.5,
    justifyContent: 'center',
    flexWrap: 'wrap',
    rowGap: 1,
  }}
>
  <Chip
    label="All"
    clickable
    size="medium"
    color={selectedCategoryId === 'all' ? 'primary' : 'default'}
    onClick={() => handleCategoryClick('all')}
    sx={{
      fontSize: '0.85rem',
      px: 2,
      py: 1,
      height: 36,
      fontWeight: selectedCategoryId === 'all' ? 'bold' : 'normal',
      '&:hover': { backgroundColor: '#1976d2', color: '#fff' },
    }}
  />
  {categories.map(category => (
   <Chip
  key={category._id}
  label={category.name}
  clickable
  size="medium"
  onClick={() => handleCategoryClick(category._id)}
  sx={{
    fontSize: '0.85rem',
    px: 2,
    py: 1,
    height: 36,
    fontWeight: selectedCategoryId === category._id ? 'bold' : 'normal',
    backgroundColor: selectedCategoryId === category._id ? '#ffeb3b' : undefined, // Yellow
    color: selectedCategoryId === category._id ? '#000' : undefined, // Black text
    '&:hover': {
      backgroundColor: selectedCategoryId === category._id ? '#fdd835' : '#1976d2',
      color: '#000',
    },
  }}
/>
  ))}
</Stack>

<Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
  <ToggleButtonGroup
    value={itemTypeFilter}
    exclusive
    onChange={(e, newValue) => {
      if (newValue !== null) setItemTypeFilter(newValue);
    }}
    size="small"
    sx={{
      border: '1px solid #ccc',
      backgroundColor: '#f0f0f0',
      fontSize: '0.75rem',
      fontWeight: 500,
      '& .MuiToggleButton-root': {
        border: 'none',
        borderRadius: 0,
        padding: '4px 12px',
        minWidth: '80px',
        justifyContent: 'center',
        color: '#000',
        '&:hover': {
          backgroundColor: '#e0e0e0',
        },
      },
      '& .Mui-selected': {
        color: '#000',
        backgroundColor:
     itemTypeFilter === 'veg'
            ? '#388e3c'
            : itemTypeFilter === 'non-veg'
            ? '#d32f2f'
            : '#d0d0d0',
        '&:hover': {
          backgroundColor:
            itemTypeFilter === 'veg'
              ? '#a5d6a7'
              : itemTypeFilter === 'non-veg'
              ? '#ef9a9a'
              : '#c0c0c0',
        },
      },
    }}
  >
    <ToggleButton value="all">All</ToggleButton>
    <ToggleButton value="veg">Veg</ToggleButton>
    <ToggleButton value="non-veg">Non-Veg</ToggleButton>
  </ToggleButtonGroup>
</Box>

      {/* Grouped Category Cards with Toggle */}
    {selectedCategoryId === 'all' ? (
  <Grid container spacing={5} justifyContent="flex-start">
    {menuItems
      .filter(item => {
        const inType =
          itemTypeFilter === 'all' ||
          (itemTypeFilter === 'veg' && item.type?.toLowerCase() === 'veg') ||
          (itemTypeFilter === 'non-veg' && item.type?.toLowerCase() === 'non-veg');
        return inType;
      })
      .map(item => (
        <Fade in timeout={400} key={item.id}>
          {renderCard(item)}
        </Fade>
      ))}
  </Grid>
) : (
  categories.map(category => {
    if (selectedCategoryId !== category._id) return null;

    const categoryItems = menuItems.filter(item => {
      const inCategory = item.Category._id === category._id;
      const inType =
        itemTypeFilter === 'all' ||
        (itemTypeFilter === 'veg' && item.type?.toLowerCase() === 'veg') ||
        (itemTypeFilter === 'non-veg' && item.type?.toLowerCase() === 'non-veg');
      return inCategory && inType;
    });

    if (!categoryItems.length) return null;

    return (
      <Box key={category._id} sx={{ mb: 3 }}>
        <Grid container spacing={3}>
          {categoryItems.map(item => (
            <Fade in timeout={400} key={item.id}>
              {renderCard(item)}
            </Fade>
          ))}
        </Grid>
      </Box>
    );
  })
)}

    </Box>
  );
};

export default MenuListDisplay;
