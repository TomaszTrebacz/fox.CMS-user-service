import { Resolver, Mutation, Args } from '@nestjs/graphql';
import {
  Auth,
  AuthGqlRedisService,
  CurrentUser,
  RedisHandlerService,
} from '@tomasztrebacz/nest-auth-graphql-redis';
import { MailService } from '../../../shared/mail/mail.service';
import { UserI } from '../../../models';
import { UsersService } from '../../../users/service/users.service';

@Resolver('sendChangePhoneEmailResolver')
export class sendChangePhoneEmailResolver {
  constructor(
    private readonly authGqlService: AuthGqlRedisService,
    private readonly redisHandler: RedisHandlerService,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
  ) {}

  @Mutation()
  @Auth()
  async sendChangePhoneEmail(
    @CurrentUser() payload: UserI,
    @Args('phoneNumber') phoneNumber: string,
  ): Promise<boolean> {
    try {
      const user = await this.usersService.findOneById(payload.id);

      const JWTpayload = {
        id: user.id,
        data: phoneNumber,
      };

      const changePhoneToken = await this.authGqlService.createJWT(
        JWTpayload,
        process.env.PHONECHANGE_JWT_SECRET,
        process.env.PHONECHANGE_JWT_EXP,
      );

      const changePhoneField = new Map<string, string>([
        ['changephonetoken', changePhoneToken],
      ]);

      await this.redisHandler.setUser(user.id, changePhoneField);

      const changePhoneLink = `${process.env.FRONTEND_URL}/account/change-phone/token?token=${changePhoneToken}`;

      const mail = {
        mailAddress: user.email,
        greeting: `Hi ${user.firstName} ${user.lastName}!`,
        content: `We've heard that you want change your phone number.
                Please click in this link: ${changePhoneLink}. 
                Make sure you don't share this link publicly, because it's unique!`,
        subject: 'Change phone number | foxCMS',
      };

      await this.mailService.sendMail(mail);

      return true;
    } catch (err) {
      throw new Error(
        `We are sorry. We can not send you email with phone change link: ${err.message}`,
      );
    }
  }
}
