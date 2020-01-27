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
    },

    {
        name: 'Repo (user_id, name) should be unique',
        up: [ `ALTER TABLE repos ADD CONSTRAINT repos_unique_user_id_name UNIQUE (user_id, name)` ], 
        down: [ `ALTER TABLE repos DROP CONSTRAINT repos_unique_user_id_name` ]
    },

    {
        name: 'Repos take non-trivial time to import',
        up: [ 
            `ALTER TABLE repos ADD COLUMN processing BOOL`,
            `ALTER TABLE repos ADD COLUMN processing_log TEXT`,
        ], down: [
            `ALTER TABLE repos DROP COLUMN processing, processing_log`
        ]
    },

    {
        name: 'Repo processing should default to TRUE',
        up: [ `ALTER TABLE repos ALTER COLUMN processing SET DEFAULT true` ],
        down: []
    },

    {
        name: 'Repos can be private',
        up: [ `ALTER TABLE repos ADD COLUMN private BOOL DEFAULT false` ],
        down: [ `ALTER TABLE repos DROP COLUMN private` ]
    },

    {
        name: 'Commit details table',
        up: [
            `CREATE TABLE commits (
                repo_id UUID NOT NULL REFERENCES repos(id),
                sha TEXT NOT NULL,
                author TEXT NOT NULL,

                date TIMESTAMP NOT NULL,
                message TEXT NOT NULL,
                files JSONB NOT NULL,
                merge TEXT,

                UNIQUE(repo_id, sha)
            )`,
            `CREATE INDEX commits_repo_id_idx ON commits (repo_id)`,
            `CREATE INDEX commits_sha_idx ON commits (sha)`,
            `CREATE INDEX commits_date_idx ON commits (date)`,
            `CREATE INDEX commits_author_idx ON commits (author)`
        ],
        down: [ `DROP TABLE commits` ]
    },

    {
        name: 'Branches',
        up: [
            `CREATE TABLE branches (
                repo_id UUID NOT NULL REFERENCES repos(id),
                name TEXT NOT NULL,
                head TEXT NOT NULL,
                commit_count INTEGER NOT NULL,
                UNIQUE (repo_id, name)
            )`,
            `INSERT INTO branches (repo_id, name, head, commit_count) SELECT id, 'master', '', (SELECT COUNT(*) FROM commits WHERE repo_id = id) FROM repos`
        ], down: [ `DROP TABLE branches` ]
    }

];
