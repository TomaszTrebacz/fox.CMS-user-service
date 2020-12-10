import { SetMetadata } from '@nestjs/common';
import { userRole } from 'src/users/enums/userRole.enum';

export const Roles = (...roles: userRole[]) => SetMetadata('roles', roles);
