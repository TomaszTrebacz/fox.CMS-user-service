import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { RedisHandlerService } from '@tomasztrebacz/nest-auth-graphql-redis';

@Resolver('logoutResolver')
export class logoutResolver {
  constructor(private readonly redisHandler: RedisHandlerService) {}

  @Mutation()
  async logout(@Args('id') id: string): Promise<boolean> {
    try {
      await this.redisHandler.deleteField(id, 'refreshtoken');

      return true;
    } catch (err) {
      throw new Error(err);
    }
  }
}
