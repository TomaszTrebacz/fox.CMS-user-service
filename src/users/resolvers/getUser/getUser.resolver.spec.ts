import { Test } from '@nestjs/testing';
import { UsersService } from '../../../users/service/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../../database/entities/user.entity';
import { getUserResolver } from './getUser.resolver';
import { fakeUsers } from '../../../database/seeds/data/fakeUsers.data';
import { regexPHONE } from '../../../utils';

describe('getUserResolver', () => {
  let resolver: getUserResolver;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ keepConnectionAlive: true }),
        TypeOrmModule.forFeature([UserEntity]),
      ],
      providers: [getUserResolver, UsersService],
    }).compile();

    resolver = module.get<getUserResolver>(getUserResolver);
  });

  it('should be defined', () => {
    expect(getUserResolver).toBeDefined();
  });

  describe('if user exists', () => {
    it('should return the user', async () => {
      const user = await resolver.getUser(fakeUsers[5].id);

      expect(user).toEqual(
        expect.objectContaining({
          id: fakeUsers[5].id,
          firstName: fakeUsers[5].firstName,
          lastName: fakeUsers[5].lastName,
          password: expect.any(String),
          phoneNumber: expect.stringMatching(regexPHONE),
          created: expect.any(Date),
          updated: expect.any(Date),
        }),
      );
    });
  });

  describe('otherwise', () => {
    it('should return the error', async () => {
      const FakeNotExistID = '948091ae-9cb7-4770-90ab-f058f66ee5c7';

      try {
        await resolver.getUser(FakeNotExistID);
      } catch (err) {
        expect(err.message).toEqual(
          `Can not find user with id: ${FakeNotExistID}`,
        );
      }
    });
  });
});
