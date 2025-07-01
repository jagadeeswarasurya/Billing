require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));


// MongoDB schema
const MenuItem = mongoose.model('MenuItem', new mongoose.Schema({
  title: String,
  Description: String,
  Category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  Price: String,
  image: String,
  active: { type: Boolean, default: true },
   type: { type: String, enum: ['Veg', 'Non-Veg'], default: 'Veg' },
}));
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');


const allowedOrigins = [
  'https://billing-6qkq.onrender.com/'
];


app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage config
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'menu_items', // optional folder name in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const upload = multer({ storage });


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
    receivedCash: Number,     // For Cash payments
  balance: Number,          // Change to be returned (if any)
  bankName: String,         // For Card/UPI payments
  cardDigits: String,       // Last 4 digits of card, optional
  serviceType: {
    type: String,
    enum: ['Dine In', 'Take Away'],
    required: true
  },
  status: {
    type: String,
    default: 'onBoard'
  },
  statusTimestamps: {
    onBoard: { type: Date, default: Date.now },
    preparing: Date,
    ready: Date,
    served: Date,
    canceled: Date
  }
}, { timestamps: true }

));

app.post('/api/orders', async (req, res) => {
  try {
    const {
  customer,
  items,
  total,
  totalQty,
  paymentMode,
  serviceType,
  receivedCash,
  balance,
  bankName,
  cardDigits
} = req.body;


    if (!['Cash', 'Card', 'Upi'].includes(paymentMode)) {
      return res.status(400).json({ success: false, error: 'Invalid payment mode' });
    }

    if (!['Dine In', 'Take Away'].includes(serviceType)) {
      return res.status(400).json({ success: false, error: 'Invalid service type' });
    }

    // Generate ticketId based on today's date
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const datePrefix = `${yyyy}${mm}${dd}`;

    // Find the last order for today
    const lastOrder = await Order.findOne({
      ticketId: new RegExp(`^${datePrefix}-`)
    }).sort({ date: -1 });

    let sequence = 1;
    if (lastOrder && lastOrder.ticketId) {
      const lastSeq = parseInt(lastOrder.ticketId.split('-')[1], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    const ticketId = `${datePrefix}-${String(sequence).padStart(4, '0')}`;

   const newOrder = new Order({
  ticketId,
  customer,
  items,
  total,
  totalQty,
  paymentMode,
  serviceType,
  receivedCash,
  balance,
  bankName,
  cardDigits
});

    await newOrder.save();

    res.status(201).json({ success: true, ticketId, order: newOrder });
  } catch (err) {
    console.error('Order Save Error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

  


// Add item API
app.post('/api/menu', upload.single('image'), async (req, res) => {
  const { title, Description, Category, Price,active,type } = req.body;
  const image = req.file.path; // Cloudinary gives the URL directly
  const newItem = new MenuItem({ title, Description, Category, Price, image,active,type  });
  await newItem.save();
  res.status(201).json(newItem);
});

// Get menu items
app.get('/api/menu', async (req, res) => {
  const items = await MenuItem.find().populate('Category', 'name');
  res.json(items);
});
// Update menu item
app.put('/api/menu/:id', async (req, res) => {
  try {
    const updated = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete menu item
app.delete('/api/menu/:id', async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});
const Category = mongoose.model('Category', new mongoose.Schema({
  name: { type: String, required: true },
}));
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

// Report APIs
app.get('/api/reports/billwise', async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from && to) {
      filter.date = { $gte: new Date(from), $lte: new Date(to) };
    }
    const result = await Order.find(filter).sort({ date: -1 }).select('ticketId date total totalQty paymentMode');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get bill-wise report' });
  }
});

app.get('/api/reports/itemwise', async (req, res) => {
  try {
    const { from, to } = req.query;
    const match = {};
    if (from && to) {
      match.date = { $gte: new Date(from), $lte: new Date(to) };
    }
    const result = await Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.title',
          qty: { $sum: '$items.qty' },
          amount: { $sum: { $multiply: ['$items.qty', '$items.rate'] } }
        }
      },
      { $project: { title: '$_id', qty: 1, amount: 1, _id: 0 } },
      { $sort: { amount: -1 } }
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get item-wise report' });
  }
});

app.get('/api/reports/categorywise', async (req, res) => {
  try {
    const { from, to } = req.query;
    const match = {};
    if (from && to) {
      match.date = { $gte: new Date(from), $lte: new Date(to) };
    }

    const orders = await Order.find(match);
    const menuItems = await MenuItem.find().populate('Category');
    const categoryMap = {};
    menuItems.forEach(item => {
      categoryMap[item.title] = item.Category?.name || 'Uncategorized';
    });

  const flatItems = orders.flatMap(order =>
  order.items.map(item => ({
    category: categoryMap[item.title] || 'Uncategorized',
    amount: item.qty * item.rate,
    qty: item.qty
  }))
);

const summary = flatItems.reduce((acc, curr) => {
  if (!acc[curr.category]) acc[curr.category] = { amount: 0, qty: 0 };
  acc[curr.category].amount += curr.amount;
  acc[curr.category].qty += curr.qty;
  return acc;
}, {});

const formatted = Object.entries(summary).map(([category, val]) => ({
  category,
  amount: val.amount,
  qty: val.qty
}));


    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get category-wise report' });
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

    const order = await Order.findOneAndUpdate(
      { ticketId },
      update,
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});



app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 }); // Most recent first
    res.status(200).json(orders);
  } catch (err) {
    console.error('Failed to fetch orders', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
app.listen(5000, () => console.log('Server running on port 5000'));
