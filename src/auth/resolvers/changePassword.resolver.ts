import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Auth, CurrentUser } from '@tomasztrebacz/nest-auth-graphql-redis';
import { UserI } from '../../models';
import { AuthService } from '../service/auth.service';

@Resolver('changePasswordResolver')
export class changePasswordResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation()
  @Auth()
  async changePassword(
    @CurrentUser() user: UserI,
    @Args('password') password: string,
  ): Promise<boolean> {
    try {
      await this.authService.changePassword(user.id, password);

      return true;
    } catch (err) {
      throw new Error(err.message);
    }
  }
}
