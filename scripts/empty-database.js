const mongoose = require('mongoose');
require('dotenv').config();

const clearDatabase = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully');

    // Get all collections
    const collections = await mongoose.connection.db.collections();
    
    console.log('\nWARNING: This will delete all data from the following collections:');
    collections.forEach(collection => console.log(`- ${collection.collectionName}`));
    
    // Require manual confirmation
    console.log('\nAre you sure you want to proceed? (yes/no)');
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', async (data) => {
      const input = data.trim().toLowerCase();
      
      if (input === 'yes') {
        console.log('\nEmptying collections...');
        
        // Empty each collection
        for (const collection of collections) {
          await collection.deleteMany({});
          console.log(`Emptied collection: ${collection.collectionName}`);
        }
        
        console.log('\nAll collections have been emptied successfully');
        process.exit(0);
      } else {
        console.log('Operation cancelled');
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

clearDatabase();