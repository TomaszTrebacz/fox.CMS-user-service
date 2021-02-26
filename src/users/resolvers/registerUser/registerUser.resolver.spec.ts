import { Test } from '@nestjs/testing';
import { UsersService } from '../../../users/service/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../../database/entities/user.entity';
import {
  AuthGqlRedisService,
  RedisHandlerService,
} from '@tomasztrebacz/nest-auth-graphql-redis';
import { registerUserResolver } from './registerUser.resolver';
import { MailService } from '../../../shared/mail/mail.service';
import { CreateUserDto } from '../../../users/dto';
import { regexPHONE, regexUUID } from '../../../utils';

describe('registerUserResolver', () => {
  let resolver: registerUserResolver;
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
        registerUserResolver,
        UsersService,
        {
          provide: RedisHandlerService,
          useValue: {
            setUser: jest.fn(),
          },
        },
        {
          provide: AuthGqlRedisService,
          useValue: {
            createJWT: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<registerUserResolver>(registerUserResolver);
    redisHandler = module.get<RedisHandlerService>(RedisHandlerService);
    authGqlService = module.get<AuthGqlRedisService>(AuthGqlRedisService);
    mailService = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(registerUserResolver).toBeDefined();
  });

  describe('if user was properly registered', () => {
    it('should return user, hash pass, save data in both databases and send confirmation mail', async () => {
      const createData: CreateUserDto = {
        email: 'something@email.com',
        firstName: 'Alina',
        lastName: 'Kowalska',
        password: 'Some Password',
        phoneNumber: '+46213456789',
      };

      const confirmJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

      const authGqlServiceCreateJWTSpy = jest
        .spyOn(authGqlService, 'createJWT')
        .mockResolvedValue(confirmJWT);

      const redisHandlerSetUserSpy = jest.spyOn(redisHandler, 'setUser');

      const mailServiceSendSpy = jest.spyOn(mailService, 'sendMail');

      expect(await resolver.registerUser(createData)).toEqual(
        expect.objectContaining({
          id: expect.stringMatching(regexUUID),
          firstName: createData.firstName,
          lastName: createData.lastName,
          password: expect.not.stringContaining(createData.password),
          phoneNumber: expect.stringMatching(regexPHONE),
          created: expect.any(Date),
          updated: expect.any(Date),
        }),
      );

      expect(authGqlServiceCreateJWTSpy).toHaveBeenCalledTimes(1);
      expect(redisHandlerSetUserSpy).toHaveBeenCalledTimes(1);
      expect(mailServiceSendSpy).toHaveBeenCalledTimes(1);
    });
  });
  describe('otherwise', () => {
    describe('if can not save data in redis database', () => {
      it('should return the detailed error', async () => {
        const createData: CreateUserDto = {
          email: 'somebody@email.com',
          firstName: 'Alina',
          lastName: 'Kowalska',
          password: 'Some Password',
          phoneNumber: '+46213456789',
        };

        const confirmJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

        const authGqlServiceCreateJWTSpy = jest
          .spyOn(authGqlService, 'createJWT')
          .mockResolvedValue(confirmJWT);

        const errMessage = 'Can not save data in redis data store';
        const throwError = () => {
          throw new Error(errMessage);
        };

        const redisHandlerSetUserSpy = jest
          .spyOn(redisHandler, 'setUser')
          .mockImplementation(throwError);

        const mailServiceSendSpy = jest.spyOn(mailService, 'sendMail');

        try {
          await resolver.registerUser(createData);
        } catch (err) {
          expect(err.message).toEqual(
            `We are sorry, ${createData.firstName} ${createData.lastName}. We can not register your account: ${errMessage}`,
          );
        } finally {
          expect(authGqlServiceCreateJWTSpy).toHaveBeenCalledTimes(1);
          expect(redisHandlerSetUserSpy).toHaveBeenCalledTimes(1);
          expect(mailServiceSendSpy).not.toHaveBeenCalled();
        }
      });
    });
    describe('if can not send mail with confirmation link', () => {
      it('should return the detailed error', async () => {
        const createData: CreateUserDto = {
          email: 'anybody@email.com',
          firstName: 'Alina',
          lastName: 'Kowalska',
          password: 'Some Password',
          phoneNumber: '+43213456789',
        };

        const confirmJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

        const authGqlServiceCreateJWTSpy = jest
          .spyOn(authGqlService, 'createJWT')
          .mockResolvedValue(confirmJWT);

        const errMessage = 'This email does not exist!';
        const throwError = () => {
          throw new Error(errMessage);
        };

        const redisHandlerSetUserSpy = jest.spyOn(redisHandler, 'setUser');

        const mailServiceSendSpy = jest
          .spyOn(mailService, 'sendMail')
          .mockImplementation(throwError);

        try {
          await resolver.registerUser(createData);
        } catch (err) {
          expect(err.message).toEqual(
            `We are sorry, ${createData.firstName} ${createData.lastName}. We can not register your account: ${errMessage}`,
          );
        } finally {
          expect(authGqlServiceCreateJWTSpy).toHaveBeenCalledTimes(1);
          expect(redisHandlerSetUserSpy).toHaveBeenCalledTimes(1);
          expect(mailServiceSendSpy).toHaveBeenCalled();
        }
      });
    });
  });
});
