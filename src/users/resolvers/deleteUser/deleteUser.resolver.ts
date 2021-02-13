import { Resolver, Mutation, Args } from '@nestjs/graphql';
import {
  AccessLevel,
  RedisHandlerService,
} from '@tomasztrebacz/nest-auth-graphql-redis';
import { UsersService } from '../../service/users.service';

@Resolver('deleteUserResolver')
export class deleteUserResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly redisHandler: RedisHandlerService,
  ) {}

  @Mutation()
  @AccessLevel()
  async deleteUser(@Args('id') id: string): Promise<boolean> {
    try {
      await this.redisHandler.deleteUser(id);
      await this.usersService.deleteUser(id);

      return true;
    } catch (err) {
      throw new Error(
        `Can not delete user data from databases: ${err.message}`,
      );
    }
  }
}
