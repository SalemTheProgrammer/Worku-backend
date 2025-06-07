# Company Migration Script

This script updates existing companies in the database to add the new `remainingJobs` and `accountType` fields.

## What it does

- Adds `remainingJobs: 5` to all existing companies
- Adds `accountType: 'freemium-beta'` to all existing companies
- Only updates companies that don't already have these fields
- Provides detailed progress and verification information

## How to run

1. **Make sure your environment variables are set up:**
   ```bash
   # Ensure your .env file has MONGODB_URI
   MONGODB_URI=mongodb://localhost:27017/your-database-name
   ```

2. **Run the migration script:**
   ```bash
   node scripts/migrate-companies.js
   ```

## Expected Output

```
🚀 Starting company migration...
✅ Connected to MongoDB
📊 Found 15 companies to migrate
✅ Migration completed successfully!
📈 Updated 15 companies
📋 Companies now have:
   - remainingJobs: 5
   - accountType: 'freemium-beta'
🔍 Verification: 15/15 companies have the new fields
🔌 Disconnected from MongoDB
🎉 Migration script completed successfully
```

## Safety Features

- **Idempotent**: Can be run multiple times safely - it only updates companies that need migration
- **Verification**: Automatically verifies the migration was successful
- **Error Handling**: Provides clear error messages if something goes wrong
- **Connection Management**: Properly closes database connections

## What happens after migration

After running this script, all existing companies will have:
- **5 remaining job slots** they can use to post new jobs
- **freemium-beta account type** which allows up to 5 job postings
- The job creation system will now properly track and enforce these limits

## Troubleshooting

### If you get "MONGODB_URI environment variable not found":
- Check your `.env` file exists in the project root
- Ensure `MONGODB_URI` is properly set in the `.env` file
- Make sure there are no typos in the variable name

### If the script fails to connect:
- Verify your MongoDB server is running
- Check the MONGODB_URI format is correct
- Ensure your MongoDB user has the necessary permissions

### If no companies are found to migrate:
- This means all companies already have the new fields
- The script can safely be run multiple times