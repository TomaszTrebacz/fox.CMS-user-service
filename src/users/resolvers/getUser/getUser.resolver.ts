import { Resolver, Query, Args } from '@nestjs/graphql';
import { UserI } from '../../../models';
import { UsersService } from '../../service/users.service';

@Resolver('getUserResolver')
export class getUserResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query('user')
  async getUser(@Args('id') id: string): Promise<UserI> {
    return await this.usersService.findOneById(id);
  }
}
