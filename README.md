# Montaan

Montaan is an in-browser git repo visualizer.

-   Understand a new project quickly (even old projects are new after a while - you forget how they work)
-   See who is working on what
-   See what is new and what has changed
-   See what is related to what

Montaan displays the git repo as an easy-to-understand 2D hierarchy, with folders surrounding their contents.

## Install

If you have Docker, here's how you get a dev server running:

```bash
yarn start-dev
```

Now open [http://localhost:3000](http://localhost:3000) and once the frontend build finishes, you should see what's up.

The dev server mounts the local `backend` and `frontend` in the server containers, with file watchers. When you change backend or frontend files, the servers reload.

To stop the server, run `yarn stop-dev`

If you want to use a local PostgreSQL install or want to understand what's going on, here's a step-by-step guide.

### Install dependencies

First, install the dependencies.

```bash
yarn install-deps
```

### Set up database

Set up the PostgreSQL database.

```bash
# Create user montaan. When prompted for password, type montaan
createuser --superuser --password montaan
# Create database.
createdb -O montaan montaan
# Update backend/.env if you used a different password
```

### Start server

Finally, start the server.

### Development

Start server in development mode. Starts the backend server on port 8008 and the frontend Webpack development server on port 3000.

```bash
yarn watch
```

Open `http://localhost:3000/`

You can also start the servers separately:

#### Backend

```bash
cd backend
yarn watch
```

#### Frontend

```bash
cd frontend
yarn start
```

### Deployment

Build the frontend for deployment and start the backend server.

```bash
yarn build
yarn start
```

Open `http://localhost:8008`

#### Docker deployment

```bash
yarn start-production
```

## Features

Projects in supported languages (read: JavaScript & TypeScript) also have dependency graphs using depcruise to show the dependencies of source files.

There's code search that splits the results into Definition, Documentation, Uses and Tests, making it quick to things in the tree. The search results are overlaid on top of the tree with little pins, making huge result sets navigable.

To use https://www.montaan.com, you need Montaan Gems. You can get enough gems for a month of use by sending a PR with one commit. If your PR passes quick review and the Bors bot's CI run, your GitHub account is credited with Montaan Gems. If you commit more often, you can either save the gems or sell them on the market at the current prevailing price.

## Make it evolve

New features should be initially implemented as components. To create a component, run `yarn makeComponent` in `frontend`.

The components are split into two categories, `qframe` and `Montaan`. Qframe components deal with framework-level stuff like user login, registration, activation etc. Montaan components make up the tree visualizer.

```sh
cd frontend
yarn makeComponent MyShinyComponent
# Fill in the questionnaire
open src/components/MyShinyComponent/MyShinyComponent.tsx
# Add your component to src/Montaan/index.jsx render() for top-level components
# or under one of the sub-components in src/Montaan.
```

The created component has a filled-in README.md for documentation, Jest+Fast-check tests and Storybook story. The project pre-commit hook tries to keep these up-to-date. If your changes break the auto-generated files, either make the auto-generator work with your changes or make your changes conform to the auto-generator. Disabling the auto-generator will break CI and make your commit impossible to merge.

It's recommended to install the Code Spell Check VSCode plugin to maintain the translatability of the codebase. To work on the code in your native language, check if the translation system has it already, or create a new one through the auto-translate script. The token names in translated code map to the non-lingual AST, so when you rename a component, the translations will be updated as well.

When writing functions, try to keep their domains as tight as possible. If the domain is tight enough, we can run an exhaustive test on the function and verify its operation and performance. For large domains, we do a partial domain exhaustive test and a random sampling of the rest of the domain. These tests are run as part of the in-editor lint runs, so you'll get immediate feedback on the any inputs that throw exceptions, and the performance of your function.

If your code matches one of the earlier encountered shapes, we suggest auto-completion or optimized variants. This often saves a ton of time and converts O(n^2) nested loops into O(n lg n).
