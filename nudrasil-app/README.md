# Extensions Used

Firmware (/firmware):

- C/C++
- PlatformIO IDE

Web App (/nudrasil-app):

- ESLint
- Prettier
- Tailwind CSS IntelliSense

## Database Changes:

- Update db/schema.sql
- Update drizzle/schema.ts

Generates the migration file:

- yarn run db:generate

Pushes the change to the dev database:

- yarn run db:push
