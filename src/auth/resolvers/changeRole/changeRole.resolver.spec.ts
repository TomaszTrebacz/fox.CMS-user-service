import { Test } from '@nestjs/testing';
import { UsersService } from '../../../users/service/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../../database/entities/user.entity';
import { AuthService } from '../../../auth/service/auth.service';
import {
  RedisHandlerService,
  userRole,
} from '@tomasztrebacz/nest-auth-graphql-redis';
import { mockedRedisHandlerService } from '../../../../test/mocks';
import { fakeUsers } from '../../../database/seeds/data/fakeUsers.data';
import { changeRoleResolver } from './changeRole.resolver';
import { ChangeRoleDto } from 'src/auth/dto';

describe('changeRoleResolver', () => {
  let resolver: changeRoleResolver;
  let redisHandler: RedisHandlerService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ keepConnectionAlive: true }),
        TypeOrmModule.forFeature([UserEntity]),
      ],
      providers: [
        changeRoleResolver,
        UsersService,
        AuthService,
        {
          provide: RedisHandlerService,
          useValue: mockedRedisHandlerService,
        },
      ],
    }).compile();

    resolver = module.get<changeRoleResolver>(changeRoleResolver);
    redisHandler = module.get<RedisHandlerService>(RedisHandlerService);
  });

  it('should be defined', () => {
    expect(changeRoleResolver).toBeDefined();
  });

  describe('if role was changed', () => {
    it('should return a boolean', async () => {
      const data: ChangeRoleDto = {
        id: fakeUsers[2].id,
        role: userRole.ADMIN,
      };

      expect(await resolver.changeRole(data)).toBeTruthy();
    });
  });
  describe('otherwise', () => {
    describe('if user does not exist', () => {
      it('should throw the detailed error', async () => {
        const invalidData: ChangeRoleDto = {
          id: '5671f19a-5785-4e80-8d84-27087a8cf03b',
          role: userRole.ADMIN,
        };

        const errMessage = 'Can not save data in redis data store.';
        const throwError = () => {
          throw Error(errMessage);
        };

        const redisHandlerSetUserSpy = jest
          .spyOn(redisHandler, 'setUser')
          .mockImplementation(throwError);

        try {
          await resolver.changeRole(invalidData);
        } catch (err) {
          expect(err.message).toEqual(`Can not change role: ${errMessage}`);
        } finally {
          expect(redisHandlerSetUserSpy).toHaveBeenCalledTimes(2);
        }
      });
    });
  });
});
