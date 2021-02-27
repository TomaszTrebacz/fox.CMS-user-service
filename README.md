<p align="center">
  <img src="https://i.ibb.co/1rb5k9N/api-gateway.png" />
  </a>
   <h1 align="center">USER-SERVICE | part of <a href="https://github.com/TomaszTrebacz/fox.CMS">fox.CMS</a> app</h1>
</p>

## Description

User-service enables the management of own account and other ones, i.e.:

- login & register,
- refresh token with count mechanism (alternative to blacklist),
- confirm user with email,
- and much more...

In this repository are also placed unit & integration tests.

## Installation

1. Create .env file following the example (example.env) in the repository.

```ts
APP_PORT=

DB_HOST=
DB_PORT=
DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=

MAIL_HOST=
MAIL_PORT=
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_SENDER_ID=
MAIL_PATH=by default '/project-dir/resources/mails'

TWILIO_AUTH_TOKEN=
TWILIO_SID=
TWILIO_PHONE_NUMBER=

REDIS_HOST=
REDIS_PORT=
REDIS_DB=
REDIS_PASSWORD=

FRONTEND_URL=

ACCESS_JWT_SECRET=
ACCESS_JWT_EXP=

REFRESH_JWT_SECRET=
REFRESH_JWT_EXP=

CONFIRM_JWT_SECRET=
CONFIRM_JWT_EXP=

PHONECODE_JWT_SECRET=
PHONECODE_JWT_EXP=

EMAIL_JWT_SECRET=
EMAIL_JWT_EXP=

PHONECHANGE_JWT_SECRET=
PHONECHANGE_JWT_EXP=
```

2. Install dependencies

```
npm install
```

3. Run the app:

```ts
npm run start
```

## Testing

1. Before testing, you should clean database:

```
npm run schema:drop

npm run schema:sync // or npm run db:migrate
```

2. Seed with data:

```
npm run seed:postgres


// optionally you can seed redis database but this is not required for unit/integration tests
npm run seed:redis
```

3. Run tests:

```
npm run test
```

The result:

<p align="center">
<img src="https://i.ibb.co/P4cynmb/test.png" alt="Tests" />
</p>
