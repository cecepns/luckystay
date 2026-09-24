const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const axios = require('axios');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'luckystay-super-secret-key-2026';

const app = express();
const PORT = process.env.PORT || 5001;
const HOSTEX_BASE_URL = process.env.HOSTEX_BASE_URL || 'https://api.hostex.io/v3';
const HOSTEX_API_KEY = process.env.HOSTEX_API_KEY || 'zxWpNqZJNhL6RB2Tq1g4x6JXNQrQquPF0Y2V9YdB3D2DtpuT7sWsm3wUnahuftV9';

// Ensure upload directory exists inside backend folder
const uploadDir = path.join(__dirname, 'uploads-luckystay');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads from backend/uploads-luckystay
app.use('/uploads-luckystay', express.static(uploadDir));
app.use('/api/uploads-luckystay', express.static(uploadDir));
app.use('/luckystay/uploads-luckystay', express.static(uploadDir));
app.use('/assets', express.static(path.join(__dirname, '..')));

// Multer storage setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Hanya file gambar (JPG, PNG, WEBP, GIF, SVG) yang diperbolehkan!'));
  }
});

// ----------------------------------------------------
// MySQL Database Pool (Strict - No Mock Initial Data)
// ----------------------------------------------------
const dbPool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'luckystay_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection on startup
dbPool.getConnection()
  .then(async conn => {
    console.log('✅ Connected to MySQL database successfully!');
    try {
      await conn.query(`ALTER TABLE properties ADD COLUMN original_price DECIMAL(12,2) DEFAULT NULL`);
    } catch (e) {}
    try {
      await conn.query(`ALTER TABLE properties ADD COLUMN discount_percent INT DEFAULT 0`);
    } catch (e) {}
    try {
      await conn.query(`ALTER TABLE properties ADD COLUMN price_per_month DECIMAL(12,2) DEFAULT NULL`);
    } catch (e) {}
    try {
      await conn.query(`ALTER TABLE properties ADD COLUMN monthly_discount_percent INT DEFAULT 0`);
    } catch (e) {}
    try {
      await conn.query(`ALTER TABLE properties ADD COLUMN price_per_year DECIMAL(12,2) DEFAULT NULL`);
    } catch (e) {}
    try {
      await conn.query(`ALTER TABLE properties ADD COLUMN yearly_discount_percent INT DEFAULT 0`);
    } catch (e) {}
    try {
      await conn.query(`ALTER TABLE bookings MODIFY COLUMN payment_status ENUM('pending_payment', 'waiting_approval', 'dp_paid', 'confirmed', 'rejected', 'cancelled', 'completed') NOT NULL DEFAULT 'pending_payment'`);
    } catch (e) {}
    try {
      await conn.query(`ALTER TABLE bookings ADD COLUMN down_payment_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00`);
    } catch (e) {}
    try {
      await conn.query(`ALTER TABLE bookings ADD COLUMN rental_type ENUM('daily', 'monthly', 'yearly') NOT NULL DEFAULT 'daily'`);
    } catch (e) {}
    try {
      await conn.query(`UPDATE bank_accounts SET qris_image = NULL WHERE qris_image = '[object Object]'`);
    } catch (e) {}
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL Connection Failed:', err.message);
  });

// ----------------------------------------------------
// Hostex OpenAPI v3 Axios Client
// ----------------------------------------------------
const hostexClient = axios.create({
  baseURL: HOSTEX_BASE_URL,
  timeout: 10000,
  headers: {
    'Hostex-Access-Token': HOSTEX_API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

/**
 * Sync reservation to Hostex Channel Manager
 */
async function syncReservationToHostex(booking, property) {
  const hostexPropertyId = property.hostex_property_id || property.id;
  const channelRef = String(booking.invoice_number).replace(/[^a-zA-Z0-9]/g, '');

  const roomRate = Math.round(Number(booking.total_room_price) || (Number(booking.grand_total) - Number(booking.cleaning_fee || 0) - Number(booking.security_deposit || 0)));
  const cleaningFee = Math.round(Number(booking.cleaning_fee) || 0);
  const securityDeposit = Math.round(Number(booking.security_deposit) || 0);
  const grandTotal = Math.round(Number(booking.grand_total) || (roomRate + cleaningFee + securityDeposit));
  const payoutEarnings = roomRate + cleaningFee;

  const remarksLines = [
    `Lucky Stay Direct: ${booking.invoice_number}`,
    `• Sewa Kamar: Rp ${roomRate.toLocaleString('id-ID')}`,
    cleaningFee > 0 ? `• Cleaning Fee: Rp ${cleaningFee.toLocaleString('id-ID')}` : null,
    `• Total Payout (Pendapatan): Rp ${payoutEarnings.toLocaleString('id-ID')}`,
    securityDeposit > 0 ? `• Security Deposit (Jaminan): Rp ${securityDeposit.toLocaleString('id-ID')}` : null,
    `Total Bayar Tamu: Rp ${grandTotal.toLocaleString('id-ID')}`,
    securityDeposit > 0 ? `*Perhatian: Deposit Rp ${securityDeposit.toLocaleString('id-ID')} BUKAN pendapatan (titipan jaminan tamu, wajib dikembalikan saat check-out jika unit aman).` : null
  ].filter(Boolean);

  const payload = {
    property_id: Number(hostexPropertyId) || 1,
    check_in_date: typeof booking.check_in_date === 'string' ? booking.check_in_date.slice(0, 10) : new Date(booking.check_in_date).toISOString().slice(0, 10),
    check_out_date: typeof booking.check_out_date === 'string' ? booking.check_out_date.slice(0, 10) : new Date(booking.check_out_date).toISOString().slice(0, 10),
    guest_name: booking.guest_name,
    email: booking.guest_email || 'guest@luckystay.com',
    mobile: booking.guest_phone || '+628123456789',
    number_of_guests: Number(booking.number_of_guests) || 1,
    currency: 'IDR',
    rate_amount: roomRate,
    commission_amount: 0,
    received_amount: roomRate,
    remarks: remarksLines.join('\n'),
    channel_id: channelRef
  };

  try {
    // 1. Resolve custom_channel_id (Default: 29 Booking Site)
    let customChannelId = 29;
    try {
      const channelRes = await hostexClient.get('/custom_channels');
      if (channelRes.data?.data?.custom_channels?.length > 0) {
        const siteChannel = channelRes.data.data.custom_channels.find(c => c.name?.toLowerCase().includes('site') || c.id === 29);
        customChannelId = siteChannel ? siteChannel.id : channelRes.data.data.custom_channels[0].id;
      }
    } catch (cErr) {
      console.log('Hostex custom_channels check:', cErr.message);
    }
    payload.custom_channel_id = customChannelId;

    // 2. Resolve income_method_id (Default: 27 Bookingsite or 198 Other)
    let incomeMethodId = 27;
    try {
      const incomeRes = await hostexClient.get('/income_methods');
      if (incomeRes.data?.data?.income_methods?.length > 0) {
        const siteMethod = incomeRes.data.data.income_methods.find(m => m.name?.toLowerCase().includes('booking') || m.id === 27);
        incomeMethodId = siteMethod ? siteMethod.id : incomeRes.data.data.income_methods[0].id;
      }
    } catch (iErr) {
      console.log('Hostex income_methods check:', iErr.message);
    }
    payload.income_method_id = incomeMethodId;

    console.log('📡 Calling Hostex POST /reservations:', payload);
    const response = await hostexClient.post('/reservations', payload);
    const hostexCode = response.data?.data?.reservation?.reservation_code || `HTX-${Date.now()}`;
    const stayCode = response.data?.data?.reservation?.stay_code || hostexCode;

    // Record cleaning fee transaction to Hostex if cleaningFee > 0
    if (cleaningFee > 0) {
      try {
        await hostexClient.post('/transactions', {
          reservation_code: hostexCode,
          direction: 'income',
          amount: cleaningFee,
          item_id: 13, // 13 is Cleaning fee in Hostex
          payment_method_id: incomeMethodId,
          note: `Cleaning Fee - ${booking.invoice_number}`
        });
        console.log(`✅ Hostex cleaning fee transaction (Rp ${cleaningFee}) recorded for ${hostexCode}`);
      } catch (txErr) {
        console.warn('⚠️ Hostex cleaning fee transaction notice:', txErr.response?.data?.error_msg || txErr.message);
      }
    }

    // Attempt setting deposit in check_in_details if securityDeposit > 0
    if (securityDeposit > 0) {
      try {
        await hostexClient.patch(`/reservations/${stayCode}/check_in_details`, {
          deposit: securityDeposit
        });
        console.log(`✅ Hostex check_in_details deposit (Rp ${securityDeposit}) set for ${stayCode}`);
      } catch (depErr) {
        // Safe fallback if Hostex account has no external deposit merchant connected
        console.log('ℹ️ Hostex check_in_details deposit notice:', depErr.response?.data?.error_msg || depErr.message);
      }
    }

    // Record audit log to MySQL
    try {
      await dbPool.query(
        'INSERT INTO hostex_logs (booking_id, action, status, request_payload, response_payload, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [booking.id, 'CREATE_RESERVATION', 'success', JSON.stringify(payload), JSON.stringify(response.data)]
      );
    } catch (logDbErr) {
      console.error('Error logging Hostex to DB:', logDbErr.message);
    }

    return {
      success: true,
      reservation_code: hostexCode,
      raw_response: response.data
    };
  } catch (err) {
    const errorDetail = err.response?.data || err.message;
    console.error('❌ Hostex sync error:', errorDetail);

    // Record error log to MySQL
    try {
      await dbPool.query(
        'INSERT INTO hostex_logs (booking_id, action, status, request_payload, response_payload, error_message, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [booking.id, 'CREATE_RESERVATION', 'failed', JSON.stringify(payload), JSON.stringify(err.response?.data || null), typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : String(errorDetail)]
      );
    } catch (logDbErr) {
      console.error('Error logging Hostex failure to DB:', logDbErr.message);
    }

    return {
      success: false,
      error: errorDetail,
      simulated_code: null
    };
  }
}

// ----------------------------------------------------
// REST API ROUTES
// ----------------------------------------------------

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    await dbPool.query('SELECT 1');
    res.json({
      status: 'ok',
      database: 'MySQL Connected',
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      database: 'MySQL Error: ' + err.message,
      timestamp: new Date()
    });
  }
});

