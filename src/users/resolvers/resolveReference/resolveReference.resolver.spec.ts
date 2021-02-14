import { Test } from '@nestjs/testing';
import { UsersService } from '../../../users/service/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../../database/entities/user.entity';
import { resolveReferenceResolver } from './resolveReference.resolver';
import { fakeUsers } from '../../../database/seeds/data/fakeUsers.data';
import { regexPHONE } from '../../../utils';

describe('resolveReferenceResolver', () => {
  let resolver: resolveReferenceResolver;
  let usersService: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ keepConnectionAlive: true }),
        TypeOrmModule.forFeature([UserEntity]),
      ],
      providers: [resolveReferenceResolver, UsersService],
    }).compile();

    resolver = module.get<resolveReferenceResolver>(resolveReferenceResolver);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(resolveReferenceResolver).toBeDefined();
  });

  describe('if user exists', () => {
    it('should return the user', async () => {
      const input = {
        typename: 'user',
        id: fakeUsers[5].id,
      };

      const user = await resolver.resolveReference(input);

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
      const invalidInput = {
        typename: 'user',
        id: '948091ae-9cb7-4770-90ab-f058f66ee5c7',
      };

      try {
        await resolver.resolveReference(invalidInput);
      } catch (err) {
        expect(err.message).toEqual(
          `Can not find user with id: ${invalidInput.id}`,
        );
      }
    });
  });
});
