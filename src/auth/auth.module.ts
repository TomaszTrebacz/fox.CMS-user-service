import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { UsersModule } from '../users/users.module';
import { AuthGqlRedisModule } from '@tomasztrebacz/nest-auth-graphql-redis';
import { SharedModule } from '../shared/shared.module';
import {
  changeConfirmTokenResolver,
  changePassByTokenResolver,
  changePasswordResolver,
  changeRoleResolver,
  confirmUserResolver,
  LoginResolver,
  logoutResolver,
  refreshTokenResolver,
  resetPasswordResolver,
  sendChangePassEmailResolver,
  sendCodePhoneResolver,
} from './resolvers';

@Module({
  imports: [forwardRef(() => UsersModule), AuthGqlRedisModule, SharedModule],
  providers: [
    LoginResolver,
    refreshTokenResolver,
    changeRoleResolver,
    confirmUserResolver,
    changeConfirmTokenResolver,
    sendCodePhoneResolver,
    resetPasswordResolver,
    sendChangePassEmailResolver,
    changePassByTokenResolver,
    changePasswordResolver,
    logoutResolver,
    AuthService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