// ----------------------------------------------------
// AUTHENTICATION MIDDLEWARE & HELPERS
// ----------------------------------------------------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Akses ditolak. Token autentikasi tidak ditemukan.' });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Sesi login telah berakhir atau token tidak valid.' });
    }
    req.user = user;
    next();
  });
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err && user) {
        req.user = user;
      }
      next();
    });
  } else {
    next();
  }
};

// ----------------------------------------------------
// AUTH APIS (Register, Login, Profile, My Bookings)
// ----------------------------------------------------

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nama lengkap, email, dan password wajib diisi!' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter!' });
    }

    // Check if email already registered
    const [existing] = await dbPool.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await dbPool.query(
      'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), cleanEmail, phone ? String(phone).trim() : null, hashedPassword, 'customer']
    );

    const user = {
      id: result.insertId,
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? String(phone).trim() : null,
      role: 'customer'
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil! Selamat datang di Lucky Stay.',
      data: { user, token }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Gagal mendaftar: ' + err.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi!' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const [rows] = await dbPool.query('SELECT * FROM users WHERE email = ?', [cleanEmail]);
    if (!rows || rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Email atau password salah!' });
    }

    const dbUser = rows[0];
    const isPasswordValid = await bcrypt.compare(password, dbUser.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Email atau password salah!' });
    }

    const user = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      phone: dbUser.phone,
      role: dbUser.role
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      message: `Login berhasil! Selamat datang kembali, ${user.name}`,
      data: { user, token }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Gagal login: ' + err.message });
  }
});

// GET /api/auth/profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const [rows] = await dbPool.query('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil profil: ' + err.message });
  }
});

// GET /api/user/my-bookings
app.get('/api/user/my-bookings', authenticateToken, async (req, res) => {
  try {
    const [rows] = await dbPool.query(
      `SELECT b.*, 
              p.name AS property_name, 
              p.building_name, 
              p.location, 
              p.city, 
              p.type, 
              p.category,
              p.images
       FROM bookings b
       JOIN properties p ON b.property_id = p.id
       WHERE b.user_id = ? OR b.guest_email = ?
       ORDER BY b.created_at DESC`,
      [req.user.id, req.user.email]
    );

    const formattedRows = rows.map(b => ({
      ...b,
      property_images: typeof b.images === 'string' ? JSON.parse(b.images || '[]') : (b.images || [])
    }));

    res.json({
      success: true,
      data: formattedRows
    });
  } catch (err) {
    console.error('My bookings error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data pesanan saya: ' + err.message });
  }
});

// ----------------------------------------------------
// 1. PROPERTIES APIS (Pure MySQL)
// ----------------------------------------------------

// GET /api/properties (Pagination, Search, Filter, Sorting)
app.get('/api/properties', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    const search = (req.query.search || '').trim();
    const city = (req.query.city || '').trim();
    const location = (req.query.location || '').trim();
    const type = (req.query.type || '').trim();
    const category = (req.query.category || '').trim();
    const minPrice = parseFloat(req.query.min_price) || 0;
    const maxPrice = parseFloat(req.query.max_price) || 0;
    const guests = parseInt(req.query.guests) || 0;

    const allowedSortColumns = ['id', 'name', 'price_per_night', 'created_at', 'city'];
    const sortBy = allowedSortColumns.includes(req.query.sort_by) ? req.query.sort_by : 'created_at';
    const sortOrder = (req.query.sort_order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let whereConditions = ['is_active = 1'];
    let queryParams = [];

    if (search) {
      whereConditions.push('(name LIKE ? OR building_name LIKE ? OR location LIKE ? OR city LIKE ? OR description LIKE ?)');
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (city) {
      whereConditions.push('city LIKE ?');
      queryParams.push(`%${city}%`);
    }

    if (location) {
      whereConditions.push('location LIKE ?');
      queryParams.push(`%${location}%`);
    }

    if (type) {
      whereConditions.push('type = ?');
      queryParams.push(type);
    }

    if (category) {
      whereConditions.push('category = ?');
      queryParams.push(category);
    }

    if (minPrice > 0) {
      whereConditions.push('price_per_night >= ?');
      queryParams.push(minPrice);
    }

    if (maxPrice > 0) {
      whereConditions.push('price_per_night <= ?');
      queryParams.push(maxPrice);
    }

    if (guests > 0) {
      whereConditions.push('max_guests >= ?');
      queryParams.push(guests);
    }

    const whereClause = whereConditions.join(' AND ');

    // 1. Get total count
    const [countResult] = await dbPool.query(
      `SELECT COUNT(*) AS total FROM properties WHERE ${whereClause}`,
      queryParams
    );
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // 2. Get paginated rows
    const [rows] = await dbPool.query(
      `SELECT * FROM properties WHERE ${whereClause} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Format JSON fields safely
    const formattedRows = rows.map(p => ({
      ...p,
      amenities: typeof p.amenities === 'string' ? JSON.parse(p.amenities || '[]') : (p.amenities || []),
      images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : (p.images || [])
    }));

    res.json({
      success: true,
      data: formattedRows,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error('MySQL properties error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data properti dari database', error: err.message });
  }
});

// GET /api/properties/:id (Detail property + booked dates)
app.get('/api/properties/:id', async (req, res) => {
  try {
    const ident = req.params.id;
    const isNumber = !isNaN(ident);

    const query = isNumber
      ? 'SELECT * FROM properties WHERE id = ? LIMIT 1'
      : 'SELECT * FROM properties WHERE slug = ? OR id = ? LIMIT 1';
    const params = isNumber ? [Number(ident)] : [ident, ident];

    const [rows] = await dbPool.query(query, params);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Properti tidak ditemukan' });
    }

    const property = rows[0];
    property.amenities = typeof property.amenities === 'string' ? JSON.parse(property.amenities || '[]') : (property.amenities || []);
    property.images = typeof property.images === 'string' ? JSON.parse(property.images || '[]') : (property.images || []);

    // Get booked dates from MySQL
    const [bookedRows] = await dbPool.query(
      `SELECT check_in_date, check_out_date, payment_status FROM bookings WHERE property_id = ? AND payment_status IN ('confirmed', 'waiting_approval')`,
      [property.id]
    );

    const bookedDates = bookedRows.map(b => ({
      check_in: typeof b.check_in_date === 'string' ? b.check_in_date.slice(0, 10) : new Date(b.check_in_date).toISOString().slice(0, 10),
      check_out: typeof b.check_out_date === 'string' ? b.check_out_date.slice(0, 10) : new Date(b.check_out_date).toISOString().slice(0, 10),
      status: b.payment_status
    }));

    res.json({
      success: true,
      data: {
        ...property,
        booked_dates: bookedDates
      }
    });
  } catch (err) {
    console.error('MySQL property detail error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail properti', error: err.message });
  }
});

// POST /api/properties (Create property in MySQL)
app.post('/api/properties', upload.array('images', 20), async (req, res) => {
  try {
    const {
      name,
      building_name,
      unit_number,
      location,
      city,
      address,
      map_url,
      type,
      price_per_night,
      cleaning_fee,
      security_deposit,
      max_guests,
      bedrooms,
      beds,
      bathrooms,
      size_sqm,
      description,
      house_rules,
      amenities,
      hostex_property_id
    } = req.body;

    if (!name || !location || !city || !price_per_night) {
      return res.status(400).json({ success: false, message: 'Nama, lokasi, kota, dan harga per malam wajib diisi!' });
    }

    let imagesList = [];
    if (req.files && req.files.length > 0) {
      imagesList = req.files.map(f => `/uploads-luckystay/${f.filename}`);
    }
    
    if (req.body.existing_images) {
      try {
        const parsed = typeof req.body.existing_images === 'string' ? JSON.parse(req.body.existing_images) : req.body.existing_images;
        if (Array.isArray(parsed)) {
          imagesList = [...parsed, ...imagesList];
        }
      } catch (e) {}
    } else if (req.body.image_urls && imagesList.length === 0) {
      imagesList = Array.isArray(req.body.image_urls) ? req.body.image_urls : [req.body.image_urls];
    }

    let parsedAmenities = [];
    if (amenities) {
      try {
        parsedAmenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
      } catch (e) {
        parsedAmenities = amenities.split(',').map(s => s.trim());
      }
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

    let parsedOriginalPrice = req.body.original_price ? Number(req.body.original_price) : null;
    let parsedDiscountPercent = req.body.discount_percent ? Number(req.body.discount_percent) : 0;
    if (parsedOriginalPrice && parsedOriginalPrice > Number(price_per_night) && !parsedDiscountPercent) {
      parsedDiscountPercent = Math.round(((parsedOriginalPrice - Number(price_per_night)) / parsedOriginalPrice) * 100);
    } else if (parsedDiscountPercent > 0 && !parsedOriginalPrice) {
      parsedOriginalPrice = Math.round(Number(price_per_night) / (1 - parsedDiscountPercent / 100));
    }

    let parsedMonthlyDiscount = req.body.monthly_discount_percent !== undefined ? Number(req.body.monthly_discount_percent) : 15;
    let parsedPricePerMonth = req.body.price_per_month ? Number(req.body.price_per_month) : Math.round(Number(price_per_night) * 30 * (1 - (parsedMonthlyDiscount / 100)));
    let parsedYearlyDiscount = req.body.yearly_discount_percent !== undefined ? Number(req.body.yearly_discount_percent) : 25;
    let parsedPricePerYear = req.body.price_per_year ? Number(req.body.price_per_year) : Math.round(Number(price_per_night) * 365 * (1 - (parsedYearlyDiscount / 100)));

    const [result] = await dbPool.query(
      `INSERT INTO properties (
        name, slug, building_name, unit_number, location, city, address, map_url, type,
        price_per_night, original_price, discount_percent, price_per_month, monthly_discount_percent,
        price_per_year, yearly_discount_percent, cleaning_fee, security_deposit, max_guests, bedrooms, beds, bathrooms,
        size_sqm, description, house_rules, amenities, images, hostex_property_id, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
      [
        name,
        slug,
        building_name || null,
        unit_number || null,
        location,
        city,
        address || `${location}, ${city}`,
        map_url || null,
        type || 'Studio',
        Number(price_per_night),
        parsedOriginalPrice,
        parsedDiscountPercent,
        parsedPricePerMonth,
        parsedMonthlyDiscount,
        parsedPricePerYear,
        parsedYearlyDiscount,
        Number(cleaning_fee) || 0,
        Number(security_deposit) || 0,
        Number(max_guests) || 2,
        Number(bedrooms) || 1,
        Number(beds) || 1,
        Number(bathrooms) || 1,
        Number(size_sqm) || 35,
        description || '',
        house_rules || '',
        JSON.stringify(parsedAmenities),
        JSON.stringify(imagesList),
        hostex_property_id || null
      ]
    );

    const newId = result.insertId;
    const [newRows] = await dbPool.query('SELECT * FROM properties WHERE id = ?', [newId]);

    res.status(201).json({
      success: true,
      message: 'Properti berhasil ditambahkan!',
      data: newRows[0]
    });
  } catch (err) {
    console.error('MySQL create property error:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat properti', error: err.message });
  }
});

