import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  AuthGqlRedisService,
  RedisHandlerService,
} from '@tomasztrebacz/nest-auth-graphql-redis';
import { AuthService } from '../../service/auth.service';
import { ChangePassByTokenDto } from '../../dto';

@Resolver('changePassByTokenResolver')
export class changePassByTokenResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly redisHandler: RedisHandlerService,
    private readonly authGqlService: AuthGqlRedisService,
  ) {}

  @Mutation()
  async changePassByToken(
    @Args('changePassByTokenInput') { token, password }: ChangePassByTokenDto,
  ): Promise<boolean> {
    try {
      const { id } = await this.authGqlService.verifyToken(
        token,
        process.env.EMAIL_JWT_SECRET,
      );

      const actualToken = await this.redisHandler.getValue(
        id,
        'changepasstoken',
      );

      if (token !== actualToken) {
        throw new Error('Link is not valid.');
      }

      await this.authService.changePassword(id, password);

      await this.redisHandler.deleteField(id, 'changepasstoken');
      return true;
    } catch (err) {
      throw new Error(err.message);
    }
  }
}
