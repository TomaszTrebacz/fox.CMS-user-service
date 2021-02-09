import { Resolver, Query } from '@nestjs/graphql';
import { UserI } from '../../models';
import { UsersService } from '../service/users.service';

@Resolver('findAllResolver')
export class findAllResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query('findAll')
  async findAll(): Promise<UserI[]> {
    return await this.usersService.findAll();
  }
}
