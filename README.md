# Montaan

## Start app in dev mode

```bash
git clone https://github.com/montaan/montaan
cd montaan
yarn start-dev # Install Docker before this
cd frontend
yarn
yarn start
```

Register an account (the accounts are local, there's no global server.)
Click on "Your Repositories", "Create New", paste https://github.com/montaan/montaan to "Import URL" and press "Create Repo".

Wait a minute and reload the page. Hooray!

## Test runner

```bash
cd frontend
yarn test
yarn type-test # In new terminal
```

## Ok, sure, but what's in it do for me?

Montaan is an in-browser git repo visualizer.

-   Understand a new project quickly (even old projects are new after a while - you forget how they work)
-   See project structure
-   See what is new and what has changed
-   See who is working on what
-   See what is related to what

Montaan displays the git repo as an easy-to-understand 2D hierarchy, with folders surrounding their contents.

### Features

Projects in supported languages (read: JavaScript & TypeScript) also have dependency graphs using depcruise to show the dependencies of source files.

There's code search that splits the results into Definition, Documentation, Uses and Tests, making it quick to things in the tree. The search results are overlaid on top of the tree with little pins, making huge result sets navigable.

## Install

The recommended way to develop and deploy the app is through Docker.

The next steps require Docker and `docker-compose`.

### Development server

```bash
yarn start-dev
cd frontend
yarn start
```

The dev server mounts the local `backend` and `frontend` in server containers with file watchers. When you change backend or frontend files, the servers reload.

To stop the development server, run `yarn stop-dev`

### Production

The production server does a frontend build and serves it through the backend server.

```bash
yarn start-production
```

Open [http://localhost:8888](http://localhost:8888).

To stop the production server, run `yarn stop-production`

## Development

### VS Code setup

The recommended VSCode setup is Prettier, Code Spell Checker, and the TypeScript & ESLint plugins.

Prettier keeps the formatting out of the way. Code Spell Checker makes the code more readable.

### Component creation

New features should be initially implemented as components. To create a component, run `yarn create-component` in `frontend`.

```sh
cd frontend
yarn create-component
# Fill in the questionnaire
# open src/components/MyShinyComponent/MyShinyComponent.tsx
```

The created component has a filled-in README.md, Jest tests, and a SCSS module. The project pre-commit hook tries to keep the README up-to-date with code changes. If your changes break the auto-generated files, either make your changes work with the auto-generator or make the auto-generator work with your changes.

There are component creators for Filesystems and FileViews as well. Filesystems read dirs and files to create the tree. FileViews are in-tree file previews (e.g. you zoom in and the contents of a text file appear: that's a TextFileView in action).

```sh
yarn create-filesystem
yarn create-fileview
```

See the [src/examples](src/examples) directory for a sample on how to create a new filesystem and add a custom UI component to it.

Run the following in the browser console to see an example of a dynamically generated tree and custom UI. It has a file for every person in Portugal, and shows the regional progression of the COVID-19 epidemic:

```tsx
mountFSEntry('/', 'NUTS', await Examples.PortugalCOVIDTree());
```

We're planning to do plugins. They'd be custom filesystems, views and components that you could load at runtime to customize the tree and UI. They'd work something like:

```tsx
loadPlugin(urlToPlugin);
```

Which would load the plugin either with a script tag or CORS fetch, then have hooks to add functionality & expose plugin configuration. Like, yeah, VSCode is probably a good thing to copy here.

### The meaning of life

The project structure is for increasing the amount of change over time while maintaining quality.

Each commit should punch above its weight.

The reason why you get several commits to a single piece of code is that it wasn't complete, or that it had to adapt to a change.

We should make each commit as complete as possible. Incomplete code has errors. We try to minimize errors through types, tests, documentation, snippets, libraries and benchmarks. Make these effortless or automatically generated. Low performance is an error as well, and can be minimized through architecture, high-performance libraries and language choice.

Documentation, types, well-specified APIs and tests aid in adapting code to a changing environment.

Merges should be cheap, causing minimal or zero amount of work for other people on the project. If a PR passes the tests, it can be automatically merged.

This is not the end of the README. This is the beginning of a new you.

## License

Apache License 2.0
