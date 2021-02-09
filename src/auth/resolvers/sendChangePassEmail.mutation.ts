import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  AuthGqlRedisService,
  RedisHandlerService,
} from '@tomasztrebacz/nest-auth-graphql-redis';
import { RedisUserI } from '../../models';
import { MailService } from '../../shared/mail/mail.service';
import { UsersService } from '../../users/service/users.service';
import { AuthService } from '../service/auth.service';

@Resolver('sendChangePassEmailResolver')
export class sendChangePassEmailResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly redisHandler: RedisHandlerService,
    private readonly authGqlService: AuthGqlRedisService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  @Mutation()
  async sendChangePassEmail(@Args('email') email: string): Promise<boolean> {
    try {
      const user = await this.usersService.findOneByEmail(email, true);

      const JWTpayload = {
        id: user.id,
      };

      const changePassToken = await this.authGqlService.createJWT(
        JWTpayload,
        process.env.EMAIL_JWT_SECRET,
        process.env.EMAIL_JWT_EXP,
      );

      const changePassField = new Map<keyof RedisUserI, string>([
        ['changepasstoken', changePassToken],
      ]);

      await this.redisHandler.setUser(user.id, changePassField);

      const changePassLink = `${process.env.FRONTEND_URL}/users/reset-password/changePass?token=${changePassToken}`;

      const mail = {
        greeting: `Hi ${user.firstName} ${user.lastName}!`,
        content: `We've heard that you forget your password.
                Please click in this link: ${changePassLink}. 
                Make sure you don't share this link publicly, because it's unique!`,
        subject: 'Forget password | foxCMS',
        mailAddress: user.email,
      };

      this.mailService.sendMail(mail);

      return true;
    } catch (err) {
      throw new Error(err.message);
    }
  }
}
