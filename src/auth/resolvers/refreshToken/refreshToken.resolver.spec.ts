import { Test } from '@nestjs/testing';
import { UsersService } from '../../../users/service/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../../database/entities/user.entity';
import { AuthService } from '../../../auth/service/auth.service';
import {
  AuthGqlRedisService,
  JwtPayload,
  RedisHandlerService,
} from '@tomasztrebacz/nest-auth-graphql-redis';
import {
  mockedAuthGqlRedisService,
  mockedRedisHandlerService,
} from '../../../../test/mocks';
import { fakeUsers } from '../../../database/seeds/data/fakeUsers.data';
import { refreshTokenResolver } from './refreshToken.resolver';

describe('refreshTokenResolver', () => {
  let resolver: refreshTokenResolver;
  let redisHandler: RedisHandlerService;
  let authGqlService: AuthGqlRedisService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ keepConnectionAlive: true }),
        TypeOrmModule.forFeature([UserEntity]),
      ],
      providers: [
        refreshTokenResolver,
        UsersService,
        AuthService,
        {
          provide: RedisHandlerService,
          useValue: mockedRedisHandlerService,
        },
        {
          provide: AuthGqlRedisService,
          useValue: mockedAuthGqlRedisService,
        },
      ],
    }).compile();

    resolver = module.get<refreshTokenResolver>(refreshTokenResolver);
    redisHandler = module.get<RedisHandlerService>(RedisHandlerService);
    authGqlService = module.get<AuthGqlRedisService>(AuthGqlRedisService);
  });

  it('should be defined', () => {
    expect(refreshTokenResolver).toBeDefined();
  });

  const payload: JwtPayload = {
    id: fakeUsers[6].id,
    count: 0,
    iat: 154568970,
    exp: 167689078,
  };

  const refreshtoken = 'ey65fjsdjisej0t5gfdi[..]';

  describe('if the whole process went successful', () => {
    it('should return new access and refresh token', async () => {
      const authGqlVerifyTokenSpy = jest
        .spyOn(authGqlService, 'verifyToken')
        .mockResolvedValue(payload);

      const redisGetFieldSpy = jest
        .spyOn(redisHandler, 'getFields')
        .mockResolvedValue({ refreshtoken: refreshtoken, count: '0' });

      const authGqlCreateDefaultJwtSpy = jest
        .spyOn(authGqlService, 'createDefaultJWT')
        .mockResolvedValue('newAccessToken');

      const authGqlCreateJwtSpy = jest
        .spyOn(authGqlService, 'createJWT')
        .mockResolvedValue('newRefreshToken');

      const redisSetUserSpy = jest
        .spyOn(redisHandler, 'setUser')
        .mockResolvedValue(true);

      expect(await resolver.refreshToken(refreshtoken)).toBeTruthy();

      expect(authGqlVerifyTokenSpy).toHaveBeenCalledTimes(1);
      expect(redisGetFieldSpy).toHaveBeenCalledTimes(1);
      expect(authGqlCreateDefaultJwtSpy).toHaveBeenCalledTimes(1);
      expect(authGqlCreateJwtSpy).toHaveBeenCalledTimes(1);
      expect(redisSetUserSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('otherwise', () => {
    describe('if jwt expired/is not valid', () => {
      it('should throw the detailed error', async () => {
        const errMessage = 'jwt expired';
        const throwError = () => {
          throw new Error(errMessage);
        };

        const authGqlVerifyTokenSpy = jest
          .spyOn(authGqlService, 'verifyToken')
          .mockImplementationOnce(throwError);

        try {
          await resolver.refreshToken('invalidToken');
        } catch (err) {
          expect(err.message).toEqual(
            `Can not send new pair of tokens: ${errMessage}`,
          );
        } finally {
          expect(authGqlVerifyTokenSpy).toHaveBeenCalledTimes(2);
        }
      });
    });
    describe('if user does not exist', () => {
      it('should throw the detailed error', async () => {
        const errMessage = 'Can not get fields from redis data store';
        const throwError = () => {
          throw new Error(errMessage);
        };

        const authGqlVerifyTokenSpy = jest
          .spyOn(authGqlService, 'verifyToken')
          .mockResolvedValue(payload);

        const redisGetFieldSpy = jest
          .spyOn(redisHandler, 'getFields')
          .mockImplementation(throwError);

        try {
          await resolver.refreshToken(refreshtoken);
        } catch (err) {
          expect(err.message).toEqual(
            `Can not send new pair of tokens: ${errMessage}`,
          );
        } finally {
          expect(authGqlVerifyTokenSpy).toHaveBeenCalledTimes(3);
          expect(redisGetFieldSpy).toHaveBeenCalledTimes(2);
        }
      });
    });
    describe('if jwts are not matching', () => {
      it('should throw the detailed error', async () => {
        const authGqlVerifyTokenSpy = jest
          .spyOn(authGqlService, 'verifyToken')
          .mockResolvedValue(payload);

        const redisGetFieldSpy = jest
          .spyOn(redisHandler, 'getFields')
          .mockResolvedValue({ refreshtoken: refreshtoken, count: '0' });

        try {
          await resolver.refreshToken('invalid refresh token');
        } catch (err) {
          expect(err.message).toEqual(
            `Can not send new pair of tokens: Validation error.`,
          );
        } finally {
          expect(authGqlVerifyTokenSpy).toHaveBeenCalledTimes(4);
          expect(redisGetFieldSpy).toHaveBeenCalledTimes(3);
        }
      });
    });
    describe('if count properties are not matching', () => {
      it('should throw the detailed error', async () => {
        const authGqlVerifyTokenSpy = jest
          .spyOn(authGqlService, 'verifyToken')
          .mockResolvedValue(payload);

        const redisGetFieldSpy = jest
          .spyOn(redisHandler, 'getFields')
          .mockResolvedValue({ refreshtoken: refreshtoken, count: '1' });

        try {
          await resolver.refreshToken(refreshtoken);
        } catch (err) {
          expect(err.message).toEqual(
            `Can not send new pair of tokens: Validation error.`,
          );
        } finally {
          expect(authGqlVerifyTokenSpy).toHaveBeenCalledTimes(5);
          expect(redisGetFieldSpy).toHaveBeenCalledTimes(4);
        }
      });
    });
  });
});
