import { Test } from '@nestjs/testing';
import { UsersService } from '../../../users/service/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../../database/entities/user.entity';
import {
  AuthGqlRedisService,
  RedisHandlerService,
} from '@tomasztrebacz/nest-auth-graphql-redis';
import {
  mockedAuthGqlRedisService,
  mockedRedisHandlerService,
} from '../../../../test/mocks';
import { sendCodePhoneResolver } from './sendCodePhone.resolver';
import { SmsService } from '../../../shared/sms/sms.service';
import { fakeUsers } from '../../../database/seeds/data/fakeUsers.data';

describe('sendCodePhoneResolver', () => {
  let resolver: sendCodePhoneResolver;
  let redisHandler: RedisHandlerService;
  let authGqlService: AuthGqlRedisService;
  let smsService: SmsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ keepConnectionAlive: true }),
        TypeOrmModule.forFeature([UserEntity]),
      ],
      providers: [
        sendCodePhoneResolver,
        UsersService,
        {
          provide: RedisHandlerService,
          useValue: mockedRedisHandlerService,
        },
        {
          provide: AuthGqlRedisService,
          useValue: mockedAuthGqlRedisService,
        },
        {
          provide: SmsService,
          useValue: {
            sendSMS: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<sendCodePhoneResolver>(sendCodePhoneResolver);
    redisHandler = module.get<RedisHandlerService>(RedisHandlerService);
    authGqlService = module.get<AuthGqlRedisService>(AuthGqlRedisService);
    smsService = module.get<SmsService>(SmsService);
  });

  it('should be defined', () => {
    expect(sendCodePhoneResolver).toBeDefined();
  });

  let errMessage = '';
  const throwError = () => {
    throw new Error(errMessage);
  };

  describe('if sms with code for resetting password has been successfully sent', () => {
    it('should return a true', async () => {
      const authGqlCreateJwtSpy = jest
        .spyOn(authGqlService, 'createJWT')
        .mockResolvedValue('someJWT');

      const redisSetUser = jest
        .spyOn(redisHandler, 'setUser')
        .mockResolvedValue(true);

      const smsSpy = jest.spyOn(smsService, 'sendSMS').mockResolvedValue(null);

      expect(
        await resolver.sendCodePhone(fakeUsers[1].phoneNumber),
      ).toBeTruthy();

      expect(authGqlCreateJwtSpy).toHaveBeenCalledTimes(1);
      expect(redisSetUser).toHaveBeenCalledTimes(1);
      expect(smsSpy).toHaveBeenCalledTimes(1);
    });
    describe('otherwise', () => {
      describe('if user with provided phone number does not exist', () => {
        it('should throw the detailed error', async () => {
          const notExistingPhone = '+48987654321';

          try {
            await resolver.sendCodePhone(notExistingPhone);
          } catch (err) {
            expect(err.message).toEqual(
              `Can not send confirmation code: Can not find user with phone: ${notExistingPhone}`,
            );
          }
        });
      });
      describe('if user does not exist in redis data store', () => {
        it('should throw the detailed error', async () => {
          const authGqlCreateJwtSpy = jest
            .spyOn(authGqlService, 'createJWT')
            .mockResolvedValue('someJWT');

          errMessage = 'Can not save data in redis data store.';

          const redisSetUser = jest
            .spyOn(redisHandler, 'setUser')
            .mockImplementation(throwError);

          try {
            await resolver.sendCodePhone(fakeUsers[1].phoneNumber);
          } catch (err) {
            expect(err.message).toEqual(
              `Can not send confirmation code: ${errMessage}`,
            );
          } finally {
            expect(authGqlCreateJwtSpy).toHaveBeenCalledTimes(2);
            expect(redisSetUser).toHaveBeenCalledTimes(2);
          }
        });
      });
      describe('if can not send sms with Twilio', () => {
        it('should throw the detailed error', async () => {
          const authGqlCreateJwtSpy = jest
            .spyOn(authGqlService, 'createJWT')
            .mockResolvedValue('someJWT');

          const redisSetUser = jest
            .spyOn(redisHandler, 'setUser')
            .mockResolvedValue(true);

          errMessage = 'Can not send SMS to your phone number.';
          const smsSpy = jest
            .spyOn(smsService, 'sendSMS')
            .mockImplementation(throwError);

          try {
            await resolver.sendCodePhone(fakeUsers[1].phoneNumber);
          } catch (err) {
            expect(err.message).toEqual(
              `Can not send confirmation code: ${errMessage}`,
            );
          } finally {
            expect(smsSpy).toHaveBeenCalled();
            expect(authGqlCreateJwtSpy).toHaveBeenCalledTimes(3);
            expect(redisSetUser).toHaveBeenCalledTimes(3);
          }
        });
      });
    });
  });
});
