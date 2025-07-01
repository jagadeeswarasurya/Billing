require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://billing-6qkq.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer config
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'menu_items',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});
const upload = multer({ storage });

// Mongoose Schemas
const Category = mongoose.model('Category', new mongoose.Schema({
  name: { type: String, required: true },
}));

const MenuItem = mongoose.model('MenuItem', new mongoose.Schema({
  title: String,
  Description: String,
  Category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  Price: String,
  image: String,
  active: { type: Boolean, default: true },
  type: { type: String, enum: ['Veg', 'Non-Veg'], default: 'Veg' },
}));

const Order = mongoose.model('Order', new mongoose.Schema({
  ticketId: String,
  date: { type: Date, default: Date.now },
  customer: {
    name: String,
    mobile: String,
  },
  items: [
    {
      title: String,
      qty: Number,
      rate: Number,
    }
  ],
  total: Number,
  totalQty: Number,
  paymentMode: {
    type: String,
    enum: ['Cash', 'Card', 'Upi'],
    required: true
  },
  receivedCash: Number,
  balance: Number,
  bankName: String,
  cardDigits: String,
  serviceType: {
    type: String,
    enum: ['Dine In', 'Take Away'],
    required: true
  },
  status: { type: String, default: 'onBoard' },
  statusTimestamps: {
    onBoard: { type: Date, default: Date.now },
    preparing: Date,
    ready: Date,
    served: Date,
    canceled: Date
  }
}, { timestamps: true }));

// Routes
app.get('/', (req, res) => {
  res.send('Billing backend is running.');
});

app.post('/api/categories', async (req, res) => {
  try {
    const category = new Category({ name: req.body.name });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add category' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

app.post('/api/menu', upload.single('image'), async (req, res) => {
  const { title, Description, Category, Price, active, type } = req.body;
  const image = req.file.path;
  const newItem = new MenuItem({ title, Description, Category, Price, image, active, type });
  await newItem.save();
  res.status(201).json(newItem);
});

app.get('/api/menu', async (req, res) => {
  const items = await MenuItem.find().populate('Category', 'name');
  res.json(items);
});

app.put('/api/menu/:id', async (req, res) => {
  try {
    const updated = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

app.delete('/api/menu/:id', async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const {
      customer, items, total, totalQty, paymentMode, serviceType,
      receivedCash, balance, bankName, cardDigits
    } = req.body;

    const today = new Date();
    const datePrefix = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const lastOrder = await Order.findOne({ ticketId: new RegExp(`^${datePrefix}-`) }).sort({ date: -1 });

    let sequence = 1;
    if (lastOrder && lastOrder.ticketId) {
      const lastSeq = parseInt(lastOrder.ticketId.split('-')[1], 10);
      if (!isNaN(lastSeq)) sequence = lastSeq + 1;
    }

    const ticketId = `${datePrefix}-${String(sequence).padStart(4, '0')}`;
    const newOrder = new Order({
      ticketId, customer, items, total, totalQty, paymentMode,
      serviceType, receivedCash, balance, bankName, cardDigits
    });

    await newOrder.save();
    res.status(201).json({ success: true, ticketId, order: newOrder });
  } catch (err) {
    console.error('Order Save Error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.put('/api/orders/:ticketId', async (req, res) => {
  const { ticketId } = req.params;
  const { status } = req.body;
  const validStatuses = ['onBoard', 'preparing', 'ready', 'served', 'canceled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  try {
    const update = {
      $set: {
        status,
        [`statusTimestamps.${status}`]: new Date()
      }
    };
    const order = await Order.findOneAndUpdate({ ticketId }, update, { new: true });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.status(200).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
