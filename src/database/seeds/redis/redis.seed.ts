import { userRole } from '@tomasztrebacz/nest-auth-graphql-redis';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import { fakeUsers } from '../data/fakeUsers.data';

// npx ts-node src/database/seeds/redis/redis.seed.ts

dotenv.config();
const redis = new Redis({
  port: parseInt(process.env.REDIS_PORT),
  host: process.env.REDIS_HOST,
  db: parseInt(process.env.REDIS_DB),
});

redis
  .hmset(
    fakeUsers[0].id,
    new Map<string, string>([
      ['role', userRole.USER],
      ['count', '0'],
      ['confirmed', 'true'],
    ]),
  )
  .then(() => {
    console.log('1/7 hash saved');
  });

redis
  .hmset(
    fakeUsers[1].id,
    new Map<string, string>([
      ['role', userRole.ADMIN],
      ['count', '0'],
      ['confirmed', 'true'],
    ]),
  )
  .then(() => {
    console.log('2/7 hash saved');
  });

redis
  .hmset(
    fakeUsers[2].id,
    new Map<string, string>([
      ['role', userRole.ADMIN],
      ['count', '0'],
      ['confirmed', 'true'],
    ]),
  )
  .then(() => {
    console.log('3/7 hash saved');
  });

redis
  .hmset(
    fakeUsers[3].id,
    new Map<string, string>([
      ['role', userRole.USER],
      ['count', '0'],
      ['confirmed', 'true'],
    ]),
  )
  .then(() => {
    console.log('4/7 hash saved');
  });

redis
  .hmset(
    fakeUsers[4].id,
    new Map<string, string>([
      ['role', userRole.ROOT],
      ['count', '0'],
      ['confirmed', 'true'],
    ]),
  )
  .then(() => {
    console.log('5/7 hash saved');
  });

redis
  .hmset(
    fakeUsers[5].id,
    new Map<string, string>([
      ['role', userRole.USER],
      ['count', '0'],
      ['confirmed', 'true'],
    ]),
  )
  .then(() => {
    console.log('6/7 hash saved');
  });

redis
  .hmset(
    fakeUsers[6].id,
    new Map<string, string>([
      ['role', userRole.USER],
      ['count', '0'],
      ['confirmed', 'true'],
    ]),
  )
  .then(() => {
    console.log('7/7 hash saved');
  });

redis.quit().then(() => {
  console.log('Connection closed');
});
