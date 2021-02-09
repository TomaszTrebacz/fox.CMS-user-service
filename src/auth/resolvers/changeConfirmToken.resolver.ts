import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  AuthGqlRedisService,
  RedisHandlerService,
} from '@tomasztrebacz/nest-auth-graphql-redis';
import { RedisUserI } from '../../models';
import { MailService } from '../../shared/mail/mail.service';
import { UsersService } from '../../users/users.service';

@Resolver('changeConfirmTokenResolver')
export class changeConfirmTokenResolver {
  constructor(
    private readonly redisHandler: RedisHandlerService,
    private readonly authGqlService: AuthGqlRedisService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  @Mutation()
  async changeConfirmToken(@Args('email') email: string): Promise<boolean> {
    try {
      const user = await this.usersService.findOneByEmail(email, true);

      const confirmed = await this.redisHandler.getValue(user.id, 'confirmed');

      if (confirmed === 'true') {
        throw new Error('User has been confirmed earlier.');
      }

      const JWTpayload = {
        id: user.id,
      };

      const newConfirmJWT = await this.authGqlService.createJWT(
        JWTpayload,
        process.env.CONFIRM_JWT_SECRET,
        process.env.CONFIRM_JWT_EXP,
      );

      const confirmField = new Map<keyof RedisUserI, string>([
        ['confirmtoken', newConfirmJWT],
      ]);

      await this.redisHandler.setUser(user.id, confirmField);

      const newConfirmLink = `${process.env.FRONTEND_URL}/users/confirm-account?token=${newConfirmJWT}`;

      const mail = {
        greeting: `Hi ${user.firstName} ${user.lastName}!`,
        content: `We've heard that you asked for new confirmation link.
                Please confirm your mail by clicking in this link: ${newConfirmLink}. 
                Make sure you don't share this link publicly, because it's unique for you!`,
        subject: 'Resend confirmation link | foxCMS',
        mailAddress: email,
      };

      this.mailService.sendMail(mail);

      return true;
    } catch (err) {
      throw new Error(`Can not resend confirmation link: ${err.message}`);
    }
  }
}
