import { IsString, MaxLength, MinLength } from 'class-validator';
import { ChangePassByTokenInput } from '../../graphql';

export class ChangePassByTokenDto extends ChangePassByTokenInput {
  @IsString()
  token: string;

  @MinLength(8)
  @MaxLength(128)
  password: string;
}