// PUT /api/properties/:id (Update property in MySQL)
app.put('/api/properties/:id', upload.array('images', 20), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [existingRows] = await dbPool.query('SELECT * FROM properties WHERE id = ?', [id]);

    if (!existingRows || existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Properti tidak ditemukan' });
    }

    const current = existingRows[0];
    const body = req.body;

    let baseImages = typeof current.images === 'string' ? JSON.parse(current.images || '[]') : (current.images || []);
    if (body.existing_images !== undefined) {
      try {
        baseImages = typeof body.existing_images === 'string' ? JSON.parse(body.existing_images) : body.existing_images;
        if (!Array.isArray(baseImages)) baseImages = [];
      } catch (e) {
        baseImages = [];
      }
    }

    let updatedImages = [...baseImages];
    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map(f => `/uploads-luckystay/${f.filename}`);
      updatedImages = [...updatedImages, ...newFiles];
    } else if (body.image_urls && updatedImages.length === 0) {
      updatedImages = Array.isArray(body.image_urls) ? body.image_urls : [body.image_urls];
    }

    let parsedAmenities = typeof current.amenities === 'string' ? JSON.parse(current.amenities || '[]') : (current.amenities || []);
    if (body.amenities) {
      try {
        parsedAmenities = typeof body.amenities === 'string' ? JSON.parse(body.amenities) : body.amenities;
      } catch (e) {
        parsedAmenities = body.amenities.split(',').map(s => s.trim());
      }
    }

    let targetPrice = body.price_per_night ? Number(body.price_per_night) : current.price_per_night;
    let targetOriginal = body.original_price !== undefined ? (body.original_price ? Number(body.original_price) : null) : current.original_price;
    let targetDiscount = body.discount_percent !== undefined ? Number(body.discount_percent) : current.discount_percent;

    if (targetOriginal && targetOriginal > targetPrice && !targetDiscount) {
      targetDiscount = Math.round(((targetOriginal - targetPrice) / targetOriginal) * 100);
    } else if (targetDiscount > 0 && !targetOriginal) {
      targetOriginal = Math.round(targetPrice / (1 - targetDiscount / 100));
    }

    let targetMonthlyDiscount = body.monthly_discount_percent !== undefined ? Number(body.monthly_discount_percent) : (current.monthly_discount_percent || 15);
    let targetPricePerMonth = body.price_per_month ? Number(body.price_per_month) : (current.price_per_month || Math.round(targetPrice * 30 * (1 - targetMonthlyDiscount / 100)));

    let targetYearlyDiscount = body.yearly_discount_percent !== undefined ? Number(body.yearly_discount_percent) : (current.yearly_discount_percent || 25);
    let targetPricePerYear = body.price_per_year ? Number(body.price_per_year) : (current.price_per_year || Math.round(targetPrice * 365 * (1 - targetYearlyDiscount / 100)));

    await dbPool.query(
      `UPDATE properties SET
        name = ?,
        building_name = ?,
        unit_number = ?,
        location = ?,
        city = ?,
        address = ?,
        map_url = ?,
        type = ?,
        price_per_night = ?,
        original_price = ?,
        discount_percent = ?,
        price_per_month = ?,
        monthly_discount_percent = ?,
        price_per_year = ?,
        yearly_discount_percent = ?,
        cleaning_fee = ?,
        security_deposit = ?,
        max_guests = ?,
        bedrooms = ?,
        beds = ?,
        bathrooms = ?,
        size_sqm = ?,
        description = ?,
        house_rules = ?,
        amenities = ?,
        images = ?,
        hostex_property_id = ?,
        is_active = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        body.name || current.name,
        body.building_name !== undefined ? body.building_name : current.building_name,
        body.unit_number !== undefined ? body.unit_number : current.unit_number,
        body.location || current.location,
        body.city || current.city,
        body.address || current.address,
        body.map_url !== undefined ? body.map_url : current.map_url,
        body.type || current.type,
        targetPrice,
        targetOriginal,
        targetDiscount || 0,
        targetPricePerMonth,
        targetMonthlyDiscount,
        targetPricePerYear,
        targetYearlyDiscount,
        body.cleaning_fee !== undefined ? Number(body.cleaning_fee) : current.cleaning_fee,
        body.security_deposit !== undefined ? Number(body.security_deposit) : current.security_deposit,
        body.max_guests !== undefined ? Number(body.max_guests) : current.max_guests,
        body.bedrooms !== undefined ? Number(body.bedrooms) : current.bedrooms,
        body.beds !== undefined ? Number(body.beds) : current.beds,
        body.bathrooms !== undefined ? Number(body.bathrooms) : current.bathrooms,
        body.size_sqm !== undefined ? Number(body.size_sqm) : current.size_sqm,
        body.description !== undefined ? body.description : current.description,
        body.house_rules !== undefined ? body.house_rules : current.house_rules,
        JSON.stringify(parsedAmenities),
        JSON.stringify(updatedImages),
        body.hostex_property_id !== undefined ? body.hostex_property_id : current.hostex_property_id,
        body.is_active !== undefined ? Number(body.is_active) : current.is_active,
        id
      ]
    );

    const [updatedRows] = await dbPool.query('SELECT * FROM properties WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Properti berhasil diperbarui!',
      data: updatedRows[0]
    });
  } catch (err) {
    console.error('MySQL update property error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui properti', error: err.message });
  }
});

// DELETE /api/properties/:id (Delete from MySQL)
app.delete('/api/properties/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await dbPool.query('SELECT * FROM properties WHERE id = ?', [id]);

    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Properti tidak ditemukan' });
    }

    await dbPool.query('DELETE FROM properties WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Properti berhasil dihapus dari database!'
    });
  } catch (err) {
    console.error('MySQL delete property error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus properti', error: err.message });
  }
});

// ----------------------------------------------------
// 2. BOOKINGS & INVOICE APIS (Pure MySQL)
// ----------------------------------------------------

// POST /api/bookings (Create direct booking in MySQL - Requires Authentication)
app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const {
      property_id,
      guest_name,
      guest_email,
      guest_phone,
      number_of_guests,
      check_in_date,
      check_out_date,
      special_requests,
      payment_method
    } = req.body;

    const finalUserId = req.user.id;

    if (!property_id || !guest_name || !guest_phone || !check_in_date || !check_out_date) {
      return res.status(400).json({
        success: false,
        message: 'Lengkapi data booking: properti, nama tamu, kontak nomor HP, dan tanggal check-in/out!'
      });
    }

    const [propRows] = await dbPool.query('SELECT * FROM properties WHERE id = ?', [property_id]);
    if (!propRows || propRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Properti yang dipilih tidak valid!' });
    }
    const property = propRows[0];

    const start = new Date(check_in_date);
    const end = new Date(check_out_date);
    const diffTime = end - start;
    const totalNights = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));

    if (totalNights <= 0) {
      return res.status(400).json({ success: false, message: 'Tanggal check-out harus lebih besar dari tanggal check-in!' });
    }

    // Check conflict with existing confirmed or DP bookings
    const [conflictRows] = await dbPool.query(
      `SELECT id FROM bookings WHERE property_id = ? AND payment_status IN ('confirmed', 'dp_paid') AND (check_in_date < ? AND check_out_date > ?)`,
      [property.id, check_out_date, check_in_date]
    );

    if (conflictRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal yang dipilih telah terbooking. Silakan pilih tanggal lain.'
      });
    }

    let rentalType = req.body.rental_type || 'daily';
    const roomPricePerNight = Number(property.price_per_night);
    let totalRoomPrice = roomPricePerNight * totalNights;

    if (rentalType === 'yearly' || totalNights >= 365) {
      rentalType = 'yearly';
      const yearlyPrice = Number(property.price_per_year) || Math.round(roomPricePerNight * 365 * 0.75);
      const fullYears = Math.floor(totalNights / 365);
      const remDays = totalNights % 365;
      totalRoomPrice = (fullYears * yearlyPrice) + Math.round(remDays * (yearlyPrice / 365));
    } else if (rentalType === 'monthly' || totalNights >= 30) {
      rentalType = 'monthly';
      const monthlyPrice = Number(property.price_per_month) || Math.round(roomPricePerNight * 30 * 0.85);
      const fullMonths = Math.floor(totalNights / 30);
      const remDays = totalNights % 30;
      totalRoomPrice = (fullMonths * monthlyPrice) + Math.round(remDays * (monthlyPrice / 30));
    }

    const cleaningFee = Number(property.cleaning_fee) || 0;
    const securityDeposit = Number(property.security_deposit) || 0;
    const grandTotal = totalRoomPrice + cleaningFee + securityDeposit;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-LS${dateStr}-${randNum}`;

    const [insertResult] = await dbPool.query(
      `INSERT INTO bookings (
        invoice_number, property_id, user_id, guest_name, guest_email, guest_phone, number_of_guests,
        check_in_date, check_out_date, total_nights, rental_type, room_price_per_night, total_room_price,
        cleaning_fee, security_deposit, grand_total, down_payment_amount, special_requests, payment_method,
        payment_status, hostex_sync_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'pending_payment', 'not_synced', NOW())`,
      [
        invoiceNumber,
        property.id,
        finalUserId,
        guest_name,
        guest_email || '',
        guest_phone,
        Number(number_of_guests) || 1,
        check_in_date,
        check_out_date,
        totalNights,
        rentalType,
        roomPricePerNight,
        totalRoomPrice,
        cleaningFee,
        securityDeposit,
        grandTotal,
        special_requests || '',
        payment_method || 'bank_transfer'
      ]
    );

    const [newBookingRows] = await dbPool.query('SELECT * FROM bookings WHERE id = ?', [insertResult.insertId]);

    res.status(201).json({
      success: true,
      message: 'Booking berhasil dibuat! Silakan lanjutkan pembayaran.',
      data: {
        ...newBookingRows[0],
        property
      }
    });
  } catch (err) {
    console.error('MySQL create booking error:', err);
    res.status(500).json({ success: false, message: 'Gagal memproses booking', error: err.message });
  }
});

