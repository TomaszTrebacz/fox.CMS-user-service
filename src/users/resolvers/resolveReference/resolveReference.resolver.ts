import { Resolver, ResolveReference } from '@nestjs/graphql';
import { UsersService } from '../../../users/service/users.service';

@Resolver('User')
export class resolveReferenceResolver {
  constructor(private readonly usersService: UsersService) {}

  @ResolveReference()
  async resolveReference(reference: { typename: string; id: string }) {
    return await this.usersService.findOneById(reference.id);
  }
}
