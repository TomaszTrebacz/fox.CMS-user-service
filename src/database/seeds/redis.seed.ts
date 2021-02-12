import { userRole } from '@tomasztrebacz/nest-auth-graphql-redis';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';

// npx ts-node src/database/seeds/redis.seed.ts

dotenv.config();
const redis = new Redis({
  port: parseInt(process.env.REDIS_PORT),
  host: process.env.REDIS_HOST,
  db: parseInt(process.env.REDIS_DB),
});

redis
  .hmset(
    '8055d923-0cfd-40e9-879e-638e8ffc7475',
    new Map<string, string>([
      ['role', userRole.USER],
      ['count', '0'],
      ['confirmed', 'true'],
    ]),
  )
  .then(() => {
    console.log('1/5 hash saved');
  });

redis
  .hmset(
    'ded8dc2f-ab3b-49a5-8f14-34bf89bc20ca',
    new Map<string, string>([
      ['role', userRole.ADMIN],
      ['count', '0'],
      ['confirmed', 'true'],
    ]),
  )
  .then(() => {
    console.log('2/5 hash saved');
  });

redis
  .hmset(
    '3d248dbc-4475-46e1-8361-6273d0f1fa9c',
    new Map<string, string>([
      ['role', userRole.ADMIN],
      ['count', '0'],
      ['confirmed', 'true'],
    ]),
  )
  .then(() => {
    console.log('3/5 hash saved');
  });

redis
  .hmset(
    '4f4c1d11-816f-46fa-8a8e-575ee1ca3998',
    new Map<string, string>([
      ['role', userRole.USER],
      ['count', '0'],
      ['confirmed', 'true'],
    ]),
  )
  .then(() => {
    console.log('4/5 hash saved');
  });

redis
  .hmset(
    '2bac1170-827d-49ad-b7a3-9c76e6ad83e9',
    new Map<string, string>([
      ['role', userRole.ROOT],
      ['count', '0'],
      ['confirmed', 'true'],
    ]),
  )
  .then(() => {
    console.log('5/5 hash saved');
  });

redis.quit().then(() => {
  console.log('Connection closed');
});
