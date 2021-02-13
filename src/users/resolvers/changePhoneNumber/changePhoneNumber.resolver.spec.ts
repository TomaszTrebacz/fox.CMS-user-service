import { Test } from '@nestjs/testing';
import { UsersService } from '../../../users/service/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../../database/entities/user.entity';
import {
  AuthGqlRedisService,
  JwtPayload,
  RedisHandlerService,
} from '@tomasztrebacz/nest-auth-graphql-redis';
import { changePhoneNumberResolver } from './changePhoneNumber.resolver';
import { fakeUsers } from '../../../database/seeds/data/fakeUsers.data';

describe('changePhoneNumberResolver', () => {
  let resolver: changePhoneNumberResolver;
  let redisHandler: RedisHandlerService;
  let authGqlService: AuthGqlRedisService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ keepConnectionAlive: true }),
        TypeOrmModule.forFeature([UserEntity]),
      ],
      providers: [
        changePhoneNumberResolver,
        UsersService,
        {
          provide: RedisHandlerService,
          useValue: {
            getValue: jest.fn(),
            deleteField: jest.fn(),
          },
        },
        {
          provide: AuthGqlRedisService,
          useValue: {
            verifyToken: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<changePhoneNumberResolver>(changePhoneNumberResolver);
    redisHandler = module.get<RedisHandlerService>(RedisHandlerService);
    authGqlService = module.get<AuthGqlRedisService>(AuthGqlRedisService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(changePhoneNumberResolver).toBeDefined();
  });

  const token = 'someFakeToken';
  const newPhoneNumber = '+48602245605';
  const mockedPayload: JwtPayload = {
    id: fakeUsers[6].id,
    data: newPhoneNumber,
    iat: 1516239022,
    exp: 1516239022,
  };

  describe('if the token is valid', () => {
    it('should change the password and return true', async () => {
      const authVerifyTokenSpy = jest
        .spyOn(authGqlService, 'verifyToken')
        .mockResolvedValueOnce(mockedPayload);

      const redisGetValueSpy = jest
        .spyOn(redisHandler, 'getValue')
        .mockResolvedValue(token);

      const redisDeleteField = jest
        .spyOn(redisHandler, 'deleteField')
        .mockResolvedValue(true);

      const usersServiceUpdateSpy = jest.spyOn(usersService, 'updateUser');

      expect(await resolver.changePhoneNumber(token)).toBeTruthy();

      const updatedPhoneNumber = await usersService.findOneByPhoneNumber(
        newPhoneNumber,
        false,
      );
      expect(updatedPhoneNumber).not.toBeUndefined();
      expect(authVerifyTokenSpy).toHaveBeenCalledTimes(1);
      expect(redisGetValueSpy).toHaveBeenCalledTimes(1);
      expect(redisDeleteField).toHaveBeenCalledTimes(1);
      expect(usersServiceUpdateSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('otherwise', () => {
    describe('if the token is not valid', () => {
      it('should return the detailed error', async () => {
        const authVerifyTokenSpy = jest
          .spyOn(authGqlService, 'verifyToken')
          .mockResolvedValueOnce(mockedPayload);

        const redisGetValueSpy = jest
          .spyOn(redisHandler, 'getValue')
          .mockResolvedValue('invalidtoken');

        const redisDeleteFieldSpy = jest.spyOn(redisHandler, 'deleteField');
        const usersServiceUpdateSpy = jest.spyOn(usersService, 'updateUser');

        try {
          await resolver.changePhoneNumber(token);
        } catch (err) {
          expect(err.message).toEqual('Link is not valid.');
        }

        expect(authVerifyTokenSpy).toHaveBeenCalledTimes(1);
        expect(redisGetValueSpy).toHaveBeenCalledTimes(1);
        expect(redisDeleteFieldSpy).not.toHaveBeenCalled();
        expect(usersServiceUpdateSpy).not.toHaveBeenCalled();
      });
    });
    describe('if the token is expired', () => {
      it('should return the detailed error', async () => {
        const errMessage = 'JWT expired.';
        const throwError = () => {
          throw new Error(errMessage);
        };
        const authVerifyTokenSpy = jest
          .spyOn(authGqlService, 'verifyToken')
          .mockImplementation(throwError);

        const redisGetValueSpy = jest.spyOn(redisHandler, 'getValue');
        const redisDeleteFieldSpy = jest.spyOn(redisHandler, 'deleteField');
        const usersServiceUpdateSpy = jest.spyOn(usersService, 'updateUser');

        try {
          await resolver.changePhoneNumber(token);
        } catch (err) {
          expect(err.message).toEqual(errMessage);
        }

        expect(authVerifyTokenSpy).toHaveBeenCalledTimes(1);
        expect(redisGetValueSpy).not.toHaveBeenCalled();
        expect(redisDeleteFieldSpy).not.toHaveBeenCalled();
        expect(usersServiceUpdateSpy).not.toHaveBeenCalled();
      });
    });
  });
});
