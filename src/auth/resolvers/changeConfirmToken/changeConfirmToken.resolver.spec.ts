import { Test } from '@nestjs/testing';
import { UsersService } from '../../../users/service/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../../database/entities/user.entity';
import {
  AuthGqlRedisService,
  RedisHandlerService,
} from '@tomasztrebacz/nest-auth-graphql-redis';
import { changeConfirmTokenResolver } from './changeConfirmToken.resolver';
import {
  mockedAuthGqlRedisService,
  mockedRedisHandlerService,
} from '../../../utils';
import { MailService } from '../../../shared/mail/mail.service';
import { fakeUsers } from '../../../database/seeds/data/fakeUsers.data';

describe('currentUserResolver', () => {
  let resolver: changeConfirmTokenResolver;
  let redisHandler: RedisHandlerService;
  let mailService: MailService;
  let authGqlService: AuthGqlRedisService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ keepConnectionAlive: true }),
        TypeOrmModule.forFeature([UserEntity]),
      ],
      providers: [
        changeConfirmTokenResolver,
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

    resolver = module.get<changeConfirmTokenResolver>(
      changeConfirmTokenResolver,
    );
    redisHandler = module.get<RedisHandlerService>(RedisHandlerService);
    mailService = module.get<MailService>(MailService);
    authGqlService = module.get<AuthGqlRedisService>(AuthGqlRedisService);
  });

  it('should be defined', () => {
    expect(changeConfirmTokenResolver).toBeDefined();
  });

  describe('if resended mail with confirm link', () => {
    it('should return a boolean', async () => {
      const redisHandlerGetValueSpy = jest
        .spyOn(redisHandler, 'getValue')
        .mockResolvedValueOnce('false');

      const authGqlServiceCreateJWtSpy = jest
        .spyOn(authGqlService, 'createJWT')
        .mockResolvedValue('someJWT');

      const redisHandlerSetUserSpy = jest.spyOn(redisHandler, 'setUser');

      const mailServiceSendMailSpy = jest.spyOn(mailService, 'sendMail');

      expect(
        await resolver.changeConfirmToken(fakeUsers[1].email),
      ).toBeTruthy();

      expect(redisHandlerGetValueSpy).toBeCalledTimes(1);
      expect(authGqlServiceCreateJWtSpy).toBeCalledTimes(1);
      expect(redisHandlerSetUserSpy).toBeCalledTimes(1);
      expect(mailServiceSendMailSpy).toBeCalledTimes(1);
    });
  });
  describe('otherwise', () => {
    describe('if user has already been confirmed', () => {
      it('should return the detailed error', async () => {
        const redisHandlerGetValue2Spy = jest
          .spyOn(redisHandler, 'getValue')
          .mockResolvedValueOnce('true');

        try {
          await resolver.changeConfirmToken(fakeUsers[2].email);
        } catch (err) {
          expect(err.message).toEqual(
            'Can not resend confirmation link: User has been confirmed earlier.',
          );
        } finally {
          expect(redisHandlerGetValue2Spy).toBeCalledTimes(2);
        }
      });
    });
    describe('if user does not exist', () => {
      it('should return the detailed error', async () => {
        try {
          await resolver.changeConfirmToken('fake@email.com');
        } catch (err) {
          expect(err.message).toEqual(
            'Can not resend confirmation link: Wrong email!',
          );
        }
      });
    });
  });
});
