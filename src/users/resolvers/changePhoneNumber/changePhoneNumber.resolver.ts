import { Resolver, Mutation, Args } from '@nestjs/graphql';
import {
  AuthGqlRedisService,
  RedisHandlerService,
} from '@tomasztrebacz/nest-auth-graphql-redis';
import { UserI } from '../../../models';
import { UsersService } from '../../service/users.service';

@Resolver('changePhoneNumberResolver')
export class changePhoneNumberResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly authGqlService: AuthGqlRedisService,
    private readonly redisHandler: RedisHandlerService,
  ) {}

  @Mutation()
  async changePhoneNumber(@Args('token') token: string): Promise<boolean> {
    try {
      const { id, data } = await this.authGqlService.verifyToken(
        token,
        process.env.PHONECHANGE_JWT_SECRET,
      );

      const actualToken = await this.redisHandler.getValue(
        id,
        'changephonetoken',
      );

      if (token !== actualToken) {
        throw new Error('Link is not valid.');
      }

      const updateData: Pick<UserI, 'phoneNumber'> = {
        phoneNumber: data,
      };

      await this.usersService.updateUser(updateData, id);

      await this.redisHandler.deleteField(id, 'changephonetoken');

      return true;
    } catch (err) {
      throw new Error(err.message);
    }
  }
}
