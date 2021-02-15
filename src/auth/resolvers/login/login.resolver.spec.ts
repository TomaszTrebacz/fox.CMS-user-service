import { Test } from '@nestjs/testing';
import { UsersService } from '../../../users/service/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../../database/entities/user.entity';
import {
  AuthGqlRedisService,
  RedisHandlerService,
  userRole,
} from '@tomasztrebacz/nest-auth-graphql-redis';
import {
  mockedAuthGqlRedisService,
  mockedRedisHandlerService,
} from '../../../../test/mocks';
import { AuthService } from '../../../auth/service/auth.service';
import { loginResolver } from './login.resolver';
import { LoginDto } from '../../../auth/dto';
import { fakeUsers } from '../../../database/seeds/data/fakeUsers.data';

describe('loginResolver', () => {
  let resolver: loginResolver;
  let redisHandler: RedisHandlerService;
  let authGqlService: AuthGqlRedisService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ keepConnectionAlive: true }),
        TypeOrmModule.forFeature([UserEntity]),
      ],
      providers: [
        loginResolver,
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

    resolver = module.get<loginResolver>(loginResolver);
    redisHandler = module.get<RedisHandlerService>(RedisHandlerService);
    authGqlService = module.get<AuthGqlRedisService>(AuthGqlRedisService);
  });

  it('should be defined', () => {
    expect(loginResolver).toBeDefined();
  });

  describe('if user provided valid data', () => {
    const accessToken = 'egfydthg67[..]';
    const refreshToken = 'eghghtf[..]';

    it('should log in and return valid response', async () => {
      const loginCredentials: LoginDto = {
        email: fakeUsers[5].email,
        password: 'KevinMoorePass',
      };

      const redisHandlerGetFieldSpy = jest
        .spyOn(redisHandler, 'getFields')
        .mockResolvedValue({
          count: '0',
          role: userRole.ADMIN,
        });

      const authGqlServiceCreateDefaultJwtSpy = jest
        .spyOn(authGqlService, 'createDefaultJWT')
        .mockResolvedValue(accessToken);

      const authGqlServiceCreateJwtSpy = jest
        .spyOn(authGqlService, 'createJWT')
        .mockResolvedValue(refreshToken);

      const redisHandlerSetUserSpy = jest
        .spyOn(redisHandler, 'setUser')
        .mockResolvedValue(true);

      expect(await resolver.login(loginCredentials)).toEqual(
        expect.objectContaining({
          user: expect.any(Object),
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          role: expect.any(String),
        }),
      );

      expect(redisHandlerGetFieldSpy).toHaveBeenCalledTimes(1);
      expect(authGqlServiceCreateDefaultJwtSpy).toHaveBeenCalledTimes(1);
      expect(authGqlServiceCreateJwtSpy).toHaveBeenCalledTimes(1);
      expect(redisHandlerSetUserSpy).toHaveBeenCalledTimes(1);
    });

    describe('if user provided uppercase email', () => {
      it('should log in and return valid response', async () => {
        const loginCredentials: LoginDto = {
          email: fakeUsers[5].email.toUpperCase(),
          password: 'KevinMoorePass',
        };

        const redisHandlerGetFieldSpy = jest
          .spyOn(redisHandler, 'getFields')
          .mockResolvedValue({
            count: '0',
            role: userRole.ADMIN,
          });

        const authGqlServiceCreateDefaultJwtSpy = jest
          .spyOn(authGqlService, 'createDefaultJWT')
          .mockResolvedValue(accessToken);

        const authGqlServiceCreateJwtSpy = jest
          .spyOn(authGqlService, 'createJWT')
          .mockResolvedValue(refreshToken);

        const redisHandlerSetUserSpy = jest
          .spyOn(redisHandler, 'setUser')
          .mockResolvedValue(true);

        expect(await resolver.login(loginCredentials)).toEqual(
          expect.objectContaining({
            user: expect.any(Object),
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
            role: expect.any(String),
          }),
        );

        expect(redisHandlerGetFieldSpy).toHaveBeenCalledTimes(2);
        expect(authGqlServiceCreateDefaultJwtSpy).toHaveBeenCalledTimes(2);
        expect(authGqlServiceCreateJwtSpy).toHaveBeenCalledTimes(2);
        expect(redisHandlerSetUserSpy).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('otherwise', () => {
    describe('if user provided invalid email', () => {
      it('should return the detailed error', async () => {
        const invalidLoginCredentials: LoginDto = {
          email: 'fake@email.com',
          password: 'JohnSmith',
        };

        try {
          await resolver.login(invalidLoginCredentials);
        } catch (err) {
          expect(err.message).toEqual('Can not sign in: Wrong email!');
        }
      });
    });
    describe('if user provided invalid password', () => {
      it('should return the detailed error', async () => {
        const invalidLoginCredentials: LoginDto = {
          email: fakeUsers[5].email,
          password: 'wrongPassword',
        };

        try {
          await resolver.login(invalidLoginCredentials);
        } catch (err) {
          expect(err.message).toEqual('Can not sign in: Wrong password!');
        }
      });
    });
  });
});
