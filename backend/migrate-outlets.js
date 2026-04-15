const mongoose = require('mongoose');
const User = require('./models/User');
const Outlet = require('./models/Outlet');
const bcrypt = require('bcryptjs');

// Connect to MongoDB Atlas
const MONGO_URI = 'mongodb+srv://nishaant007:nishaant123%40db@cluster0.u9rws7d.mongodb.net/campus_delivery?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    try {
      // Clear existing outlets
      await Outlet.deleteMany({});
      console.log('🗑️  Cleared existing outlets');

      // Get or create outlet owners
      const outletOwners = [];

      // Check if outlet owners exist, if not create them
      let owner1 = await User.findOne({ email: 'canteen@outlet.com' });
      if (!owner1) {
        const salt = await bcrypt.genSalt(10);
        owner1 = new User({
          name: 'Central Canteen',
          email: 'canteen@outlet.com',
          password: await bcrypt.hash('password123', salt),
          role: 'outlet_owner',
          phone: '9876543211',
          hostel: null
        });
        await owner1.save();
        console.log('✅ Created Central Canteen outlet owner');
      }
      outletOwners.push(owner1);

      let owner2 = await User.findOne({ email: 'cafe@outlet.com' });
      if (!owner2) {
        const salt = await bcrypt.genSalt(10);
        owner2 = new User({
          name: 'Campus Cafe',
          email: 'cafe@outlet.com',
          password: await bcrypt.hash('password123', salt),
          role: 'outlet_owner',
          phone: '9876543212',
          hostel: null
        });
        await owner2.save();
        console.log('✅ Created Campus Cafe outlet owner');
      }
      outletOwners.push(owner2);

      let owner3 = await User.findOne({ email: 'pizza@outlet.com' });
      if (!owner3) {
        const salt = await bcrypt.genSalt(10);
        owner3 = new User({
          name: 'Pizza Hub',
          email: 'pizza@outlet.com',
          password: await bcrypt.hash('password123', salt),
          role: 'outlet_owner',
          phone: '9876543213',
          hostel: null
        });
        await owner3.save();
        console.log('✅ Created Pizza Hub outlet owner');
      }
      outletOwners.push(owner3);

      // Create outlets linked to owners
      const outlets = [
        {
          name: 'Central Canteen',
          locationDescription: 'Building A, Ground Floor',
          owner: outletOwners[0]._id
        },
        {
          name: 'Campus Cafe',
          locationDescription: 'Near Library, First Floor',
          owner: outletOwners[1]._id
        },
        {
          name: 'Pizza Hub',
          locationDescription: 'Food Court, Block C',
          owner: outletOwners[2]._id
        }
      ];

      const createdOutlets = [];
      for (const outletData of outlets) {
        const outlet = new Outlet(outletData);
        await outlet.save();
        createdOutlets.push(outlet);
        console.log(`✅ Created outlet: ${outlet.name}`);
      }

      // Update owners with their outlet IDs
      for (let i = 0; i < outletOwners.length; i++) {
        outletOwners[i].outletId = createdOutlets[i]._id;
        await outletOwners[i].save();
        console.log(`✅ Linked ${outletOwners[i].name} to ${createdOutlets[i].name}`);
      }

      console.log('\n✅ Database migration completed successfully!');
      console.log('\nOutlet Owners created:');
      console.log('1. Central Canteen - canteen@outlet.com / password123');
      console.log('2. Campus Cafe - cafe@outlet.com / password123');
      console.log('3. Pizza Hub - pizza@outlet.com / password123');

      process.exit(0);
    } catch (error) {
      console.error('❌ Migration error:', error.message);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
