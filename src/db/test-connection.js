import dotenv from 'dotenv';
import { testConnection, closeDatabase } from '../config/database.js';

dotenv.config();

async function runTest() {
  console.log('Testing database connection...\n');
  
  const connected = await testConnection();
  
  if (connected) {
    console.log('\n✅ Database is ready for use!');
  } else {
    console.log('\n❌ Database connection failed. Check your configuration.');
    process.exit(1);
  }
  
  await closeDatabase();
  process.exit(0);
}

runTest();