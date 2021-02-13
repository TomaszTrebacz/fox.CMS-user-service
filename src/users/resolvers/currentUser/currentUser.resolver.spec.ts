import { Test } from '@nestjs/testing';
import { UsersService } from '../../../users/service/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../../database/entities/user.entity';
import { fakeUsers } from '../../../database/seeds/data/fakeUsers.data';
import { currentUserResolver } from './currentUser.resolver';
import { UserI } from 'src/models';

describe('currentUserResolver', () => {
  let resolver: currentUserResolver;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ keepConnectionAlive: true }),
        TypeOrmModule.forFeature([UserEntity]),
      ],
      providers: [currentUserResolver, UsersService],
    }).compile();

    resolver = module.get<currentUserResolver>(currentUserResolver);
  });

  it('should be defined', () => {
    expect(currentUserResolver).toBeDefined();
  });

  describe('if id exists in database', () => {
    const User: Partial<UserI> = {
      id: fakeUsers[0].id,
    };

    it('should return an user', async () => {
      expect(await resolver.currentUser(User)).toEqual(
        expect.objectContaining({
          id: fakeUsers[0].id,
          firstName: fakeUsers[0].firstName,
          lastName: fakeUsers[0].lastName,
          password: fakeUsers[0].password,
          phoneNumber: fakeUsers[0].phoneNumber,
          created: expect.any(Date),
          updated: expect.any(Date),
        }),
      );
    });
  });
  describe('otherwise', () => {
    const FakeUser: Partial<UserI> = {
      id: '7a01351b-1137-41bb-b3ec-fbad2b098f51',
    };

    it('should return the detailed error', async () => {
      try {
        expect(await resolver.currentUser(FakeUser));
      } catch (err) {
        expect(err.message).toEqual(
          `Can not find user with id: ${FakeUser.id}`,
        );
      }
    });
  });
});
