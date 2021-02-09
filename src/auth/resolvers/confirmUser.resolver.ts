import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  AuthGqlRedisService,
  RedisHandlerService,
} from '@tomasztrebacz/nest-auth-graphql-redis';
import { RedisUserI } from '../../models';

@Resolver('confirmUserResolver')
export class confirmUserResolver {
  constructor(
    private readonly redisHandler: RedisHandlerService,
    private readonly authGqlService: AuthGqlRedisService,
  ) {}

  @Mutation()
  async confirmUser(
    @Args('confirmToken') confirmToken: string,
  ): Promise<boolean> {
    try {
      const { id } = await this.authGqlService.verifyToken(
        confirmToken,
        process.env.CONFIRM_JWT_SECRET,
      );

      const actualToken = await this.redisHandler.getValue(id, 'confirmtoken');

      if (confirmToken !== actualToken) {
        throw new Error('Token is not valid.');
      }

      const confirmField = new Map<keyof RedisUserI, string>([
        ['confirmed', 'true'],
      ]);

      await this.redisHandler.setUser(id, confirmField);

      await this.redisHandler.deleteField(id, 'confirmtoken');

      return true;
    } catch (err) {
      throw new Error(`Can not confirm user: ${err.message}`);
    }
  }
}