// POST /api/bookings/admin (Direct create booking by Admin with custom status & DP)
app.post('/api/bookings/admin', async (req, res) => {
  try {
    const {
      property_id,
      guest_name,
      guest_email,
      guest_phone,
      number_of_guests,
      check_in_date,
      check_out_date,
      rental_type,
      payment_status,
      payment_method,
      down_payment_amount,
      room_price_per_night,
      total_room_price,
      cleaning_fee,
      security_deposit,
      grand_total,
      special_requests,
      admin_notes
    } = req.body;

    if (!property_id || !guest_name || !guest_phone || !check_in_date || !check_out_date) {
      return res.status(400).json({
        success: false,
        message: 'Lengkapi data sewa: properti, nama tamu, kontak HP/WA, dan tanggal sewa!'
      });
    }

    const [propRows] = await dbPool.query('SELECT * FROM properties WHERE id = ?', [property_id]);
    if (!propRows || propRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Properti yang dipilih tidak valid!' });
    }
    const property = propRows[0];

    const start = new Date(check_in_date);
    const end = new Date(check_out_date);
    const totalNights = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

    if (totalNights <= 0) {
      return res.status(400).json({ success: false, message: 'Tanggal check-out harus lebih besar dari check-in!' });
    }

    // Check collision with confirmed / dp_paid bookings on this property
    const [conflictRows] = await dbPool.query(
      `SELECT id, invoice_number, guest_name FROM bookings WHERE property_id = ? AND payment_status IN ('confirmed', 'dp_paid') AND (check_in_date < ? AND check_out_date > ?)`,
      [property.id, check_out_date, check_in_date]
    );

    if (conflictRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Tanggal yang dipilih bentrok dengan pemesanan #${conflictRows[0].invoice_number} (${conflictRows[0].guest_name})!`
      });
    }

    const finalStatus = payment_status || 'pending_payment';
    const finalRentalType = rental_type || 'daily';
    const finalDP = Number(down_payment_amount) || 0;
    const finalRate = room_price_per_night !== undefined ? Number(room_price_per_night) : Number(property.price_per_night);
    const finalTotalRoom = total_room_price !== undefined ? Number(total_room_price) : (finalRate * totalNights);
    const finalClean = cleaning_fee !== undefined ? Number(cleaning_fee) : Number(property.cleaning_fee || 0);
    const finalDeposit = security_deposit !== undefined ? Number(security_deposit) : Number(property.security_deposit || 0);
    const finalGrand = grand_total !== undefined ? Number(grand_total) : (finalTotalRoom + finalClean + finalDeposit);

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-ADM${dateStr}-${randNum}`;

    const [insertResult] = await dbPool.query(
      `INSERT INTO bookings (
        invoice_number, property_id, user_id, guest_name, guest_email, guest_phone, number_of_guests,
        check_in_date, check_out_date, total_nights, rental_type, room_price_per_night, total_room_price,
        cleaning_fee, security_deposit, grand_total, down_payment_amount, special_requests, admin_notes,
        payment_method, payment_status, hostex_sync_status, created_at
      ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'not_synced', NOW())`,
      [
        invoiceNumber,
        property.id,
        guest_name.trim(),
        guest_email ? guest_email.trim() : '',
        guest_phone.trim(),
        Number(number_of_guests) || 1,
        check_in_date,
        check_out_date,
        totalNights,
        finalRentalType,
        finalRate,
        finalTotalRoom,
        finalClean,
        finalDeposit,
        finalGrand,
        finalDP,
        special_requests ? special_requests.trim() : '',
        admin_notes ? admin_notes.trim() : 'Dibuat langsung oleh admin',
        payment_method || 'cash',
        finalStatus
      ]
    );

    const [newBooking] = await dbPool.query('SELECT * FROM bookings WHERE id = ?', [insertResult.insertId]);

    res.status(201).json({
      success: true,
      message: 'Sewa baru berhasil diinput!',
      data: {
        ...newBooking[0],
        property
      }
    });
  } catch (err) {
    console.error('MySQL admin create booking error:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat sewa baru', error: err.message });
  }
});

// GET /api/bookings/timeline (Monthly Timeline & Gantt Chart data)
app.get('/api/bookings/timeline', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1); // 1-12
    const propertyId = parseInt(req.query.property_id) || 0;

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    // 1. Get properties
    let propQuery = 'SELECT id, name, building_name, unit_number, type, city, location, price_per_night, price_per_month, price_per_year, images FROM properties WHERE is_active = 1';
    let propParams = [];
    if (propertyId > 0) {
      propQuery += ' AND id = ?';
      propParams.push(propertyId);
    }
    propQuery += ' ORDER BY building_name ASC, unit_number ASC, name ASC';
    const [properties] = await dbPool.query(propQuery, propParams);

    // 2. Get bookings overlapping with this month (ignore rejected or cancelled)
    let bookQuery = `
      SELECT 
        b.id, b.invoice_number, b.property_id, b.guest_name, b.guest_phone, b.guest_email,
        b.number_of_guests, b.check_in_date, b.check_out_date, b.total_nights,
        b.rental_type, b.room_price_per_night, b.total_room_price, b.grand_total,
        b.down_payment_amount, b.payment_status, b.payment_method, b.admin_notes,
        p.name AS property_name, p.building_name, p.unit_number
      FROM bookings b
      JOIN properties p ON b.property_id = p.id
      WHERE (b.check_in_date <= ? AND b.check_out_date >= ?)
        AND b.payment_status NOT IN ('rejected', 'cancelled')
    `;
    let bookParams = [endDate, startDate];
    if (propertyId > 0) {
      bookQuery += ' AND b.property_id = ?';
      bookParams.push(propertyId);
    }
    bookQuery += ' ORDER BY b.check_in_date ASC';
    const [bookings] = await dbPool.query(bookQuery, bookParams);

    const formattedProperties = properties.map(p => ({
      ...p,
      images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : (p.images || [])
    }));

    res.json({
      success: true,
      data: {
        year,
        month,
        startDate,
        endDate,
        daysInMonth,
        properties: formattedProperties,
        bookings
      }
    });
  } catch (err) {
    console.error('MySQL bookings timeline error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data timeline', error: err.message });
  }
});

// GET /api/bookings (Admin list with realtime debounce search, pagination from MySQL)
app.get('/api/bookings', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    const search = (req.query.search || '').trim();
    const status = (req.query.status || '').trim();
    const propertyId = parseInt(req.query.property_id) || 0;

    let whereConditions = ['1=1'];
    let queryParams = [];

    if (search) {
      whereConditions.push('(b.invoice_number LIKE ? OR b.guest_name LIKE ? OR b.guest_phone LIKE ? OR b.guest_email LIKE ? OR p.name LIKE ? OR b.hostex_reservation_code LIKE ?)');
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (status && status !== 'all') {
      whereConditions.push('b.payment_status = ?');
      queryParams.push(status);
    }

    if (propertyId > 0) {
      whereConditions.push('b.property_id = ?');
      queryParams.push(propertyId);
    }

    const whereClause = whereConditions.join(' AND ');

    // Total count
    const [countResult] = await dbPool.query(
      `SELECT COUNT(*) AS total FROM bookings b LEFT JOIN properties p ON b.property_id = p.id WHERE ${whereClause}`,
      queryParams
    );
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // Paginated rows
    const [rows] = await dbPool.query(
      `SELECT 
        b.*,
        p.name AS property_name,
        CONCAT(p.location, ', ', p.city) AS property_location,
        p.images AS property_images
      FROM bookings b
      LEFT JOIN properties p ON b.property_id = p.id
      WHERE ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error('MySQL bookings list error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data booking dari database', error: err.message });
  }
});

