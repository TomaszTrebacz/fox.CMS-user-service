import { Resolver, Query } from '@nestjs/graphql';
import { Auth, userRole } from '@tomasztrebacz/nest-auth-graphql-redis';
import { UserI } from '../../../models';
import { UsersService } from '../../service/users.service';

@Resolver('findAllResolver')
export class findAllResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query('users')
  @Auth(userRole.ADMIN, userRole.ROOT)
  async findAll(): Promise<UserI[]> {
    return await this.usersService.findAll();
  }
}
