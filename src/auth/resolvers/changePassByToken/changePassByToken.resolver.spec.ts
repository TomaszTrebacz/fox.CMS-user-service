import { Test } from '@nestjs/testing';
import { UsersService } from '../../../users/service/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../../database/entities/user.entity';
import {
  AuthGqlRedisService,
  JwtPayload,
  RedisHandlerService,
} from '@tomasztrebacz/nest-auth-graphql-redis';
import {
  mockedAuthGqlRedisService,
  mockedRedisHandlerService,
} from '../../../utils';
import { changePassByTokenResolver } from './changePassByToken.resolver';
import { AuthService } from '../../../auth/service/auth.service';
import { ChangePassByTokenDto } from 'src/auth/dto';
import { fakeUsers } from '../../../database/seeds/data/fakeUsers.data';

describe('changePassByTokenResolver', () => {
  let resolver: changePassByTokenResolver;
  let authService: AuthService;
  let redisHandler: RedisHandlerService;
  let authGqlService: AuthGqlRedisService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ keepConnectionAlive: true }),
        TypeOrmModule.forFeature([UserEntity]),
      ],
      providers: [
        changePassByTokenResolver,
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

    resolver = module.get<changePassByTokenResolver>(changePassByTokenResolver);
    authService = module.get<AuthService>(AuthService);
    redisHandler = module.get<RedisHandlerService>(RedisHandlerService);
    authGqlService = module.get<AuthGqlRedisService>(AuthGqlRedisService);
  });

  it('should be defined', () => {
    expect(changePassByTokenResolver).toBeDefined();
  });

  const validToken = 'gfdgfd';

  const data: ChangePassByTokenDto = {
    token: validToken,
    password: 'examplePassword1',
  };

  describe('if password was changed properly', () => {
    it('should return a boolean', async () => {
      const payload: JwtPayload = {
        id: fakeUsers[3].id,
        iat: 1516239022,
        exp: 1616239022,
      };

      const authGqlServiceVerifyTokenSpy = jest
        .spyOn(authGqlService, 'verifyToken')
        .mockResolvedValue(payload);

      const redisHandlerGetValueSpy = jest
        .spyOn(redisHandler, 'getValue')
        .mockResolvedValueOnce(validToken)
        .mockResolvedValueOnce('0');

      const redisHandlerSetUserSpy = jest.spyOn(redisHandler, 'setUser');
      const redisHandlerDeleteFieldSpy = jest.spyOn(
        redisHandler,
        'deleteField',
      );

      expect(await resolver.changePassByToken(data)).toBeTruthy();
      expect(authGqlServiceVerifyTokenSpy).toHaveBeenCalledTimes(1);
      expect(redisHandlerGetValueSpy).toHaveBeenCalledTimes(2);
      expect(redisHandlerSetUserSpy).toHaveBeenCalledTimes(1);
      expect(redisHandlerDeleteFieldSpy).toHaveBeenCalledTimes(1);
    });
  });
  describe('otherwise', () => {
    describe('if user does not exist', () => {
      it('should throw the detailed error', async () => {
        const invalidPayload: JwtPayload = {
          id: '6c106f59-fa33-4082-8932-6e6db21a8669',
          iat: 1516239022,
          exp: 1616239022,
        };

        const authGqlServiceVerifyTokenSpy = jest
          .spyOn(authGqlService, 'verifyToken')
          .mockResolvedValue(invalidPayload);

        const redisHandlerGetValueSpy = jest
          .spyOn(redisHandler, 'getValue')
          .mockResolvedValueOnce(validToken)
          .mockResolvedValueOnce('0');

        const redisHandlerSetUserSpy = jest.spyOn(redisHandler, 'setUser');
        const redisHandlerDeleteFieldSpy = jest.spyOn(
          redisHandler,
          'deleteField',
        );

        try {
          await resolver.changePassByToken(data);
        } catch (err) {
          expect(err.message).toEqual(
            `Can not change password: Can not update user with id: ${invalidPayload.id}`,
          );
        } finally {
          expect(authGqlServiceVerifyTokenSpy).toHaveBeenCalledTimes(2);
          expect(redisHandlerGetValueSpy).toHaveBeenCalledTimes(3);
          expect(redisHandlerSetUserSpy).toHaveBeenCalledTimes(1);
          expect(redisHandlerDeleteFieldSpy).toHaveBeenCalledTimes(1);
        }
      });
    });
    describe('if tokens are not matching', () => {
      it('should throw the detailed error', async () => {
        const invalidToken = 'ffsdfsdf';

        const payload: JwtPayload = {
          id: fakeUsers[3].id,
          iat: 1516239022,
          exp: 1616239022,
        };

        const authGqlServiceVerifyTokenSpy = jest
          .spyOn(authGqlService, 'verifyToken')
          .mockResolvedValue(payload);

        const redisHandlerGetValueSpy = jest
          .spyOn(redisHandler, 'getValue')
          .mockResolvedValueOnce(validToken);

        const invalidData: ChangePassByTokenDto = {
          token: invalidToken,
          password: 'examplePassword1',
        };

        try {
          await resolver.changePassByToken(invalidData);
        } catch (err) {
          expect(err.message).toEqual(
            'Can not change password: Link is not valid.',
          );
        } finally {
          expect(authGqlServiceVerifyTokenSpy).toHaveBeenCalledTimes(3);
          expect(redisHandlerGetValueSpy).toHaveBeenCalledTimes(4);
        }
      });
    });
    describe('if token expired', () => {
      it('should throw the detailed error', async () => {
        const errMessage = 'jwt expired';
        const throwError = () => {
          throw new Error(errMessage);
        };

        const authGqlServiceVerifyTokenSpy = jest
          .spyOn(authGqlService, 'verifyToken')
          .mockImplementationOnce(throwError);

        try {
          await resolver.changePassByToken(data);
        } catch (err) {
          expect(err.message).toEqual(`Can not change password: ${errMessage}`);
        } finally {
          expect(authGqlServiceVerifyTokenSpy).toHaveBeenCalledTimes(4);
        }
      });
    });
  });
});