// GET /api/bookings/:identifier (Find booking by invoice or ID or phone)
app.get('/api/bookings/:identifier', async (req, res) => {
  try {
    const ident = req.params.identifier.trim();
    const isNumber = !isNaN(ident);

    const query = `
      SELECT 
        b.*,
        p.name AS property_name,
        p.building_name,
        p.unit_number,
        p.location,
        p.city,
        p.address,
        p.type,
        p.images,
        p.hostex_property_id
      FROM bookings b
      LEFT JOIN properties p ON b.property_id = p.id
      WHERE b.invoice_number = ? OR b.guest_phone = ? ${isNumber ? 'OR b.id = ?' : ''}
      LIMIT 1
    `;
    const params = isNumber ? [ident, ident, Number(ident)] : [ident, ident];

    const [rows] = await dbPool.query(query, params);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data reservasi tidak ditemukan!' });
    }

    const booking = rows[0];
    const property = {
      id: booking.property_id,
      name: booking.property_name,
      building_name: booking.building_name,
      unit_number: booking.unit_number,
      location: booking.location,
      city: booking.city,
      address: booking.address,
      type: booking.type,
      images: typeof booking.images === 'string' ? JSON.parse(booking.images || '[]') : (booking.images || []),
      hostex_property_id: booking.hostex_property_id
    };

    // Get Hostex logs for this booking
    const [logRows] = await dbPool.query(
      'SELECT * FROM hostex_logs WHERE booking_id = ? ORDER BY created_at DESC',
      [booking.id]
    );

    res.json({
      success: true,
      data: {
        ...booking,
        property,
        hostex_logs: logRows
      }
    });
  } catch (err) {
    console.error('MySQL booking detail error:', err);
    res.status(500).json({ success: false, message: 'Gagal mencari reservasi', error: err.message });
  }
});

// POST /api/bookings/:invoice_number/payment-proof (Upload receipt image)
app.post('/api/bookings/:invoice_number/payment-proof', upload.single('payment_proof'), async (req, res) => {
  try {
    const invoiceNum = req.params.invoice_number.trim();
    const [existing] = await dbPool.query('SELECT * FROM bookings WHERE invoice_number = ?', [invoiceNum]);

    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Reservasi tidak ditemukan!' });
    }

    if (!req.file && !req.body.image_url) {
      return res.status(400).json({ success: false, message: 'File gambar bukti transfer wajib diunggah!' });
    }

    const proofUrl = req.file ? `/uploads-luckystay/${req.file.filename}` : req.body.image_url;

    await dbPool.query(
      `UPDATE bookings SET payment_proof_image = ?, payment_proof_uploaded_at = NOW(), payment_status = 'waiting_approval' WHERE invoice_number = ?`,
      [proofUrl, invoiceNum]
    );

    const [updatedRows] = await dbPool.query('SELECT * FROM bookings WHERE invoice_number = ?', [invoiceNum]);

    res.json({
      success: true,
      message: 'Bukti pembayaran berhasil diunggah! Mohon menunggu verifikasi dari admin kami.',
      data: updatedRows[0]
    });
  } catch (err) {
    console.error('MySQL upload proof error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengunggah bukti pembayaran', error: err.message });
  }
});

// PUT /api/bookings/:id/approve (Admin approves booking -> Triggers Hostex API to block dates!)
app.put('/api/bookings/:id/approve', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [bookingRows] = await dbPool.query('SELECT * FROM bookings WHERE id = ?', [id]);

    if (!bookingRows || bookingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data reservasi tidak ditemukan!' });
    }

    const booking = bookingRows[0];
    const [propRows] = await dbPool.query('SELECT * FROM properties WHERE id = ?', [booking.property_id]);
    const property = propRows[0] || {};

    console.log(`🚀 Admin approving booking ${booking.invoice_number}. Syncing to Hostex...`);
    const syncResult = await syncReservationToHostex(booking, property);

    const hostexCode = syncResult.reservation_code || null;
    const syncStatus = syncResult.success ? 'synced' : 'sync_failed';
    const notes = req.body.admin_notes || (syncResult.success ? 'Disetujui admin. Kalender Hostex tertutup.' : 'Disetujui admin. Peringatan Hostex: ' + JSON.stringify(syncResult.error));

    await dbPool.query(
      `UPDATE bookings SET 
        payment_status = 'confirmed', 
        hostex_reservation_code = ?, 
        hostex_sync_status = ?, 
        hostex_synced_at = NOW(), 
        admin_notes = ? 
      WHERE id = ?`,
      [hostexCode, syncStatus, notes, id]
    );

    const [updated] = await dbPool.query('SELECT * FROM bookings WHERE id = ?', [id]);

    res.json({
      success: true,
      message: syncResult.success
        ? 'Booking berhasil disetujui & otomatis tersinkronisasi ke channel manager Hostex! Kalender telah tertutup.'
        : 'Booking disetujui secara lokal. Catatan: Respon Hostex mengalami kendala (bisa di-re-sync dari panel Hostex).',
      data: updated[0],
      hostex: syncResult
    });
  } catch (err) {
    console.error('MySQL approve booking error:', err);
    res.status(500).json({ success: false, message: 'Gagal menyetujui reservasi', error: err.message });
  }
});

