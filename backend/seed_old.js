const mongoose = require('mongoose');
const User = require('./models/User');
const Outlet = require('./models/Outlet');
const DeliveryRequest = require('./models/DeliveryRequest');
const AvailabilityRequest = require('./models/AvailabilityRequest');
require('dotenv').config();

async function seed() {
  try {
    console.log('🌱 Starting database seed...');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await DeliveryRequest.deleteMany({});
    await AvailabilityRequest.deleteMany({});
    await User.deleteMany({});
    await Outlet.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create outlets
    const outlets = await Outlet.insertMany([
      { name: 'McDonald\'s', locationDescription: 'Near Gate 1, Main Campus' },
      { name: 'Subway', locationDescription: 'Food Court Building B' },
      { name: 'Dominos', locationDescription: 'Business District, Next to Library' },
      { name: 'Starbucks', locationDescription: 'Student Center, 2nd Floor' },
      { name: 'Chai Point', locationDescription: 'Central Plaza' },
    ]);
    console.log(`✅ Created ${outlets.length} outlets`);

    // Create users - STUDENT
    const student1 = await User.create({
      name: 'Raj Kumar',
      role: 'STUDENT',
      hostel: 'Hostel A',
    });

    const student2 = await User.create({
      name: 'Priya Singh',
      role: 'STUDENT',
      hostel: 'Hostel B',
    });

    const student3 = await User.create({
      name: 'Arjun Patel',
      role: 'STUDENT',
      hostel: 'Hostel C',
    });

    // Create users - OUTLET_OWNER
    const outletOwner1 = await User.create({
      name: 'Mohini (McDonald\'s Manager)',
      role: 'OUTLET_OWNER',
      hostel: 'Main Campus',
    });

    const outletOwner2 = await User.create({
      name: 'Vikram (Dominos Manager)',
      role: 'OUTLET_OWNER',
      hostel: 'Main Campus',
    });

    console.log('✅ Created 5 users (3 STUDENT, 2 OUTLET_OWNER)');

    // Create delivery requests
    const deliveryRequests = await DeliveryRequest.insertMany([
      {
        itemDescription: 'Chicken Burger Combo',
        outlet: 'ANC 1',
        hostel: 'Hostel A',
        fee: 50,
        status: 'OPEN',
        requestedBy: student1._id,
      },
      {
        itemDescription: 'Margherita Pizza',
        outlet: 'ANC 2',
        hostel: 'Hostel B',
        fee: 80,
        status: 'OPEN',
        requestedBy: student2._id,
      },
      {
        itemDescription: 'Cold Coffee',
        outlet: 'CP',
        hostel: 'Hostel C',
        fee: 30,
        status: 'OPEN',
        requestedBy: student3._id,
      },
      {
        itemDescription: 'Momo Box (6pc)',
        outlet: 'ANC 1',
        hostel: 'Hostel A',
        fee: 60,
        status: 'IN_PROGRESS',
        requestedBy: student1._id,
        acceptedBy: student2._id,
      },
      {
        itemDescription: 'Biryani Box',
        outlet: 'Other',
        hostel: 'Hostel B',
        fee: 100,
        status: 'COMPLETED',
        requestedBy: student2._id,
        acceptedBy: student1._id,
      },
    ]);
    console.log(`✅ Created ${deliveryRequests.length} delivery requests`);

    // Create availability requests
    const availabilityRequests = await AvailabilityRequest.insertMany([
      {
        item: 'Veg Biryani',
        outlet: outlets[0]._id.toString(),
        requestedBy: student1._id,
        status: 'PENDING',
        outletOwner: outletOwner1._id,
      },
      {
        item: 'Paneer Tikka',
        outlet: outlets[2]._id.toString(),
        requestedBy: student2._id,
        status: 'AVAILABLE',
        outletOwner: outletOwner2._id,
      },
      {
        item: 'Garlic Bread',
        outlet: outlets[0]._id.toString(),
        requestedBy: student3._id,
        status: 'PENDING',
        outletOwner: outletOwner1._id,
      },
      {
        item: 'Chocolate Cake Slice',
        outlet: outlets[3]._id.toString(),
        requestedBy: student1._id,
        status: 'NOT_AVAILABLE',
        outletOwner: null,
      },
    ]);
    console.log(`✅ Created ${availabilityRequests.length} availability requests`);

    console.log('\n✨ Database seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   📍 Outlets: ${outlets.length}`);
    console.log(`   👥 Users: 5 (3 STUDENT, 2 OUTLET_OWNER)`);
    console.log(`   🚚 Delivery Requests: ${deliveryRequests.length}`);
    console.log(`   ❓ Availability Requests: ${availabilityRequests.length}`);
    console.log('\n🔑 Demo User ID for testing:');
    console.log(`   ${student1._id}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
