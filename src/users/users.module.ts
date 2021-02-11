import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './service/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { phoneNumberExist, emailExist } from '../validators';
import { AuthGqlRedisModule } from '@tomasztrebacz/nest-auth-graphql-redis';
import { UserEntity } from '../database/entities/user.entity';
import { SharedModule } from '../shared/shared.module';
import {
  changePhoneNumberResolver,
  currentUserResolver,
  deleteUserResolver,
  findAllResolver,
  getUserResolver,
  registerUserResolver,
  resolveReferenceResolver,
  sendChangePhoneEmailResolver,
  updateUserResolver,
} from './resolvers';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    forwardRef(() => AuthModule),
    AuthGqlRedisModule,
    SharedModule,
  ],
  providers: [
    findAllResolver,
    getUserResolver,
    currentUserResolver,
    registerUserResolver,
    sendChangePhoneEmailResolver,
    updateUserResolver,
    changePhoneNumberResolver,
    deleteUserResolver,
    resolveReferenceResolver,
    UsersService,
    phoneNumberExist,
    emailExist,
  ],
  exports: [UsersService],
})
export class UsersModule {}
