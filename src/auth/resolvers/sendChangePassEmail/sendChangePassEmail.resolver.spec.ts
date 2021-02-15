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
} from '../../../utils';
import { sendChangePassEmailResolver } from './sendChangePassEmail.resolver';
import { MailService } from '../../../shared/mail/mail.service';
import { fakeUsers } from '../../../database/seeds/data/fakeUsers.data';

describe('sendChangePassEmailResolver', () => {
  let resolver: sendChangePassEmailResolver;
  let redisHandler: RedisHandlerService;
  let authGqlService: AuthGqlRedisService;
  let mailService: MailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ keepConnectionAlive: true }),
        TypeOrmModule.forFeature([UserEntity]),
      ],
      providers: [
        sendChangePassEmailResolver,
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
          provide: MailService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<sendChangePassEmailResolver>(
      sendChangePassEmailResolver,
    );
    redisHandler = module.get<RedisHandlerService>(RedisHandlerService);
    authGqlService = module.get<AuthGqlRedisService>(AuthGqlRedisService);
    mailService = module.get<MailService>(MailService);
  });

  let errMessage = '';
  const throwError = () => {
    throw new Error(errMessage);
  };

  it('should be defined', () => {
    expect(sendChangePassEmailResolver).toBeDefined();
  });

  describe('if email with link has been sucessfully sent', () => {
    it('should return a true', async () => {
      const authGqlCreateJwtSpy = jest
        .spyOn(authGqlService, 'createJWT')
        .mockResolvedValue('someJwt');

      const redisSetUserSpy = jest
        .spyOn(redisHandler, 'setUser')
        .mockResolvedValue(true);

      const mailServiceSendMail = jest
        .spyOn(mailService, 'sendMail')
        .mockResolvedValue(null);

      expect(await resolver.sendChangePassEmail(fakeUsers[5].email));

      expect(authGqlCreateJwtSpy).toHaveBeenCalledTimes(1);
      expect(redisSetUserSpy).toHaveBeenCalledTimes(1);
      expect(mailServiceSendMail).toHaveBeenCalledTimes(1);
    });
  });

  describe('otherwise', () => {
    describe('if user does not exist', () => {
      it('should throw the detailed error', async () => {
        try {
          await resolver.sendChangePassEmail('fake@email.com');
        } catch (err) {
          expect(err.message).toEqual(
            'Can not send mail with link to change password: Wrong email!',
          );
        }
      });
    });
    describe('if can not send mail', () => {
      it('should throw the detailed error', async () => {
        const authGqlCreateJwtSpy = jest
          .spyOn(authGqlService, 'createJWT')
          .mockResolvedValue('someJwt');

        const redisSetUserSpy = jest
          .spyOn(redisHandler, 'setUser')
          .mockResolvedValue(true);

        errMessage = 'Can not send mail to your email address.';
        const mailServiceSendMail = jest
          .spyOn(mailService, 'sendMail')
          .mockImplementation(throwError);

        try {
          await resolver.sendChangePassEmail(fakeUsers[5].email);
        } catch (err) {
          expect(err.message).toEqual(
            `Can not send mail with link to change password: ${errMessage}`,
          );
        } finally {
          expect(authGqlCreateJwtSpy).toHaveBeenCalledTimes(2);
          expect(redisSetUserSpy).toHaveBeenCalledTimes(2);
          expect(mailServiceSendMail).toHaveBeenCalledTimes(1);
        }
      });
    });
    describe('if user exists in postgres database, but not in redis data store', () => {
      it('should throw the detailed error', async () => {
        const authGqlCreateJwtSpy = jest
          .spyOn(authGqlService, 'createJWT')
          .mockResolvedValue('someJwt');

        errMessage = 'Can not save data in redis database.';

        const redisSetUserSpy = jest
          .spyOn(redisHandler, 'setUser')
          .mockImplementationOnce(throwError);

        try {
          await resolver.sendChangePassEmail(fakeUsers[5].email);
        } catch (err) {
          expect(err.message).toEqual(
            `Can not send mail with link to change password: ${errMessage}`,
          );
        } finally {
          expect(authGqlCreateJwtSpy).toHaveBeenCalledTimes(3);
          expect(redisSetUserSpy).toHaveBeenCalledTimes(3);
        }
      });
    });
  });
});
