// Migrations
module.exports = [
    {
        name: 'Initial tables',
        up: [
            'CREATE EXTENSION IF NOT EXISTS "pgcrypto"',
            
            `CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                created_time TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_time TIMESTAMP NOT NULL DEFAULT NOW(),
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                name TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                activation_token UUID DEFAULT gen_random_uuid() NOT NULL,
                activated BOOLEAN DEFAULT FALSE,
                data JSONB
            )`,

            `CREATE TABLE IF NOT EXISTS repos (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id),
                created_time TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_time TIMESTAMP NOT NULL DEFAULT NOW(),
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                data JSONB
            )`,

            `CREATE TABLE IF NOT EXISTS sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                ref uuid NOT NULL DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id),
                created_time TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_time TIMESTAMP NOT NULL DEFAULT NOW(),
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                csrf TEXT NOT NULL,
                data JSONB
            )`,
            'CREATE INDEX repos_user_id_idx ON repos (user_id)',
            `CREATE INDEX sessions_user_id_idx ON sessions (user_id)`,
            `CREATE INDEX users_activation_token_idx ON users (activation_token)`,
            'CREATE INDEX sessions_ref_idx ON sessions (ref)'
        ], down: [`DROP TABLE users, repos, sessions`]
    },

    {
        name: 'Repos should have name and URL',
        up: [ 
            `DELETE FROM repos`,
            `ALTER TABLE repos ADD COLUMN name TEXT NOT NULL UNIQUE`,
            `ALTER TABLE repos ADD COLUMN url TEXT`,
            `CREATE INDEX repos_name_idx ON repos (name)`
        ], down: [
            `DROP INDEX repos_name_idx`,
            `ALTER TABLE repos DROP COLUMN name, url`
        ]
    }

];
