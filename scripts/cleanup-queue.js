const Redis = require('ioredis');

async function cleanupQueue() {
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  });

  try {
    console.log('🧹 Starting manual queue cleanup...');

    // Get all Bull queue keys
    const queueKeys = await redis.keys('bull:application-analysis:*');
    console.log(`Found ${queueKeys.length} queue-related keys`);

    let cleanedCount = 0;
    let errors = [];

    // Clean up different types of keys
    for (const key of queueKeys) {
      try {
        const keyType = await redis.type(key);
        
        if (key.endsWith(':failed') && keyType === 'zset') {
          // Handle failed jobs (sorted set)
          const failedCount = await redis.zcard(key);
          if (failedCount > 0) {
            console.log(`Clearing ${failedCount} failed jobs from ${key}`);
            await redis.del(key);
            cleanedCount += failedCount;
          }
        } else if (key.endsWith(':completed') && keyType === 'zset') {
          // Handle completed jobs (sorted set) - keep only last 10
          const completedCount = await redis.zcard(key);
          if (completedCount > 10) {
            console.log(`Trimming completed jobs from ${completedCount} to 10 in ${key}`);
            await redis.zremrangebyrank(key, 0, completedCount - 11);
          }
        } else if (key.includes(':') && key.split(':').length >= 3) {
          // Handle individual job data
          const jobId = key.split(':').pop();
          if (jobId && !isNaN(parseInt(jobId))) {
            try {
              const jobData = await redis.hgetall(key);
              if (jobData && (jobData.failed || parseInt(jobData.attemptsMade || 0) >= 3)) {
                await redis.del(key);
                cleanedCount++;
              }
            } catch (jobError) {
              // Invalid job data, remove it
              await redis.del(key);
              cleanedCount++;
            }
          }
        }
      } catch (error) {
        errors.push(`Error processing ${key}: ${error.message}`);
      }
    }

    // Also clean up any stalled keys
    const stalledKeys = await redis.keys('bull:application-analysis:stalled');
    for (const key of stalledKeys) {
      await redis.del(key);
      cleanedCount++;
    }

    console.log(`✅ Cleanup completed:`);
    console.log(`   - Processed ${queueKeys.length} queue keys`);
    console.log(`   - Cleaned ${cleanedCount} problematic entries`);
    if (errors.length > 0) {
      console.log(`   - ${errors.length} errors occurred`);
      errors.slice(0, 3).forEach(error => console.log(`     ${error}`));
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await redis.disconnect();
  }
}

// Run the cleanup
cleanupQueue().catch(console.error);