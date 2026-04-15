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
    const adminPassword = await bcrypt.hash('admin123', 10);
    const studentPassword = await bcrypt.hash('student123', 10);
    const outletPassword = await bcrypt.hash('outlet123', 10);

    // ===== CREATE ADMIN ACCOUNTS =====
    const admins = await User.insertMany([
      {
        name: 'Admin One',
        email: 'admin1@campusdelivery.com',
        password: adminPassword,
        role: 'admin',
        phone: '9000000001',
        requesterRating: 0,
        delivererRating: 0
      },
      {
        name: 'Admin Two',
        email: 'admin2@campusdelivery.com',
        password: adminPassword,
        role: 'admin',
        phone: '9000000002',
        requesterRating: 0,
        delivererRating: 0
      }
    ]);
    console.log(`✅ Created ${admins.length} admin accounts`);

    // ===== CREATE OUTLETS FIRST (BEFORE OUTLET OWNERS) =====
    const outlets = await Outlet.insertMany([
      { name: "McDonald's", locationDescription: 'Main food court' },
      { name: 'Subway', locationDescription: 'Near library' },
      { name: 'Dominos', locationDescription: 'Central plaza' }
    ]);
    console.log(`✅ Created ${outlets.length} outlets`);

    // ===== CREATE OUTLET OWNER ACCOUNTS =====
    const outletOwners = await User.insertMany([
      {
        name: "McDonald's Manager",
        email: 'mcdonalds@outlet.com',
        password: outletPassword,
        role: 'outlet_owner',
        phone: '8000000001',
        outletId: outlets[0]._id,
        requesterRating: 0,
        delivererRating: 0
      },
      {
        name: 'Subway Manager',
        email: 'subway@outlet.com',
        password: outletPassword,
        role: 'outlet_owner',
        phone: '8000000002',
        outletId: outlets[1]._id,
        requesterRating: 0,
        delivererRating: 0
      },
      {
        name: 'Dominos Manager',
        email: 'dominos@outlet.com',
        password: outletPassword,
        role: 'outlet_owner',
        phone: '8000000003',
        outletId: outlets[2]._id,
        requesterRating: 0,
        delivererRating: 0
      }
    ]);
    console.log(`✅ Created ${outletOwners.length} outlet owner accounts`);

    // Update outlets with owner references
    await Outlet.findByIdAndUpdate(outlets[0]._id, { owner: outletOwners[0]._id });
    await Outlet.findByIdAndUpdate(outlets[1]._id, { owner: outletOwners[1]._id });
    await Outlet.findByIdAndUpdate(outlets[2]._id, { owner: outletOwners[2]._id });

    // ===== CREATE STUDENT ACCOUNTS =====
    const students = await User.insertMany([
      {
        name: 'Priya',
        email: 'priya@student.com',
        password: studentPassword,
        role: 'student',
        hostel: 'ANC 1',
        phone: '9100000001',
        requesterRating: 0,
        delivererRating: 0
      },
      {
        name: 'Raj',
        email: 'raj@student.com',
        password: studentPassword,
        role: 'student',
        hostel: 'ANC 2',
        phone: '9100000002',
        requesterRating: 0,
        delivererRating: 0
      },
      {
        name: 'Arjun',
        email: 'arjun@student.com',
        password: studentPassword,
        role: 'student',
        hostel: 'CP',
        phone: '9100000003',
        requesterRating: 0,
        delivererRating: 0
      },
      {
        name: 'Divya',
        email: 'divya@student.com',
        password: studentPassword,
        role: 'student',
        hostel: 'Other',
        phone: '9100000004',
        requesterRating: 0,
        delivererRating: 0
      },
      {
        name: 'Karan',
        email: 'karan@student.com',
        password: studentPassword,
        role: 'student',
        hostel: 'ANC 1',
        phone: '9100000005',
        requesterRating: 0,
        delivererRating: 0
      }
    ]);
    console.log(`✅ Created ${students.length} student accounts`);

    console.log('\n' + '='.repeat(70));
    console.log('🎓 DATABASE SEED SUMMARY - ALL ACCOUNTS & CREDENTIALS');
    console.log('='.repeat(70));

    console.log('\n✅ ADMIN ACCOUNTS (2):');
    console.log('  1. Email: admin1@campusdelivery.com | Password: admin123');
    console.log('  2. Email: admin2@campusdelivery.com | Password: admin123');

    console.log('\n✅ OUTLET OWNER ACCOUNTS (3):');
    console.log("  1. McDonald's | Email: mcdonalds@outlet.com | Password: outlet123");
    console.log('  2. Subway | Email: subway@outlet.com | Password: outlet123');
    console.log('  3. Dominos | Email: dominos@outlet.com | Password: outlet123');

    console.log('\n✅ STUDENT ACCOUNTS (5):');
    console.log('  1. Priya (ANC 1) | Email: priya@student.com | Password: student123');
    console.log('  2. Raj (ANC 2) | Email: raj@student.com | Password: student123');
    console.log('  3. Arjun (CP) | Email: arjun@student.com | Password: student123');
    console.log('  4. Divya (Other) | Email: divya@student.com | Password: student123');
    console.log('  5. Karan (ANC 1) | Email: karan@student.com | Password: student123');

    console.log('\n✅ OUTLETS IN DATABASE (3):');
    console.log("  1. McDonald's");
    console.log('  2. Subway');
    console.log('  3. Dominos');

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Database seeded successfully! Ready for testing.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
