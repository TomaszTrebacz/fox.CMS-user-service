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
} from '../../../utils';
import { AuthService } from '../../../auth/service/auth.service';
import { loginResolver } from './login.resolver';
import { LoginResponse, User } from '../../../graphql';
import { LoginDto } from '../../../auth/dto';
import { fakeUsers } from '../../../database/seeds/data/fakeUsers.data';
import { ExtendedUserI, RedisUserI } from 'src/models';

describe('loginResolver', () => {
  let resolver: loginResolver;
  let authService: AuthService;
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
    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    redisHandler = module.get<RedisHandlerService>(RedisHandlerService);
    authGqlService = module.get<AuthGqlRedisService>(AuthGqlRedisService);
  });

  it('should be defined', () => {
    expect(loginResolver).toBeDefined();
  });

  describe('if user provided valid data', () => {
    const accessToken = 'dwaads';
    const refreshToken = 'dsawdwa';

    it('should log in and return valid response', async () => {
      const loginCredentials: LoginDto = {
        email: fakeUsers[5].email,
        password: 'JohnSmith',
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
          password: 'JohnSmith',
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