// PUT /api/bookings/:id/reject (Admin rejects booking in MySQL)
app.put('/api/bookings/:id/reject', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await dbPool.query('SELECT * FROM bookings WHERE id = ?', [id]);

    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Data reservasi tidak ditemukan!' });
    }

    const reason = req.body.reason || req.body.admin_notes || 'Bukti transfer tidak valid atau unit tidak tersedia.';

    await dbPool.query(
      `UPDATE bookings SET payment_status = 'rejected', admin_notes = ? WHERE id = ?`,
      [reason, id]
    );

    const [updated] = await dbPool.query('SELECT * FROM bookings WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Booking berhasil ditolak.',
      data: updated[0]
    });
  } catch (err) {
    console.error('MySQL reject error:', err);
    res.status(500).json({ success: false, message: 'Gagal menolak booking', error: err.message });
  }
});

// POST /api/bookings/:id/hostex-sync (Manual retry sync with Hostex)
app.post('/api/bookings/:id/hostex-sync', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [bookingRows] = await dbPool.query('SELECT * FROM bookings WHERE id = ?', [id]);

    if (!bookingRows || bookingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data reservasi tidak ditemukan!' });
    }

    const booking = bookingRows[0];
    const [propRows] = await dbPool.query('SELECT * FROM properties WHERE id = ?', [booking.property_id]);
    const property = propRows[0] || {};

    const syncResult = await syncReservationToHostex(booking, property);

    if (syncResult.success) {
      await dbPool.query(
        `UPDATE bookings SET hostex_reservation_code = ?, hostex_sync_status = 'synced', hostex_synced_at = NOW() WHERE id = ?`,
        [syncResult.reservation_code, id]
      );
      const [updated] = await dbPool.query('SELECT * FROM bookings WHERE id = ?', [id]);
      res.json({ success: true, message: 'Berhasil sinkronisasi ke Hostex!', data: updated[0] });
    } else {
      await dbPool.query(
        `UPDATE bookings SET hostex_sync_status = 'sync_failed' WHERE id = ?`,
        [id]
      );
      res.status(400).json({
        success: false,
        message: 'Gagal sinkronisasi ke Hostex',
        error: syncResult.error
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error sinkronisasi Hostex', error: err.message });
  }
});

// PUT /api/bookings/:id (Admin update booking details)
app.put('/api/bookings/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await dbPool.query('SELECT * FROM bookings WHERE id = ?', [id]);

    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Data reservasi tidak ditemukan!' });
    }

    const current = existing[0];
    const {
      guest_name,
      guest_email,
      guest_phone,
      number_of_guests,
      check_in_date,
      check_out_date,
      payment_status,
      payment_method,
      special_requests,
      admin_notes,
      room_price_per_night,
      total_room_price,
      cleaning_fee,
      security_deposit,
      grand_total,
      down_payment_amount,
      rental_type
    } = req.body;

    let updateFields = [];
    let params = [];

    if (guest_name !== undefined) { updateFields.push('guest_name = ?'); params.push(String(guest_name).trim()); }
    if (guest_email !== undefined) { updateFields.push('guest_email = ?'); params.push(String(guest_email).trim()); }
    if (guest_phone !== undefined) { updateFields.push('guest_phone = ?'); params.push(String(guest_phone).trim()); }
    if (number_of_guests !== undefined) { updateFields.push('number_of_guests = ?'); params.push(Number(number_of_guests) || 1); }
    
    // Check if dates changed to recalculate total_nights
    let checkIn = current.check_in_date;
    let checkOut = current.check_out_date;
    if (check_in_date !== undefined) {
      checkIn = check_in_date;
      updateFields.push('check_in_date = ?');
      params.push(check_in_date);
    }
    if (check_out_date !== undefined) {
      checkOut = check_out_date;
      updateFields.push('check_out_date = ?');
      params.push(check_out_date);
    }
    if (check_in_date !== undefined || check_out_date !== undefined) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      updateFields.push('total_nights = ?');
      params.push(diffDays);
    }

    if (payment_status !== undefined) { updateFields.push('payment_status = ?'); params.push(payment_status); }
    if (payment_method !== undefined) { updateFields.push('payment_method = ?'); params.push(payment_method); }
    if (rental_type !== undefined) { updateFields.push('rental_type = ?'); params.push(rental_type); }
    if (down_payment_amount !== undefined) { updateFields.push('down_payment_amount = ?'); params.push(Number(down_payment_amount) || 0); }
    if (special_requests !== undefined) { updateFields.push('special_requests = ?'); params.push(special_requests ? String(special_requests).trim() : null); }
    if (admin_notes !== undefined) { updateFields.push('admin_notes = ?'); params.push(admin_notes ? String(admin_notes).trim() : null); }
    if (room_price_per_night !== undefined) { updateFields.push('room_price_per_night = ?'); params.push(Number(room_price_per_night) || 0); }
    if (total_room_price !== undefined) { updateFields.push('total_room_price = ?'); params.push(Number(total_room_price) || 0); }
    if (cleaning_fee !== undefined) { updateFields.push('cleaning_fee = ?'); params.push(Number(cleaning_fee) || 0); }
    if (security_deposit !== undefined) { updateFields.push('security_deposit = ?'); params.push(Number(security_deposit) || 0); }
    if (grand_total !== undefined) { updateFields.push('grand_total = ?'); params.push(Number(grand_total) || 0); }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada data pemesanan yang diubah.' });
    }

    params.push(id);
    await dbPool.query(`UPDATE bookings SET ${updateFields.join(', ')} WHERE id = ?`, params);

    const [updated] = await dbPool.query('SELECT * FROM bookings WHERE id = ?', [id]);
    res.json({
      success: true,
      message: 'Data pemesanan berhasil diperbarui!',
      data: updated[0]
    });
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui data pemesanan', error: err.message });
  }
});

// DELETE /api/bookings/:id (Admin delete booking)
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await dbPool.query('SELECT * FROM bookings WHERE id = ?', [id]);

    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Data reservasi tidak ditemukan!' });
    }

    // Clean up associated hostex_logs if any
    try {
      await dbPool.query('DELETE FROM hostex_logs WHERE booking_id = ?', [id]);
    } catch (logErr) {
      // Non-blocking
    }

    await dbPool.query('DELETE FROM bookings WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Data pemesanan berhasil dihapus!'
    });
  } catch (err) {
    console.error('Delete booking error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus pemesanan: ' + err.message });
  }
});

