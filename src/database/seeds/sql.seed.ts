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
            '$argon2i$v=19$m=4096,t=3,p=1$lGo75A51WyVuS4SgeYz1ow$YogJNxFuIf/L6NjmEpemfQPQlgxg5Ka9/dsHf+ZCohXvD5yCM8Pupw', // 'examplePassword1'
          phoneNumber: '+48767532860',
        },
        {
          id: '2bac1170-827d-49ad-b7a3-9c76e6ad83e9',
          email: 'john.smith@outlook.com',
          firstName: 'John',
          lastName: 'Smith',
          password:
            '$argon2i$v=19$m=4096,t=3,p=1$pKXnSV375zGY2ry+lgaA6w$+Q3imQq2EEUe4La8byZn0mR/in+YJ+CPXZ9wdmAJ++WUrPd96dpQYA', // 'JohnSmith'
          phoneNumber: '+48667532860',
        },
      ])
      .execute();
  }
}
