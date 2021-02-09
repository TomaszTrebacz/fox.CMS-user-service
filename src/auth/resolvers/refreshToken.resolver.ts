import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  AuthGqlRedisService,
  RedisHandlerService,
} from '@tomasztrebacz/nest-auth-graphql-redis';
import { TokenResponse } from '../../graphql';
import { RedisUserI } from '../../models';

@Resolver('refreshTokenResolver')
export class refreshTokenResolver {
  constructor(
    private readonly redisHandler: RedisHandlerService,
    private readonly authGqlService: AuthGqlRedisService,
  ) {}

  @Mutation('refreshToken')
  async refreshToken(
    @Args('refreshToken') refreshToken: Pick<RedisUserI, 'refreshtoken'>,
  ): Promise<TokenResponse> {
    try {
      const decodedJWT = await this.authGqlService.verifyToken(
        refreshToken,
        process.env.REFRESH_JWT_SECRET,
      );

      const keys: string[] = ['refreshtoken', 'count'];

      const user: RedisUserI = await this.redisHandler.getFields(
        decodedJWT.id,
        keys,
      );

      if (
        refreshToken !== user.refreshtoken ||
        decodedJWT.count != user.count // count mechanism is an alternative to blackmailing tokens
      ) {
        throw new Error('Validation error.');
      }

      const newAccessToken = await this.authGqlService.createDefaultJWT(
        decodedJWT.id,
      );

      const refreshPayload = {
        id: decodedJWT.id,
        count: decodedJWT.count,
      };

      const newRefreshToken = await this.authGqlService.createJWT(
        refreshPayload,
        process.env.REFRESH_JWT_SECRET,
        process.env.REFRESH_JWT_EXP,
      );

      const refreshField = new Map<keyof RedisUserI, string>([
        ['refreshtoken', newRefreshToken],
      ]);

      await this.redisHandler.setUser(decodedJWT.id, refreshField);

      const TokenResponse = {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };

      return TokenResponse;
    } catch (err) {
      throw new Error(err.message);
    }
  }
}
