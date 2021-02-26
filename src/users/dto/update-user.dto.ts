import { IsOptional, Length } from 'class-validator';
import { UpdateUserInput } from '../../graphql';

export class UpdateUserDto extends UpdateUserInput {
  @IsOptional()
  @Length(3, 50)
  firstName: string;

  @IsOptional()
  @Length(3, 50)
  lastName: string;
}
