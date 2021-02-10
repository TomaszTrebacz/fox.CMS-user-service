import { Resolver, Query } from '@nestjs/graphql';
import { Auth, CurrentUser } from '@tomasztrebacz/nest-auth-graphql-redis';
import { UserI } from '../../../models';
import { UsersService } from '../../service/users.service';

@Resolver('currentUserResolver')
export class currentUserResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query('currentUser')
  @Auth()
  async currentUser(@CurrentUser() user: UserI): Promise<UserI> {
    return await this.usersService.findOneById(user.id);
  }
}
