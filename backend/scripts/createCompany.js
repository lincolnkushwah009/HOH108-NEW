import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Company from '../models/Company.js';

dotenv.config();

async function createCompany() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
      console.error('No MongoDB URI found in environment');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if HOH company exists
    const existing = await Company.findOne({ code: 'HOH' });
    if (existing) {
      console.log('HOH company already exists:', existing.name);
      console.log('Company ID:', existing._id);
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create the mother company
    const company = await Company.create({
      code: 'HOH',
      name: 'House of Homes',
      type: 'mother',
      email: 'info@houseofhomes.com',
      phone: '+91-9999999999',
      address: {
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India'
      },
      services: ['Interior Design', 'Home Renovation', 'Furniture'],
      isActive: true
    });

    console.log('Company created successfully!');
    console.log('Company ID:', company._id);
    console.log('Company Code:', company.code);
    console.log('Company Name:', company.name);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

createCompany();
