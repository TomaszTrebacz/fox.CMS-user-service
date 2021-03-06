import { IsEmail, IsMobilePhone, Length } from 'class-validator';
import { EmailExist, PhoneNumberExist } from '../../validators';
import { CreateUserInput } from '../../graphql';

export class CreateUserDto extends CreateUserInput {
  @IsEmail()
  @EmailExist()
  email: string;

  @Length(3, 50)
  firstName: string;

  @Length(3, 50)
  lastName: string;

  @Length(8, 128)
  password: string;

  @IsMobilePhone()
  @PhoneNumberExist()
  phoneNumber: string;
}