// ----------------------------------------------------
// 3. HOSTEX STATUS & CHANNEL MONITORING APIS
// ----------------------------------------------------
app.get('/api/hostex/status', async (req, res) => {
  try {
    let hostexProperties = [];
    let customChannels = [];
    let incomeMethods = [];
    let apiStatus = 'connected';
    let errorMessage = null;

    try {
      const [propRes, chanRes, incRes] = await Promise.allSettled([
        hostexClient.get('/properties', { params: { limit: 20 } }),
        hostexClient.get('/custom_channels'),
        hostexClient.get('/income_methods')
      ]);

      if (propRes.status === 'fulfilled') {
        hostexProperties = propRes.value.data?.data?.properties || [];
      } else {
        errorMessage = propRes.reason?.response?.data || propRes.reason?.message;
      }

      if (chanRes.status === 'fulfilled') {
        customChannels = chanRes.value.data?.data?.custom_channels || [];
      }

      if (incRes.status === 'fulfilled') {
        incomeMethods = incRes.value.data?.data?.income_methods || [];
      }
    } catch (testErr) {
      apiStatus = 'error';
      errorMessage = testErr.message;
    }

    // Query recent logs from MySQL hostex_logs table
    let recentLogs = [];
    try {
      const [logRows] = await dbPool.query('SELECT * FROM hostex_logs ORDER BY created_at DESC LIMIT 10');
      recentLogs = logRows;
    } catch (lErr) {
      // Table might not exist yet or empty
    }

    res.json({
      success: true,
      data: {
        status: apiStatus,
        base_url: HOSTEX_BASE_URL,
        api_key_masked: HOSTEX_API_KEY.slice(0, 6) + '...' + HOSTEX_API_KEY.slice(-6),
        hostex_properties_count: hostexProperties.length,
        hostex_properties: hostexProperties,
        custom_channels: customChannels,
        income_methods: incomeMethods,
        recent_logs: recentLogs,
        error: errorMessage
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil status Hostex', error: err.message });
  }
});

// ----------------------------------------------------
// 4. BANK ACCOUNTS & QRIS APIS (Pure MySQL)
// ----------------------------------------------------
app.get('/api/bank-accounts', async (req, res) => {
  try {
    const sanitizeAccount = (item) => ({
      ...item,
      qris_image: (!item.qris_image || item.qris_image === '[object Object]' || typeof item.qris_image !== 'string') ? null : item.qris_image
    });

    const isAdmin = req.query.admin === 'true' || req.query.page !== undefined;
    if (isAdmin) {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const search = req.query.search ? String(req.query.search).trim() : '';

      let where = [];
      let params = [];

      if (search) {
        where.push('(bank_name LIKE ? OR account_number LIKE ? OR account_holder LIKE ?)');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const whereSql = where.length ? ' WHERE ' + where.join(' AND ') : '';
      const [[{ total }]] = await dbPool.query(`SELECT COUNT(*) as total FROM bank_accounts ${whereSql}`, params);
      const [rows] = await dbPool.query(
        `SELECT * FROM bank_accounts ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      return res.json({
        success: true,
        data: rows.map(sanitizeAccount),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1
        }
      });
    }

    const [rows] = await dbPool.query('SELECT * FROM bank_accounts WHERE is_active = 1 ORDER BY id ASC');
    res.json({
      success: true,
      data: rows.map(sanitizeAccount)
    });
  } catch (err) {
    console.error('MySQL bank accounts error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data rekening', error: err.message });
  }
});

app.post('/api/bank-accounts', upload.single('qris_image'), async (req, res) => {
  try {
    const { bank_name, account_number, account_holder, instructions, is_active } = req.body;
    if (!bank_name || !account_number || !account_holder) {
      return res.status(400).json({ success: false, message: 'Nama Bank, No Rekening, dan Atas Nama wajib diisi!' });
    }

    let qris_image = null;
    if (req.file) {
      qris_image = `/uploads-luckystay/${req.file.filename}`;
    } else if (typeof req.body.qris_image === 'string' && req.body.qris_image.trim() && req.body.qris_image !== '[object Object]') {
      qris_image = req.body.qris_image.trim();
    }

    const activeVal = is_active !== undefined ? (is_active === '1' || is_active === 1 || is_active === 'true' || is_active === true ? 1 : 0) : 1;

    const [result] = await dbPool.query(
      `INSERT INTO bank_accounts (bank_name, account_number, account_holder, qris_image, instructions, is_active) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [bank_name.trim(), account_number.trim(), account_holder.trim(), qris_image, instructions ? instructions.trim() : null, activeVal]
    );

    res.json({
      success: true,
      message: 'Rekening/QRIS berhasil ditambahkan',
      data: { id: result.insertId, qris_image }
    });
  } catch (err) {
    console.error('Create bank account error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambah rekening: ' + err.message });
  }
});

app.put('/api/bank-accounts/:id', upload.single('qris_image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { bank_name, account_number, account_holder, instructions, is_active, remove_qris, is_qris } = req.body;

    let updateFields = [];
    let params = [];

    if (bank_name !== undefined) { updateFields.push('bank_name = ?'); params.push(String(bank_name).trim()); }
    if (account_number !== undefined) { updateFields.push('account_number = ?'); params.push(String(account_number).trim()); }
    if (account_holder !== undefined) { updateFields.push('account_holder = ?'); params.push(String(account_holder).trim()); }
    if (instructions !== undefined) { updateFields.push('instructions = ?'); params.push(instructions ? String(instructions).trim() : null); }
    if (is_active !== undefined) {
      const activeVal = is_active === '1' || is_active === 1 || is_active === 'true' || is_active === true ? 1 : 0;
      updateFields.push('is_active = ?');
      params.push(activeVal);
    }
    if (req.file) {
      updateFields.push('qris_image = ?');
      params.push(`/uploads-luckystay/${req.file.filename}`);
    } else if (remove_qris === 'true' || remove_qris === true || is_qris === '0' || is_qris === 'false' || is_qris === false) {
      updateFields.push('qris_image = NULL');
    } else if (typeof req.body.qris_image === 'string' && req.body.qris_image.trim() && req.body.qris_image !== '[object Object]') {
      updateFields.push('qris_image = ?');
      params.push(req.body.qris_image.trim());
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada data yang diubah.' });
    }

    params.push(id);
    await dbPool.query(`UPDATE bank_accounts SET ${updateFields.join(', ')} WHERE id = ?`, params);

    res.json({ success: true, message: 'Rekening/QRIS berhasil diperbarui' });
  } catch (err) {
    console.error('Update bank account error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui rekening: ' + err.message });
  }
});

app.delete('/api/bank-accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await dbPool.query('DELETE FROM bank_accounts WHERE id = ?', [id]);
    res.json({ success: true, message: 'Rekening/QRIS berhasil dihapus' });
  } catch (err) {
    console.error('Delete bank account error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus rekening: ' + err.message });
  }
});

// ----------------------------------------------------
// 5. CITIES / DESTINATIONS APIS
// ----------------------------------------------------
app.get('/api/cities/all', async (req, res) => {
  try {
    const [rows] = await dbPool.query('SELECT * FROM cities WHERE is_active = 1 ORDER BY is_popular DESC, name ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Fetch all cities error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data kota', error: err.message });
  }
});

app.get('/api/cities', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search ? String(req.query.search).trim() : '';
    const isActiveFilter = req.query.is_active;

    let where = [];
    let params = [];

    if (search) {
      where.push('(name LIKE ? OR province LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (isActiveFilter !== undefined && isActiveFilter !== '') {
      where.push('is_active = ?');
      params.push(isActiveFilter === '1' || isActiveFilter === 1 || isActiveFilter === 'true' ? 1 : 0);
    }

    const whereSql = where.length ? ' WHERE ' + where.join(' AND ') : '';
    const [[{ total }]] = await dbPool.query(`SELECT COUNT(*) as total FROM cities ${whereSql}`, params);
    const [rows] = await dbPool.query(
      `SELECT * FROM cities ${whereSql} ORDER BY is_popular DESC, name ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (err) {
    console.error('Fetch cities error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data kota', error: err.message });
  }
});

app.post('/api/cities', upload.single('image'), async (req, res) => {
  try {
    const { name, province, is_popular, is_active } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Nama kota wajib diisi!' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const image = req.file ? `/uploads-luckystay/${req.file.filename}` : (req.body.image || null);
    const popularVal = is_popular === '1' || is_popular === 1 || is_popular === 'true' || is_popular === true ? 1 : 0;
    const activeVal = is_active !== undefined ? (is_active === '1' || is_active === 1 || is_active === 'true' || is_active === true ? 1 : 0) : 1;

    const [result] = await dbPool.query(
      'INSERT INTO cities (name, slug, province, image, is_popular, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [name, slug, province || 'Indonesia', image, popularVal, activeVal]
    );

    res.json({
      success: true,
      message: 'Kota berhasil ditambahkan',
      data: { id: result.insertId }
    });
  } catch (err) {
    console.error('Create city error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambah kota: ' + err.message });
  }
});

app.put('/api/cities/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, province, is_popular, is_active } = req.body;

    let updateFields = [];
    let params = [];

    if (name) {
      updateFields.push('name = ?');
      params.push(name);
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      updateFields.push('slug = ?');
      params.push(slug);
    }
    if (province !== undefined) {
      updateFields.push('province = ?');
      params.push(province);
    }
    if (is_popular !== undefined) {
      const popVal = is_popular === '1' || is_popular === 1 || is_popular === 'true' || is_popular === true ? 1 : 0;
      updateFields.push('is_popular = ?');
      params.push(popVal);
    }
    if (is_active !== undefined) {
      const actVal = is_active === '1' || is_active === 1 || is_active === 'true' || is_active === true ? 1 : 0;
      updateFields.push('is_active = ?');
      params.push(actVal);
    }
    if (req.file) {
      updateFields.push('image = ?');
      params.push(`/uploads-luckystay/${req.file.filename}`);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada perubahan data.' });
    }

    params.push(id);
    await dbPool.query(`UPDATE cities SET ${updateFields.join(', ')} WHERE id = ?`, params);

    res.json({ success: true, message: 'Kota berhasil diperbarui' });
  } catch (err) {
    console.error('Update city error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui kota: ' + err.message });
  }
});

app.delete('/api/cities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await dbPool.query('DELETE FROM cities WHERE id = ?', [id]);
    res.json({ success: true, message: 'Kota berhasil dihapus' });
  } catch (err) {
    console.error('Delete city error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus kota: ' + err.message });
  }
});

// ----------------------------------------------------
// 6. PROPERTY TYPES APIS
// ----------------------------------------------------
app.get('/api/property-types/all', async (req, res) => {
  try {
    const [rows] = await dbPool.query('SELECT * FROM property_types WHERE is_active = 1 ORDER BY name ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Fetch all property types error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil tipe unit', error: err.message });
  }
});

app.get('/api/property-types', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search ? String(req.query.search).trim() : '';
    const isActiveFilter = req.query.is_active;

    let where = [];
    let params = [];

    if (search) {
      where.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (isActiveFilter !== undefined && isActiveFilter !== '') {
      where.push('is_active = ?');
      params.push(isActiveFilter === '1' || isActiveFilter === 1 || isActiveFilter === 'true' ? 1 : 0);
    }

    const whereSql = where.length ? ' WHERE ' + where.join(' AND ') : '';
    const [[{ total }]] = await dbPool.query(`SELECT COUNT(*) as total FROM property_types ${whereSql}`, params);
    const [rows] = await dbPool.query(
      `SELECT * FROM property_types ${whereSql} ORDER BY id ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (err) {
    console.error('Fetch property types error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil tipe unit', error: err.message });
  }
});

