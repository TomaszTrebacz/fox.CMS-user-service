import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { Auth, CurrentUser } from '@tomasztrebacz/nest-auth-graphql-redis';
import { UserI } from '../../../models';
import { UpdateUserDto } from '../../dto';
import { UsersService } from '../../service/users.service';

@Resolver('updateUserResolver')
export class updateUserResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation()
  @Auth()
  async updateUser(
    @CurrentUser() user: UserI,
    @Args('updateUserInput') updateData: UpdateUserDto,
  ): Promise<boolean> {
    try {
      await this.usersService.updateUser(updateData, user.id);

      return true;
    } catch (err) {
      throw new Error(err.message);
    }
  }
}
