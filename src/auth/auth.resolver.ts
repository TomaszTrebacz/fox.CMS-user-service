import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import {
  AuthGqlRedisService,
  RedisHandlerService,
  CurrentUser,
  Auth,
  userRole,
} from '@tomasztrebacz/nest-auth-graphql-redis';
import { LoginResponse, TokenResponse } from '../graphql';
import { ExtendedUserI, UserI, RedisUserI } from '../models';
import {
  ChangePassByTokenDto,
  ChangeRoleDto,
  LoginDto,
  ResetPasswordDto,
} from './dto';
import { MailService } from '../shared/mail/mail.service';
import { SmsService } from '../shared/sms/sms.service';
import { generatePassword, generateRandomCode } from '../utils';

@Resolver('Auth')
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly smsService: SmsService,
    private readonly redisHandler: RedisHandlerService,
    private readonly authGqlRedis: AuthGqlRedisService,
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

      const codeToken = await this.authGqlRedis.createJWT(
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

      const jwtPayload = await this.authGqlRedis.verifyToken(
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

  @Mutation()
  async sendChangePassEmail(@Args('email') email: string): Promise<boolean> {
    try {
      const user = await this.usersService.findOneByEmail(email, true);

      const JWTpayload = {
        id: user.id,
      };

      const changePassToken = await this.authGqlRedis.createJWT(
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

  @Mutation()
  async changePassByToken(
    @Args('changePassByTokenInput') { token, password }: ChangePassByTokenDto,
  ): Promise<boolean> {
    try {
      const { id } = await this.authGqlRedis.verifyToken(
        token,
        process.env.EMAIL_JWT_SECRET,
      );

      const actualToken = await this.redisHandler.getValue(
        id,
        'changepasstoken',
      );

      if (token !== actualToken) {
        throw new Error('Link is not valid.');
      }

      await this.authService.changePassword(id, password);

      await this.redisHandler.deleteField(id, 'changepasstoken');
      return true;
    } catch (err) {
      throw new Error(err.message);
    }
  }

  @Mutation()
  @Auth()
  async changePassword(
    @CurrentUser() user: UserI,
    @Args('password') password: string,
  ): Promise<boolean> {
    try {
      await this.authService.changePassword(user.id, password);

      return true;
    } catch (err) {
      throw new Error(err.message);
    }
  }

  @Mutation()
  async logout(@Args('id') id: string): Promise<boolean> {
    try {
      await this.redisHandler.deleteField(id, 'refreshtoken');

      return true;
    } catch (err) {
      throw new Error(err);
    }
  }
}