app.post('/api/property-types', async (req, res) => {
  try {
    const { name, description, is_active } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Nama tipe unit wajib diisi!' });
    }

    const activeVal = is_active !== undefined ? (is_active === '1' || is_active === 1 || is_active === 'true' || is_active === true ? 1 : 0) : 1;
    const [result] = await dbPool.query(
      'INSERT INTO property_types (name, description, is_active) VALUES (?, ?, ?)',
      [name, description || null, activeVal]
    );

    res.json({
      success: true,
      message: 'Tipe unit berhasil ditambahkan',
      data: { id: result.insertId }
    });
  } catch (err) {
    console.error('Create property type error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambah tipe unit: ' + err.message });
  }
});

app.put('/api/property-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    let updateFields = [];
    let params = [];

    if (name) { updateFields.push('name = ?'); params.push(name); }
    if (description !== undefined) { updateFields.push('description = ?'); params.push(description); }
    if (is_active !== undefined) {
      const actVal = is_active === '1' || is_active === 1 || is_active === 'true' || is_active === true ? 1 : 0;
      updateFields.push('is_active = ?');
      params.push(actVal);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada perubahan data.' });
    }

    params.push(id);
    await dbPool.query(`UPDATE property_types SET ${updateFields.join(', ')} WHERE id = ?`, params);

    res.json({ success: true, message: 'Tipe unit berhasil diperbarui' });
  } catch (err) {
    console.error('Update property type error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui tipe unit: ' + err.message });
  }
});

app.delete('/api/property-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await dbPool.query('DELETE FROM property_types WHERE id = ?', [id]);
    res.json({ success: true, message: 'Tipe unit berhasil dihapus' });
  } catch (err) {
    console.error('Delete property type error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus tipe unit: ' + err.message });
  }
});

// ----------------------------------------------------
// 7. CUSTOMER REVIEWS APIS
// ----------------------------------------------------
// Public: Get approved reviews for homepage & property detail
app.get('/api/reviews', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const propertyId = req.query.property_id;

    let sql = 'SELECT * FROM reviews WHERE is_approved = 1';
    let params = [];

    if (propertyId) {
      sql += ' AND (property_id = ? OR property_id IS NULL)';
      params.push(propertyId);
    }

    sql += ' ORDER BY rating DESC, created_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await dbPool.query(sql, params);
    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    console.error('Fetch public reviews error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil ulasan pelanggan', error: err.message });
  }
});

// Admin: Get reviews with pagination & search
app.get('/api/reviews/admin', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search ? String(req.query.search).trim() : '';
    const status = req.query.status; // 'approved', 'pending', or all

    let where = [];
    let params = [];

    if (search) {
      where.push('(user_name LIKE ? OR comment LIKE ? OR user_role_label LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status === 'approved') {
      where.push('is_approved = 1');
    } else if (status === 'pending') {
      where.push('is_approved = 0');
    }

    const whereSql = where.length ? ' WHERE ' + where.join(' AND ') : '';
    const [[{ total }]] = await dbPool.query(`SELECT COUNT(*) as total FROM reviews ${whereSql}`, params);
    const [rows] = await dbPool.query(
      `SELECT * FROM reviews ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (err) {
    console.error('Fetch admin reviews error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil ulasan admin', error: err.message });
  }
});

// Public: Post a review from guest
app.post('/api/reviews', async (req, res) => {
  try {
    const { user_name, user_role_label, rating, comment, property_id } = req.body;
    if (!user_name || !comment) {
      return res.status(400).json({ success: false, message: 'Nama dan ulasan wajib diisi!' });
    }

    const ratingVal = Math.min(5, Math.max(1, parseInt(rating) || 5));
    const roleLabel = user_role_label || 'Tamu Terverifikasi';
    // By default, approve immediately or can be set to 1 for live experience
    const isApproved = 1;

    const [result] = await dbPool.query(
      `INSERT INTO reviews (user_name, user_role_label, rating, comment, property_id, is_approved) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_name, roleLabel, ratingVal, comment, property_id || null, isApproved]
    );

    res.json({
      success: true,
      message: 'Terima kasih atas ulasan dan penilaian Anda!',
      data: { id: result.insertId }
    });
  } catch (err) {
    console.error('Submit review error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengirim ulasan: ' + err.message });
  }
});

// Admin: Post manual review
app.post('/api/reviews/admin', async (req, res) => {
  try {
    const { user_name, user_role_label, rating, comment, property_id, is_approved } = req.body;
    if (!user_name || !comment) {
      return res.status(400).json({ success: false, message: 'Nama dan isi ulasan wajib diisi!' });
    }

    const ratingVal = Math.min(5, Math.max(1, parseInt(rating) || 5));
    const roleLabel = user_role_label || 'Tamu Terverifikasi';
    const approvedVal = is_approved !== undefined ? (is_approved === '1' || is_approved === 1 || is_approved === true || is_approved === 'true' ? 1 : 0) : 1;

    const [result] = await dbPool.query(
      `INSERT INTO reviews (user_name, user_role_label, rating, comment, property_id, is_approved) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_name, roleLabel, ratingVal, comment, property_id || null, approvedVal]
    );

    res.json({
      success: true,
      message: 'Ulasan berhasil ditambahkan oleh admin',
      data: { id: result.insertId }
    });
  } catch (err) {
    console.error('Admin create review error:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat ulasan: ' + err.message });
  }
});

// Admin: Update / approve review
app.put('/api/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_name, user_role_label, rating, comment, is_approved } = req.body;

    let updateFields = [];
    let params = [];

    if (user_name !== undefined) { updateFields.push('user_name = ?'); params.push(user_name); }
    if (user_role_label !== undefined) { updateFields.push('user_role_label = ?'); params.push(user_role_label); }
    if (rating !== undefined) { updateFields.push('rating = ?'); params.push(parseInt(rating) || 5); }
    if (comment !== undefined) { updateFields.push('comment = ?'); params.push(comment); }
    if (is_approved !== undefined) {
      const actVal = is_approved === '1' || is_approved === 1 || is_approved === true || is_approved === 'true' ? 1 : 0;
      updateFields.push('is_approved = ?');
      params.push(actVal);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada perubahan ulasan.' });
    }

    params.push(id);
    await dbPool.query(`UPDATE reviews SET ${updateFields.join(', ')} WHERE id = ?`, params);

    res.json({ success: true, message: 'Ulasan berhasil diperbarui' });
  } catch (err) {
    console.error('Update review error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui ulasan: ' + err.message });
  }
});

// Admin: Delete review
app.delete('/api/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await dbPool.query('DELETE FROM reviews WHERE id = ?', [id]);
    res.json({ success: true, message: 'Ulasan berhasil dihapus' });
  } catch (err) {
    console.error('Delete review error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus ulasan: ' + err.message });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Lucky Stay Server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads served from ${uploadDir}`);
  console.log(`🏨 Hostex Integration active with Key: ${HOSTEX_API_KEY.slice(0, 8)}...`);
});
