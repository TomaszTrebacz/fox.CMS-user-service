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
      id: fakeUsers[4].id,
    };

    it('should return an user', async () => {
      expect(await resolver.currentUser(User)).toEqual(
        expect.objectContaining({
          id: fakeUsers[4].id,
          firstName: fakeUsers[4].firstName,
          lastName: fakeUsers[4].lastName,
          password: fakeUsers[4].password,
          phoneNumber: fakeUsers[4].phoneNumber,
          created: expect.any(Date),
          updated: expect.any(Date),
        }),
      );
    });
  });
  describe('otherwise', () => {
    const FakeUser: Partial<UserI> = {
      id: '926d9487-339b-49d5-8660-479d48a62474',
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
