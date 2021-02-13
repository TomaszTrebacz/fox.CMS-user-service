import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import { UserEntity } from '../../entities/user.entity';
import { fakeUsers } from '../data/fakeUsers.data';

export default class SQLSeed implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    await connection
      .createQueryBuilder()
      .insert()
      .into(UserEntity)
      .values(fakeUsers)
      .execute();
  }
}
