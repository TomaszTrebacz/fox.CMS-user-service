import { Test } from '@nestjs/testing';
import { UsersService } from '../../../users/service/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../../database/entities/user.entity';
import { RedisHandlerService } from '@tomasztrebacz/nest-auth-graphql-redis';
import { deleteUserResolver } from './deleteUser.resolver';
import { CreateUserDto } from 'src/users/dto';
import { mockedRedisHandlerService } from '../../../../test/mocks';

describe('deleteUserResolver', () => {
  let resolver: deleteUserResolver;
  let redisHandler: RedisHandlerService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ keepConnectionAlive: true }),
        TypeOrmModule.forFeature([UserEntity]),
      ],
      providers: [
        deleteUserResolver,
        UsersService,
        {
          provide: RedisHandlerService,
          useValue: mockedRedisHandlerService,
        },
      ],
    }).compile();

    resolver = module.get<deleteUserResolver>(deleteUserResolver);
    redisHandler = module.get<RedisHandlerService>(RedisHandlerService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(deleteUserResolver).toBeDefined();
  });

  describe('if user exists', () => {
    it('should delete user from both databases and return true', async () => {
      const createData: CreateUserDto = {
        email: 'jan.kowalski@wp.pl',
        firstName: 'Jan',
        lastName: 'Kowalski',
        password: 'somePassword',
        phoneNumber: '+48720420789',
      };

      const user = await usersService.createUser(createData);

      const redisDeleteUserSpy = jest
        .spyOn(redisHandler, 'deleteUser')
        .mockResolvedValue(true);

      expect(await resolver.deleteUser(user.id)).toBeTruthy();

      expect(redisDeleteUserSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('otherwise', () => {
    const fakeNotExistId = 'b6c199ab-8a5f-4cd3-939c-d7ec93e9b37d';

    describe('user does not exist in postgres database', () => {
      it('should return the detailed error', async () => {
        try {
          await resolver.deleteUser(fakeNotExistId);
        } catch (err) {
          expect(err.message).toEqual(
            'Can not delete user data from databases: Database/ORM error.',
          );
        }
      });
    });
    describe('user does not exist in redis database', () => {
      it('should return the detailed error', async () => {
        const errMessage = 'User does not exist in redis data store';
        const throwError = () => {
          throw new Error(errMessage);
        };

        const redisDeleteUserSpy = jest
          .spyOn(redisHandler, 'deleteUser')
          .mockImplementation(throwError);

        try {
          await resolver.deleteUser(fakeNotExistId);
        } catch (err) {
          expect(err.message).toEqual(
            `Can not delete user data from databases: ${errMessage}`,
          );
        } finally {
          expect(redisDeleteUserSpy).toHaveBeenCalledTimes(3);
        }
      });
    });
  });
});
