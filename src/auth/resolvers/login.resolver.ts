import { Args, Query, Resolver } from '@nestjs/graphql';
import {
  AuthGqlRedisService,
  RedisHandlerService,
} from '@tomasztrebacz/nest-auth-graphql-redis';
import { LoginResponse } from '../../graphql';
import { ExtendedUserI, RedisUserI } from '../../models';
import { AuthService } from '../service/auth.service';
import { LoginDto } from '../dto';

@Resolver('Login')
export class LoginResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly redisHandler: RedisHandlerService,
    private readonly authGqlService: AuthGqlRedisService,
  ) {}

  @Query('login')
  async login(
    @Args('loginCredentials') loginCredentials: LoginDto,
  ): Promise<LoginResponse> {
    try {
      const postgresUser = await this.authService.validateUser(
        loginCredentials,
      );

      const keys = ['role', 'count'];
      const redisUser = await this.redisHandler.getFields(
        postgresUser.id,
        keys,
      );

      const user: ExtendedUserI = {
        ...postgresUser,
        ...redisUser,
        count: parseInt(redisUser.count),
      };

      const accessToken = await this.authGqlService.createDefaultJWT(user.id);

      const refreshPayload = {
        id: user.id,
        count: user.count,
      };

      const refreshToken = await this.authGqlService.createJWT(
        refreshPayload,
        process.env.REFRESH_JWT_SECRET,
        process.env.REFRESH_JWT_EXP,
      );

      const refreshField = new Map<keyof RedisUserI, string>([
        ['refreshtoken', refreshToken],
      ]);

      await this.redisHandler.setUser(user.id, refreshField);

      const loginResponse = {
        user,
        accessToken,
        refreshToken,
        role: user.role,
      };

      return loginResponse;
    } catch (err) {
      throw new Error(`Can not sign in: ${err.message}`);
    }
  }
}
