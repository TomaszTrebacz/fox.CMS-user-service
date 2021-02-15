import { Test } from '@nestjs/testing';
import { UsersService } from '../../../users/service/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../../database/entities/user.entity';
import { changePasswordResolver } from './changePassword.resolver';
import { AuthService } from '../../../auth/service/auth.service';
import { RedisHandlerService } from '@tomasztrebacz/nest-auth-graphql-redis';
import { mockedRedisHandlerService } from '../../../../test/mocks';
import { fakeUsers } from '../../../database/seeds/data/fakeUsers.data';
import { UserI } from '../../../models';

describe('changePasswordResolver', () => {
  let resolver: changePasswordResolver;
  let usersService: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ keepConnectionAlive: true }),
        TypeOrmModule.forFeature([UserEntity]),
      ],
      providers: [
        changePasswordResolver,
        UsersService,
        AuthService,
        {
          provide: RedisHandlerService,
          useValue: mockedRedisHandlerService,
        },
      ],
    }).compile();

    resolver = module.get<changePasswordResolver>(changePasswordResolver);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(changePasswordResolver).toBeDefined();
  });

  describe('if password changed', () => {
    it('should return a boolean', async () => {
      const user = await usersService.findOneById(fakeUsers[3].id);

      expect(
        await resolver.changePassword(user, 'examplePassword1'),
      ).toBeTruthy();
    });
  });
  describe('otherwise', () => {
    describe('if user does not exist', () => {
      it('should throw the detailed error', async () => {
        const FakeNotExistID = '948091ae-9cb7-4770-90ab-f058f66ee5c7';
        const nullUser: UserI = {
          id: FakeNotExistID,
          email: 'not@email.com',
          firstName: 'notName',
          lastName: 'notName',
          password: 'notPassword',
          phoneNumber: 'notPhoneNumber',
          created: new Date(),
          updated: new Date(),
        };

        try {
          await resolver.changePassword(nullUser, 'examplePassword1');
        } catch (err) {
          expect(err.message).toEqual(
            `Can not update user with id: ${FakeNotExistID}`,
          );
        }
      });
    });
  });
});
