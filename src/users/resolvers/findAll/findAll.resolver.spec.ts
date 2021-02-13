import { Test } from '@nestjs/testing';
import { UsersService } from '../../../users/service/users.service';
import { findAllResolver } from './findAll.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../../database/entities/user.entity';
import { fakeUsers } from '../../../database/seeds/data/fakeUsers.data';
import { regexUUID } from '../../../utils';

describe('findAllResolver', () => {
  let resolver: findAllResolver;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ keepConnectionAlive: true }),
        TypeOrmModule.forFeature([UserEntity]),
      ],
      providers: [findAllResolver, UsersService],
    }).compile();

    resolver = module.get<findAllResolver>(findAllResolver);
  });

  it('should be defined', () => {
    expect(findAllResolver).toBeDefined();
  });

  it('should return the users array', async () => {
    let res = await resolver.findAll();

    expect(res).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.stringMatching(regexUUID),
          firstName: expect.any(String),
          lastName: expect.any(String),
          password: expect.any(String),
          phoneNumber: expect.any(String),
          created: expect.any(Date),
          updated: expect.any(Date),
        }),
      ]),
    );

    res.forEach(function(v) {
      delete v.created, delete v.updated;
    });
    expect(res).toEqual(fakeUsers);
  });
});
