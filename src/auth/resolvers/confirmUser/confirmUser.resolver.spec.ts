import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../../database/entities/user.entity';
import {
  AuthGqlRedisService,
  JwtPayload,
  RedisHandlerService,
  userRole,
} from '@tomasztrebacz/nest-auth-graphql-redis';
import {
  mockedAuthGqlRedisService,
  mockedRedisHandlerService,
} from '../../../utils';
import { confirmUserResolver } from './confirmUser.resolver';
import { fakeUsers } from '../../../database/seeds/data/fakeUsers.data';
import { throwError } from 'rxjs';

describe('confirmUserResolver', () => {
  let resolver: confirmUserResolver;
  let redisHandler: RedisHandlerService;
  let authGqlService: AuthGqlRedisService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ keepConnectionAlive: true }),
        TypeOrmModule.forFeature([UserEntity]),
      ],
      providers: [
        confirmUserResolver,
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

    resolver = module.get<confirmUserResolver>(confirmUserResolver);
    redisHandler = module.get<RedisHandlerService>(RedisHandlerService);
    authGqlService = module.get<AuthGqlRedisService>(AuthGqlRedisService);
  });

  it('should be defined', () => {
    expect(confirmUserResolver).toBeDefined();
  });

  const confirmToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp[..]';
  const payload: JwtPayload = {
    id: fakeUsers[3].id,
    iat: 1516239022,
    exp: 1616239022,
  };

  describe('if user has been successfully confirmed', () => {
    it('should return true', async () => {
      const authGqlVerifyTokenSpy = jest
        .spyOn(authGqlService, 'verifyToken')
        .mockResolvedValue(payload);
      const redisHandlerGetValueSpy = jest
        .spyOn(redisHandler, 'getValue')
        .mockResolvedValue(confirmToken);
      const redisHandlerSetUserSpy = jest.spyOn(redisHandler, 'setUser');
      const redisHandlerDeleteField = jest.spyOn(redisHandler, 'deleteField');

      expect(await resolver.confirmUser(confirmToken)).toEqual(true);
      expect(authGqlVerifyTokenSpy).toHaveBeenCalledTimes(1);
      expect(redisHandlerGetValueSpy).toHaveBeenCalledTimes(1);
      expect(redisHandlerDeleteField).toHaveBeenCalledTimes(1);
      expect(redisHandlerSetUserSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('otherwise', () => {
    describe('if token is not valid', () => {
      it('should throw the detailed error', async () => {
        const invalidConfirmToken = 'eyJhhGtyOiJIUzI1NiIsInR5cCI6Ikp[..]';
        const authGqlVerifyTokenSpy = jest
          .spyOn(authGqlService, 'verifyToken')
          .mockResolvedValue(payload);

        const redisHandlerGetValueSpy = jest
          .spyOn(redisHandler, 'getValue')
          .mockResolvedValue(confirmToken);

        try {
          await resolver.confirmUser(invalidConfirmToken);
        } catch (err) {
          expect(err.message).toEqual(
            'Can not confirm user: Token is not valid.',
          );
        } finally {
          expect(authGqlVerifyTokenSpy).toHaveBeenCalledTimes(2);
          expect(redisHandlerGetValueSpy).toHaveBeenCalledTimes(2);
        }
      });
    });
    describe('if token is expired', () => {
      it('should throw the detailed error', async () => {
        const errMessage = 'jwt expired.';
        const throwError = () => {
          throw new Error(errMessage);
        };
        const authGqlVerifyTokenSpy = jest
          .spyOn(authGqlService, 'verifyToken')
          .mockImplementationOnce(throwError);

        try {
          await resolver.confirmUser(confirmToken);
        } catch (err) {
          expect(err.message).toEqual(`Can not confirm user: ${errMessage}`);
        } finally {
          expect(authGqlVerifyTokenSpy).toHaveBeenCalledTimes(3);
        }
      });
    });
  });
});
