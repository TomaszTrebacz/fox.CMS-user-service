import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import { UserEntity } from '../entities/user.entity';

export default class SQLSeed implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    await connection
      .createQueryBuilder()
      .insert()
      .into(UserEntity)
      .values([
        {
          id: '8055d923-0cfd-40e9-879e-638e8ffc7475',
          email: 'charles.williams@yahoo.com',
          firstName: 'Charles',
          lastName: 'Williams',
          password:
            '$argon2i$v=19$m=4096,t=3,p=1$RQXPAsMY9cQk1MqfAyU1Vg$5PrhStjEWZhE7TOkA7WwJPbLX12HbTy2RNFDPVG4A5CqX4ZSvAIpaw',
          phoneNumber: '+15005550006',
        },
        {
          id: 'ded8dc2f-ab3b-49a5-8f14-34bf89bc20ca',
          email: 'gary.green@gmail.com',
          firstName: 'Gary',
          lastName: 'Green',
          password:
            '$argon2i$v=19$m=4096,t=3,p=1$RQXPAsMY9cQk1MqfAyU1Vg$5PrhStjEWZhE7TOkA7WwJPbLX12HbTy2RNFDPVG4A5CqX4ZSvAIpaw',
          phoneNumber: '+15005550006',
        },
        {
          id: '3d248dbc-4475-46e1-8361-6273d0f1fa9c',
          email: 'stephen.edwards@yahoo.com',
          firstName: 'Stephen',
          lastName: 'Edwards',
          password:
            '$argon2i$v=19$m=4096,t=3,p=1$If1I59eimnGgxLMfogrMBQ$BIX1Hy05JX6NraxOljWRk0edsnuL0DPyiCjEQXZHhIRqiG1ERZ1n0g',
          phoneNumber: '+15005550006',
        },
        {
          id: '4f4c1d11-816f-46fa-8a8e-575ee1ca3998',
          email: 'alexander.lewis@gmail.com',
          firstName: 'Alexander',
          lastName: 'Lewis',
          password:
            '$argon2i$v=19$m=4096,t=3,p=1$RQXPAsMY9cQk1MqfAyU1Vg$5PrhStjEWZhE7TOkA7WwJPbLX12HbTy2RNFDPVG4A5CqX4ZSvAIpaw',
          phoneNumber: '+48667532860',
        },
      ])
      .execute();
  }
}
