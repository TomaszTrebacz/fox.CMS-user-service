import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  AuthGqlRedisService,
  RedisHandlerService,
} from '@tomasztrebacz/nest-auth-graphql-redis';
import { SmsService } from '../../../shared/sms/sms.service';
import { UsersService } from '../../../users/service/users.service';
import { generatePassword } from '../../../utils';
import { AuthService } from '../../service/auth.service';
import { ResetPasswordDto } from '../../dto';

@Resolver('resetPasswordResolver')
export class resetPasswordResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly redisHandler: RedisHandlerService,
    private readonly authGqlService: AuthGqlRedisService,
    private readonly usersService: UsersService,
    private readonly smsService: SmsService,
  ) {}

  @Mutation()
  async resetPassword(
    @Args('resetPasswordInput') { phoneNumber, code }: ResetPasswordDto,
  ): Promise<boolean> {
    try {
      const user = await this.usersService.findOneByPhoneNumber(
        phoneNumber,
        true,
      );

      const codeToken = await this.redisHandler.getValue(user.id, 'codetoken');

      const jwtPayload = await this.authGqlService.verifyToken(
        codeToken,
        process.env.PHONECODE_JWT_SECRET,
      );

      if (jwtPayload.code != code) {
        throw new Error('Wrong code.');
      }

      const password = generatePassword(8);

      await this.redisHandler.deleteField(user.id, 'codetoken');

      await this.authService.changePassword(user.id, password);

      const smsData = {
        phoneNumber: user.phoneNumber,
        body: `Your new password is ${password}. Log in and change it quickly.`,
      };

      await this.smsService.sendSMS(smsData);

      return true;
    } catch (err) {
      throw new Error(`Can not reset password: ${err.message}`);
    }
  }
}
