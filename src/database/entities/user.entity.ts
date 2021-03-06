import { UserI } from '../../models';
import { EntitySchema } from 'typeorm';

export const UserEntity = new EntitySchema<UserI>({
  name: 'users',
  columns: {
    id: {
      type: String,
      primary: true,
      generated: 'uuid',
    },
    email: {
      type: String,
      length: 50,
    },
    firstName: {
      type: String,
      nullable: false,
      length: 50,
    },
    lastName: {
      type: String,
      nullable: false,
      length: 50,
    },
    password: {
      type: String,
      nullable: false,
      length: 128,
    },
    phoneNumber: {
      type: String,
      nullable: false,
      length: 50,
    },
    created: {
      type: Date,
      createDate: true,
      nullable: false,
    },
    updated: {
      type: Date,
      updateDate: true,
      nullable: true,
    },
  },
  indices: [
    {
      name: 'IDX_USER',
      unique: true,
      columns: ['id', 'email', 'phoneNumber'],
    },
  ],
  uniques: [
    {
      name: 'UNIQUE_TEST',
      columns: ['email'],
    },
  ],
});
