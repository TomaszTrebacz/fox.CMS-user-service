import { Resolver, Args, Mutation } from '@nestjs/graphql';
import {
  AuthGqlRedisService,
  RedisHandlerService,
  userRole,
} from '@tomasztrebacz/nest-auth-graphql-redis';
import { MailService } from '../../../shared/mail/mail.service';
import { UserI } from '../../../models';
import { CreateUserDto } from '../../dto';
import { UsersService } from '../../service/users.service';

@Resolver('registerUserResolver')
export class registerUserResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly authGqlService: AuthGqlRedisService,
    private readonly redisHandler: RedisHandlerService,
    private readonly mailService: MailService,
  ) {}

  @Mutation()
  async registerUser(
    @Args('createUserInput') registerData: CreateUserDto,
  ): Promise<UserI> {
    try {
      const createdUser = await this.usersService.createUser(registerData);

      const JWTpayload = {
        id: createdUser.id,
      };

      const confirmJWT = await this.authGqlService.createJWT(
        JWTpayload,
        process.env.CONFIRM_JWT_SECRET,
        process.env.CONFIRM_JWT_EXP,
      );

      /*
        type string is required for all values because of redis database
        - default role for any new user is (enum)`user` without any special priviliges in app
        - count mechanism is an alternative to a blacklist, 
          default is 0 -> count++ when user change password etc.
      */
      const userProperties = new Map<string, string>([
        ['role', userRole.USER],
        ['count', '0'],
        ['confirmed', 'false'],
        ['confirmtoken', confirmJWT],
      ]);

      await this.redisHandler.setUser(createdUser.id, userProperties);

      const confirmLink = `${process.env.FRONTEND_URL}/users/confirm-account?token=${confirmJWT}`;

      const mail = {
        greeting: `Hi ${createdUser.firstName} ${createdUser.lastName}!`,
        content: `I'm so glad you registered in our app! 
                  Please confirm your mail by clicking in this link: ${confirmLink}. 
                  Make sure you don't share this link publicly, because it's unique for you!`,
        subject: `Registration in foxCMS | Confirm your email! `,
        mailAddress: createdUser.email,
      };

      await this.mailService.sendMail(mail);

      return createdUser;
    } catch (err) {
      throw new Error(
        `We are sorry, ${registerData.firstName} ${registerData.lastName}. We can not register your account: ${err.message}`,
      );
    }
  }
}
