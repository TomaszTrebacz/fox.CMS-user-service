import { Test } from '@nestjs/testing';
import { UsersService } from '../../../users/service/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../../database/entities/user.entity';
import {
  AuthGqlRedisService,
  RedisHandlerService,
} from '@tomasztrebacz/nest-auth-graphql-redis';
import { AuthService } from '../../../auth/service/auth.service';
import { MailService } from '../../../shared/mail/mail.service';
import {
  mockedAuthGqlRedisService,
  mockedRedisHandlerService,
} from '../../../../test/mocks';
import { sendChangePhoneEmailResolver } from './sendChangePhoneEmail.resolver';
import { fakeUsers } from '../../../database/seeds/data/fakeUsers.data';

describe('sendChangePhoneEmailResolver', () => {
  let resolver: sendChangePhoneEmailResolver;
  let redisHandler: RedisHandlerService;
  let authGqlService: AuthGqlRedisService;
  let usersService: UsersService;
  let mailService: MailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ keepConnectionAlive: true }),
        TypeOrmModule.forFeature([UserEntity]),
      ],
      providers: [
        sendChangePhoneEmailResolver,
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
        {
          provide: MailService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<sendChangePhoneEmailResolver>(
      sendChangePhoneEmailResolver,
    );
    redisHandler = module.get<RedisHandlerService>(RedisHandlerService);
    authGqlService = module.get<AuthGqlRedisService>(AuthGqlRedisService);
    usersService = module.get<UsersService>(UsersService);
    mailService = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(sendChangePhoneEmailResolver).toBeDefined();
  });

  describe('if link with token was send', () => {
    it('should return a boolean', async () => {
      const user = await usersService.findOneById(fakeUsers[0].id);

      const authGqlServiceCreateJwtSpy = jest.spyOn(
        authGqlService,
        'createJWT',
      );

      const redisHandlerSetUserSpy = jest.spyOn(redisHandler, 'setUser');

      const mailServiceSendMailSpy = jest.spyOn(mailService, 'sendMail');

      expect(
        await resolver.sendChangePhoneEmail(user, user.phoneNumber),
      ).toBeTruthy();

      expect(authGqlServiceCreateJwtSpy).toHaveBeenCalledTimes(1);
      expect(redisHandlerSetUserSpy).toHaveBeenCalledTimes(1);
      expect(mailServiceSendMailSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('otherwise', () => {
    describe('if can not save user in redis data store', () => {
      it('should throw the detailed error', async () => {
        const user = await usersService.findOneById(fakeUsers[0].id);

        const authGqlServiceCreateJwtSpy = jest.spyOn(
          authGqlService,
          'createJWT',
        );

        const errMessage = 'Can not save data in redis data store';
        const throwError = () => {
          throw Error(errMessage);
        };

        const redisHandlerSetUserSpy = jest
          .spyOn(redisHandler, 'setUser')
          .mockImplementationOnce(throwError);

        const mailServiceSendMailSpy = jest.spyOn(mailService, 'sendMail');

        try {
          await resolver.sendChangePhoneEmail(user, user.phoneNumber);
        } catch (err) {
          expect(err.message).toEqual(
            `We are sorry, ${user.firstName}. We can not send you email with phone change link: ${errMessage}`,
          );
        } finally {
          expect(authGqlServiceCreateJwtSpy).toHaveBeenCalled();
          expect(redisHandlerSetUserSpy).toHaveBeenCalled();
          expect(mailServiceSendMailSpy).not.toHaveBeenCalled();
        }
      });
    });
    describe('if can not send mail', () => {
      it('should throw the detailed error', async () => {
        const user = await usersService.findOneById(fakeUsers[0].id);

        const authGqlServiceCreateJwtSpy = jest.spyOn(
          authGqlService,
          'createJWT',
        );

        const redisHandlerSetUserSpy = jest.spyOn(redisHandler, 'setUser');

        const errMessage = 'Can not send mail';
        const throwError = () => {
          throw Error(errMessage);
        };

        const mailServiceSendMailSpy = jest
          .spyOn(mailService, 'sendMail')
          .mockImplementation(throwError);

        try {
          await resolver.sendChangePhoneEmail(user, user.phoneNumber);
        } catch (err) {
          expect(err.message).toEqual(
            `We are sorry, ${user.firstName}. We can not send you email with phone change link: ${errMessage}`,
          );
        } finally {
          expect(authGqlServiceCreateJwtSpy).toHaveBeenCalled();
          expect(redisHandlerSetUserSpy).toHaveBeenCalled();
          expect(mailServiceSendMailSpy).toHaveBeenCalled();
        }
      });
    });
  });
});
