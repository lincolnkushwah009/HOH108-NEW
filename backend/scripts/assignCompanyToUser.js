import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Company from '../models/Company.js';
import User from '../models/User.js';

dotenv.config();

async function assignCompanyToUser() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
      console.error('No MongoDB URI found in environment');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get the HOH company
    const company = await Company.findOne({ code: 'HOH' });
    if (!company) {
      console.log('HOH company not found. Please run createCompany.js first.');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('Found company:', company.name, '(', company._id, ')');

    // Find users without a company assigned
    const usersWithoutCompany = await User.find({ company: { $exists: false } });
    const usersWithNullCompany = await User.find({ company: null });

    const allUsers = [...usersWithoutCompany, ...usersWithNullCompany];

    if (allUsers.length === 0) {
      console.log('All users already have a company assigned.');

      // Show all users
      const allDbUsers = await User.find().select('name email role company');
      console.log('\nAll users in database:');
      for (const user of allDbUsers) {
        console.log(`  - ${user.name} (${user.email}) - Role: ${user.role} - Company: ${user.company || 'None'}`);
      }
    } else {
      console.log(`Found ${allUsers.length} users without a company.`);

      for (const user of allUsers) {
        user.company = company._id;
        await user.save({ validateBeforeSave: false });
        console.log(`  Assigned company to: ${user.name} (${user.email})`);
      }

      console.log('\nDone! All users now have the HOH company assigned.');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

assignCompanyToUser();
