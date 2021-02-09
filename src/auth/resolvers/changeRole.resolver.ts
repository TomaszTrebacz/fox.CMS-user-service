import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Auth, userRole } from '@tomasztrebacz/nest-auth-graphql-redis';
import { AuthService } from '../auth.service';
import { ChangeRoleDto } from '../dto';

@Resolver('changeRoleResolver')
export class changeRoleResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation()
  @Auth(userRole.ROOT)
  async changeRole(
    @Args('changeRoleInput') changeRoleData: ChangeRoleDto,
  ): Promise<boolean> {
    try {
      await this.authService.changeRole(changeRoleData);

      return true;
    } catch (err) {
      throw new Error(`Can not change role: ${err.message}`);
    }
  }
}
