const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Outlet = require('./models/Outlet');
const DeliveryRequest = require('./models/DeliveryRequest');
const AvailabilityRequest = require('./models/AvailabilityRequest');
require('dotenv').config();

async function seed() {
  try {
    console.log('🌱 Starting fresh database seed...');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await DeliveryRequest.deleteMany({});
    await AvailabilityRequest.deleteMany({});
    await User.deleteMany({});
    await Outlet.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Hash passwords
    const nishaantPassword = await bcrypt.hash('nishaant', 10);
    const krithikPassword = await bcrypt.hash('krithik', 10);
    const madhavPassword = await bcrypt.hash('madhav', 10);
    const studentPassword = await bcrypt.hash('student123', 10);
    const outletPassword = await bcrypt.hash('password123', 10);

    // ===== CREATE ADMIN ACCOUNTS =====
    const admins = await User.insertMany([
      {
        name: 'Nishaant',
        email: 'nishaant@admin.com',
        password: nishaantPassword,
        role: 'admin',
        phone: '9876543210',
        requesterRating: 0,
        delivererRating: 0
      },
      {
        name: 'Krithik',
        email: 'krithik@admin.com',
        password: krithikPassword,
        role: 'admin',
        phone: '9876543211',
        requesterRating: 0,
        delivererRating: 0
      },
      {
        name: 'Madhav',
        email: 'madhav@admin.com',
        password: madhavPassword,
        role: 'admin',
        phone: '9876543212',
        requesterRating: 0,
        delivererRating: 0
      }
    ]);
    console.log(`✅ Created ${admins.length} admin accounts`);

    // ===== CREATE OUTLET OWNER ACCOUNTS (BEFORE OUTLETS) =====
    const outletOwners = await User.insertMany([
      {
        name: 'McDonald Manager',
        email: 'canteen@outlet.com',
        password: outletPassword,
        role: 'outlet_owner',
        phone: '8000000001',
        requesterRating: 0,
        delivererRating: 0
      },
      {
        name: 'Subway Manager',
        email: 'cafe@outlet.com',
        password: outletPassword,
        role: 'outlet_owner',
        phone: '8000000002',
        requesterRating: 0,
        delivererRating: 0
      },
      {
        name: 'Dominos Manager',
        email: 'pizza@outlet.com',
        password: outletPassword,
        role: 'outlet_owner',
        phone: '8000000003',
        requesterRating: 0,
        delivererRating: 0
      }
    ]);
    console.log(`✅ Created ${outletOwners.length} outlet owner accounts`);

    // ===== CREATE OUTLETS WITH OWNERS =====
    const outlets = await Outlet.insertMany([
      { name: "McDonald's", locationDescription: 'Near Gate 1, Main Campus', owner: outletOwners[0]._id, isActive: true },
      { name: 'Subway', locationDescription: 'Food Court Building B', owner: outletOwners[1]._id, isActive: true },
      { name: 'Dominos', locationDescription: 'Business District, Next to Library', owner: outletOwners[2]._id, isActive: true },
      { name: 'Starbucks', locationDescription: 'Student Center, 2nd Floor', owner: outletOwners[0]._id, isActive: true },
      { name: 'Chai Point', locationDescription: 'Central Plaza', owner: outletOwners[1]._id, isActive: true },
    ]);
    console.log(`✅ Created ${outlets.length} outlets`);

    // ===== CREATE STUDENT ACCOUNTS =====
    const students = await User.insertMany([
      {
        name: 'Raj Kumar',
        email: 'raj@student.com',
        password: studentPassword,
        role: 'student',
        hostel: 'ANC 1',
        phone: '9000000001',
        requesterRating: 0,
        delivererRating: 0
      },
      {
        name: 'Priya Singh',
        email: 'priya@student.com',
        password: studentPassword,
        role: 'student',
        hostel: 'ANC 2',
        phone: '9000000002',
        requesterRating: 0,
        delivererRating: 0
      },
      {
        name: 'Arjun Patel',
        email: 'arjun@student.com',
        password: studentPassword,
        role: 'student',
        hostel: 'CP',
        phone: '9000000003',
        requesterRating: 0,
        delivererRating: 0
      },
      {
        name: 'Akshay Verma',
        email: 'akshay@student.com',
        password: studentPassword,
        role: 'student',
        hostel: 'Other',
        phone: '9000000004',
        requesterRating: 0,
        delivererRating: 0
      },
      {
        name: 'Zara Khan',
        email: 'zara@student.com',
        password: studentPassword,
        role: 'student',
        hostel: 'ANC 1',
        phone: '9000000005',
        requesterRating: 0,
        delivererRating: 0
      }
    ]);
    console.log(`✅ Created ${students.length} student accounts`);

    // ===== CREATE SAMPLE DELIVERY REQUESTS =====
    const deliveryRequests = await DeliveryRequest.insertMany([
      {
        itemDescription: 'Large Fries and Coke',
        outlet: outlets[0]._id,
        hostel: 'ANC 1',
        fee: 30,
        status: 'OPEN',
        requestedBy: students[0]._id,
        requesterRating: { rating: null, feedback: null, givenAt: null },
        delivererRating: { rating: null, feedback: null, givenAt: null }
      },
      {
        itemDescription: 'Vegetarian Footlong',
        outlet: outlets[1]._id,
        hostel: 'ANC 2',
        fee: 50,
        status: 'OPEN',
        requestedBy: students[1]._id,
        requesterRating: { rating: null, feedback: null, givenAt: null },
        delivererRating: { rating: null, feedback: null, givenAt: null }
      },
      {
        itemDescription: 'Veg Mania Pizza',
        outlet: outlets[2]._id,
        hostel: 'CP',
        fee: 60,
        status: 'OPEN',
        requestedBy: students[2]._id,
        requesterRating: { rating: null, feedback: null, givenAt: null },
        delivererRating: { rating: null, feedback: null, givenAt: null }
      },
      {
        itemDescription: 'Caramel Macchiato',
        outlet: outlets[3]._id,
        hostel: 'Other',
        fee: 40,
        status: 'OPEN',
        requestedBy: students[3]._id,
        requesterRating: { rating: null, feedback: null, givenAt: null },
        delivererRating: { rating: null, feedback: null, givenAt: null }
      },
      {
        itemDescription: 'Chai Latte with Cookies',
        outlet: outlets[4]._id,
        hostel: 'ANC 1',
        fee: 25,
        status: 'OPEN',
        requestedBy: students[4]._id,
        requesterRating: { rating: null, feedback: null, givenAt: null },
        delivererRating: { rating: null, feedback: null, givenAt: null }
      }
    ]);
    console.log(`✅ Created ${deliveryRequests.length} sample delivery requests`);

    console.log('\n📋 GENERATED LOGIN CREDENTIALS:\n');
    console.log('=== ADMIN ACCOUNTS ===');
    console.log('1. Email: nishaant@admin.com | Password: nishaant');
    console.log('2. Email: krithik@admin.com | Password: krithik');
    console.log('3. Email: madhav@admin.com | Password: madhav');
    console.log('\n=== STUDENT ACCOUNTS ===');
    console.log('Email: raj@student.com | Password: student123');
    console.log('Email: priya@student.com | Password: student123');
    console.log('Email: arjun@student.com | Password: student123');
    console.log('Email: akshay@student.com | Password: student123');
    console.log('Email: zara@student.com | Password: student123');
    console.log('\n=== OUTLET OWNER ACCOUNTS ===');
    console.log('Email: canteen@outlet.com | Password: password123');
    console.log('Email: cafe@outlet.com | Password: password123');
    console.log('Email: pizza@outlet.com | Password: password123');

    console.log('\n✅ Database seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
