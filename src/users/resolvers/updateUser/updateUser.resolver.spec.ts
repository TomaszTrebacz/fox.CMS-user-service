import { Test } from '@nestjs/testing';
import { UsersService } from '../../../users/service/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../../database/entities/user.entity';
import { updateUserResolver } from './updateUser.resolver';
import { fakeUsers } from '../../../database/seeds/data/fakeUsers.data';
import { regexPHONE } from 'src/utils';
import { UserI } from '../../../models';

describe('currentUserResolver', () => {
  let resolver: updateUserResolver;
  let usersService: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ keepConnectionAlive: true }),
        TypeOrmModule.forFeature([UserEntity]),
      ],
      providers: [updateUserResolver, UsersService],
    }).compile();

    resolver = module.get<updateUserResolver>(updateUserResolver);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(updateUserResolver).toBeDefined();
  });

  const updateData = {
    firstName: 'newFirstName',
    lastName: 'newLastName',
  };

  describe('if user exists', () => {
    it('should return the user', async () => {
      const user = await usersService.findOneById(fakeUsers[2].id);

      const res = await resolver.updateUser(user, updateData);

      expect(res).toBeTruthy();
    });
  });

  describe('otherwise', () => {
    it('should return the error', async () => {
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
        await resolver.updateUser(nullUser, updateData);
      } catch (err) {
        expect(err.message).toEqual(
          `Can not update user with id: ${FakeNotExistID}`,
        );
      }
    });
  });
});
