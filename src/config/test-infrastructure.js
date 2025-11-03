import { env } from './env.js';
import { testConnection, closeDatabase } from './database.js';
import { connectRedis, disconnectRedis, redis } from './redis.js';
import { logger } from '../utils/logger.js';
import { generateJoinCode } from '../utils/joinCode.js';
import { generateFingerprint } from '../utils/fingerprint.js';
import { hashPassword, comparePassword } from '../utils/hash.js';

async function testInfrastructure() {
  console.log('\n🧪 Testing Infrastructure...\n');

  // Test 1: Environment Variables
  console.log('1️⃣ Testing Environment Configuration...');
  logger.info('Environment loaded successfully', {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
  });

  // Test 2: Database Connection
  console.log('\n2️⃣ Testing Database Connection...');
  const dbConnected = await testConnection();
  if (!dbConnected) {
    process.exit(1);
  }

  // Test 3: Redis Connection
  console.log('\n3️⃣ Testing Redis Connection...');
  const redisConnected = await connectRedis();
  if (!redisConnected) {
    process.exit(1);
  }

  // Test 4: Redis Operations
  console.log('\n4️⃣ Testing Redis Operations...');
  try {
    await redis.set('test:key', 'test-value', 10);
    const value = await redis.get('test:key');
    console.log('✅ Redis SET/GET works:', value === 'test-value');

    await redis.setJSON('test:json', { foo: 'bar' }, 10);
    const jsonValue = await redis.getJSON('test:json');
    console.log('✅ Redis JSON operations work:', jsonValue.foo === 'bar');

    await redis.del('test:key');
    await redis.del('test:json');
  } catch (error) {
    console.error('❌ Redis operations failed:', error.message);
  }

  // Test 5: Logger
  console.log('\n5️⃣ Testing Logger...');
  logger.info('Info log test');
  logger.warn('Warning log test');
  logger.error('Error log test');
  logger.debug('Debug log test');
  console.log('✅ Logger works');

  // Test 6: Join Code Generator
  console.log('\n6️⃣ Testing Join Code Generator...');
  const code1 = generateJoinCode();
  const code2 = generateJoinCode();
  console.log('Generated codes:', code1, code2);
  console.log('✅ Join codes are unique:', code1 !== code2);
  console.log('✅ Join code length:', code1.length === env.JOIN_CODE_LENGTH);

  // Test 7: Fingerprint Generator
  console.log('\n7️⃣ Testing Fingerprint Generator...');
  const fp1 = generateFingerprint('192.168.1.1', 'Mozilla/5.0', 'session-123');
  const fp2 = generateFingerprint('192.168.1.1', 'Mozilla/5.0', 'session-123');
  const fp3 = generateFingerprint('192.168.1.2', 'Mozilla/5.0', 'session-123');
  console.log('✅ Same input = same fingerprint:', fp1 === fp2);
  console.log('✅ Different input = different fingerprint:', fp1 !== fp3);
  console.log('✅ Fingerprint length:', fp1.length === 64);

  // Test 8: Password Hashing
  console.log('\n8️⃣ Testing Password Hashing...');
  const password = 'Test@1234';
  const hash = await hashPassword(password);
  const isValid = await comparePassword(password, hash);
  const isInvalid = await comparePassword('wrong', hash);
  console.log('✅ Password hashing works:', isValid && !isInvalid);

  // Cleanup
  console.log('\n🧹 Cleaning up...');
  await closeDatabase();
  await disconnectRedis();

  console.log('\n✅ All infrastructure tests passed!\n');
  process.exit(0);
}

testInfrastructure().catch((error) => {
  console.error('\n❌ Infrastructure test failed:', error);
  process.exit(1);
});