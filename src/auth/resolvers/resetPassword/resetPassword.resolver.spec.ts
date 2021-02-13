import { Test } from '@nestjs/testing';
import { UsersService } from '../../../users/service/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../../database/entities/user.entity';
import { resetPasswordResolver } from './resetPassword.resolver';
import {
  AuthGqlRedisService,
  JwtPayload,
  RedisHandlerService,
} from '@tomasztrebacz/nest-auth-graphql-redis';
import { AuthService } from '../../../auth/service/auth.service';
import { SmsService } from '../../../shared/sms/sms.service';
import { fakeUsers } from '../../../database/seeds/data/fakeUsers.data';
import { UnauthorizedException } from '@nestjs/common';

describe('currentUserResolver', () => {
  let resolver: resetPasswordResolver;
  let redisHandler: RedisHandlerService;
  let authService: AuthService;
  let smsService: SmsService;
  let authGqlService: AuthGqlRedisService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ keepConnectionAlive: true }),
        TypeOrmModule.forFeature([UserEntity]),
      ],
      providers: [
        resetPasswordResolver,
        UsersService,
        AuthService,
        {
          provide: RedisHandlerService,
          useValue: {
            getValue: jest.fn(),
            deleteField: jest.fn(),
            setUser: jest.fn(),
          },
        },
        {
          provide: AuthGqlRedisService,
          useValue: {
            verifyToken: jest.fn(),
          },
        },
        {
          provide: SmsService,
          useValue: {
            sendSMS: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<resetPasswordResolver>(resetPasswordResolver);
    redisHandler = module.get<RedisHandlerService>(RedisHandlerService);
    authService = module.get<AuthService>(AuthService);
    smsService = module.get<SmsService>(SmsService);
    authGqlService = module.get<AuthGqlRedisService>(AuthGqlRedisService);
  });

  it('should be defined', () => {
    expect(resetPasswordResolver).toBeDefined();
  });

  describe('if phone number and code was valid', () => {
    const resetData = {
      phoneNumber: fakeUsers[6].phoneNumber,
      code: 4200,
    };

    it('should change password and return true', async () => {
      const redisHandlerGetValueSpy = jest
        .spyOn(redisHandler, 'getValue')
        .mockResolvedValueOnce('4200');

      const mockedPayload: JwtPayload = {
        id: fakeUsers[6].id,
        code: resetData.code,
        iat: 1516239022,
        exp: 1516239022,
      };

      const authGqlVerifyTokenSpy = jest
        .spyOn(authGqlService, 'verifyToken')
        .mockResolvedValue(mockedPayload);

      const redisHandlerDeleteSpy = jest
        .spyOn(redisHandler, 'deleteField')
        .mockResolvedValue(true);

      const redisHandlerAuthGetValueSpy = jest
        .spyOn(redisHandler, 'getValue')
        .mockResolvedValueOnce('0');

      const redisHandlerSetUserSpy = jest
        .spyOn(redisHandler, 'setUser')
        .mockResolvedValueOnce(true);

      const smsServiceSendSpy = jest.spyOn(smsService, 'sendSMS');

      expect(await resolver.resetPassword(resetData)).toBeTruthy();
      expect(redisHandlerGetValueSpy).toBeCalledWith(
        fakeUsers[6].id,
        'codetoken',
      );
      expect(authGqlVerifyTokenSpy).toBeCalledWith(
        '4200',
        process.env.PHONECODE_JWT_SECRET,
      );
      expect(redisHandlerDeleteSpy).toBeCalled();
      expect(redisHandlerAuthGetValueSpy).toBeCalled();
      expect(redisHandlerSetUserSpy).toBeCalledWith(
        fakeUsers[6].id,
        new Map<string, string>([['count', '1']]),
      );
      expect(smsServiceSendSpy).toBeCalled();
    });
  });

  describe('otherwise', () => {
    describe('if phone number is invalid', () => {
      const data = {
        phoneNumber: '+48667532800',
        code: 4200,
      };

      it('should return the detailed error', async () => {
        try {
          await resolver.resetPassword(data);
        } catch (err) {
          expect(err.message).toEqual(
            `Can not reset password: Can not find user with phone: ${data.phoneNumber}`,
          );
        }
      });
    });

    describe('if code was not valid', () => {
      const data = {
        phoneNumber: fakeUsers[6].phoneNumber,
        code: 4200,
      };

      it('should return the detailed error', async () => {
        const redisHandlerGetValueSpy = jest
          .spyOn(redisHandler, 'getValue')
          .mockResolvedValueOnce('1000');

        const mockedPayload: JwtPayload = {
          id: fakeUsers[6].id,
          code: 1000,
          iat: 1516239022,
          exp: 1516239022,
        };

        const authGqlVerifyTokenSpy = jest
          .spyOn(authGqlService, 'verifyToken')
          .mockResolvedValue(mockedPayload);

        try {
          await resolver.resetPassword(data);
        } catch (err) {
          expect(err.message).toEqual(`Can not reset password: Wrong code.`);
        } finally {
          expect(redisHandlerGetValueSpy).toBeCalledWith(
            fakeUsers[6].id,
            'codetoken',
          );
          expect(authGqlVerifyTokenSpy).toBeCalledWith(
            '1000',
            process.env.PHONECODE_JWT_SECRET,
          );
        }
      });
    });

    describe('if the time to change the password has passed', () => {
      const data = {
        phoneNumber: fakeUsers[6].phoneNumber,
        code: 4200,
      };

      it('should return the detailed error', async () => {
        const redisHandlerGetValueSpy = jest
          .spyOn(redisHandler, 'getValue')
          .mockResolvedValueOnce('4200');

        const throwError = () => {
          throw new UnauthorizedException('Invalid token.');
        };

        const authGqlVerifyTokenSpy = jest
          .spyOn(authGqlService, 'verifyToken')
          .mockImplementation(throwError);

        try {
          await resolver.resetPassword(data);
        } catch (err) {
          expect(err.message).toEqual('Can not reset password: Invalid token.');
        } finally {
          expect(redisHandlerGetValueSpy).toBeCalledWith(
            fakeUsers[6].id,
            'codetoken',
          );
          expect(authGqlVerifyTokenSpy).toBeCalledWith(
            '4200',
            process.env.PHONECODE_JWT_SECRET,
          );
        }
      });
    });
  });
});
