import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  AuthGqlRedisService,
  RedisHandlerService,
} from '@tomasztrebacz/nest-auth-graphql-redis';
import { RedisUserI } from '../../models';
import { SmsService } from '../../shared/sms/sms.service';
import { UsersService } from '../../users/service/users.service';
import { generateRandomCode } from '../../utils';

@Resolver('sendCodePhoneResolver')
export class sendCodePhoneResolver {
  constructor(
    private readonly redisHandler: RedisHandlerService,
    private readonly authGqlService: AuthGqlRedisService,
    private readonly usersService: UsersService,
    private readonly smsService: SmsService,
  ) {}

  @Mutation()
  async sendCodePhone(
    @Args('phoneNumber') givenphoneNumber: string,
  ): Promise<boolean> {
    try {
      const { id, phoneNumber } = await this.usersService.findOneByPhoneNumber(
        givenphoneNumber,
        true,
      );

      const randomNumber = generateRandomCode();

      const JWTpayload = {
        code: randomNumber,
      };

      const codeToken = await this.authGqlService.createJWT(
        JWTpayload,
        process.env.PHONECODE_JWT_SECRET,
        process.env.PHONECODE_JWT_EXP,
      );

      const codeField = new Map<keyof RedisUserI, string>([
        ['codetoken', codeToken],
      ]);

      await this.redisHandler.setUser(id, codeField);

      const smsData = {
        phoneNumber: phoneNumber,
        body: `Your confirmation code for reset password is ${randomNumber}. Please enter it on website within 5 minutes.`,
      };

      await this.smsService.sendSMS(smsData);

      return true;
    } catch (err) {
      throw new Error(`Can not send confirmation code: ${err.message}`);
    }
  }
}
