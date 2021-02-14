import { Test } from '@nestjs/testing';
import { UsersService } from '../../../users/service/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../../database/entities/user.entity';
import { AuthService } from '../../../auth/service/auth.service';
import { RedisHandlerService } from '@tomasztrebacz/nest-auth-graphql-redis';
import { mockedRedisHandlerService } from '../../../utils';
import { logoutResolver } from './logout.resolver';
import { fakeUsers } from '../../../database/seeds/data/fakeUsers.data';

describe('logoutResolver', () => {
  let resolver: logoutResolver;
  let redisHandler: RedisHandlerService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ keepConnectionAlive: true }),
        TypeOrmModule.forFeature([UserEntity]),
      ],
      providers: [
        logoutResolver,
        UsersService,
        AuthService,
        {
          provide: RedisHandlerService,
          useValue: mockedRedisHandlerService,
        },
      ],
    }).compile();

    resolver = module.get<logoutResolver>(logoutResolver);
    redisHandler = module.get<RedisHandlerService>(RedisHandlerService);
  });

  it('should be defined', () => {
    expect(logoutResolver).toBeDefined();
  });

  describe('if user has been successfully logged out', () => {
    it('should return true', async () => {
      const redisHandlerDeleteFieldSpy = jest
        .spyOn(redisHandler, 'deleteField')
        .mockResolvedValueOnce(true);

      expect(await resolver.logout(fakeUsers[6].id)).toBeTruthy();
      expect(redisHandlerDeleteFieldSpy).toHaveBeenCalledTimes(1);
    });
  });
  describe('otherwise', () => {
    it('should throw the detailed error', async () => {
      const errMessage = 'Can not delete field from redis data store';
      const throwError = () => {
        throw new Error(errMessage);
      };
      const redisHandlerDeleteFieldSpy = jest
        .spyOn(redisHandler, 'deleteField')
        .mockImplementationOnce(throwError);

      try {
        const notExistingID = '19e12dc4-a537-4f22-8b34-2487b55fe02f';

        await resolver.logout(notExistingID);
      } catch (err) {
        expect(err.message).toEqual(`Can not log out: ${errMessage}`);
      } finally {
        expect(redisHandlerDeleteFieldSpy).toHaveBeenCalledTimes(2);
      }
    });
  });
});
