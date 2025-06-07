const { MongoClient } = require('mongodb');
require('dotenv').config();

async function migrateCompanies() {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.error('❌ MONGODB_URI environment variable not found');
    process.exit(1);
  }

  console.log('🚀 Starting company migration...');
  
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const companiesCollection = db.collection('companies');
    
    // Find companies that need migration
    const companiesToMigrate = await companiesCollection.find({
      $or: [
        { remainingJobs: { $exists: false } },
        { accountType: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`📊 Found ${companiesToMigrate.length} companies to migrate`);
    
    if (companiesToMigrate.length === 0) {
      console.log('✅ No companies need migration');
      return;
    }
    
    // Update companies with new fields
    const result = await companiesCollection.updateMany(
      {
        $or: [
          { remainingJobs: { $exists: false } },
          { accountType: { $exists: false } }
        ]
      },
      {
        $set: {
          remainingJobs: 5,
          accountType: 'freemium-beta'
        }
      }
    );
    
    console.log(`✅ Migration completed successfully!`);
    console.log(`📈 Updated ${result.modifiedCount} companies`);
    console.log(`📋 Companies now have:`);
    console.log(`   - remainingJobs: 5`);
    console.log(`   - accountType: 'freemium-beta'`);
    
    // Verify migration
    const verificationCount = await companiesCollection.countDocuments({
      remainingJobs: { $exists: true },
      accountType: { $exists: true }
    });
    
    const totalCompanies = await companiesCollection.countDocuments({});
    
    console.log(`🔍 Verification: ${verificationCount}/${totalCompanies} companies have the new fields`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Self-executing function with error handling
(async () => {
  try {
    await migrateCompanies();
    console.log('🎉 Migration script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
})();