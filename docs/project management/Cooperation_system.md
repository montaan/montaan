Montaan runs on commits, it _is_ a mountain of commits. 

Montaan requires on the order of a million commits per year to be a high quality product.

There are two ways to get a million commits a year:
    1. You have enough (1k-1M) people working on it to hit a million a year.
    2. You have high commit multipliers to enable a smaller team hit that (e.g. 1000x multiplier allows a single dev to hit 1M a year).

A realistic plan requires both. Large core team and a high commit multiplier.

Commits from people can be either in the form of a huge number of contributors each doing just a few commits, or the traditional full-time core team where you have a few thousand people who are doing up to thousand commits per year.

Collecting a few commits per year from millions of people sounds like a more interesting and scalable approach. Wikipedia receives something like 3 edits per second, or 120 million edits per year. This requires a commit flow as simple as (or simpler than) Wikipedia's, emergent coordination and strong QA.

Commit multipliers are things like auto-fixing static analysis bots, prettier, eslint, bors-style CI bots, automerge bots, TypeScript & IntelliSense etc tooling that enforces higher code quality, automatic test generation, permutation generation, procedural generation of code, auto-generated UI, auto-generated assets, auto-generated code from UI, node-based editing systems, auto-generated fleshing up of code (tests, docs, performance, UI, specialize & generalize feature, generate art assets, styles based on styleguide, suggest visual themes, GAN it up like crazy).

The project is split into small self-contained components that can be worked on individually. This allows developers to attain ownership of their part of the codebase, maximizing individual commit count. Coupled with commit multipliers, we aim to reach 3000 commits per year for full-time devs.

With commit multipliers and a million devs averaging 2 commits per year, we would aim for 5-10 million commits per year.

Commit multipliers:
    - tests => 3 commits
    - docs => 3 commits
    - perf => 3 commits
    - UI gen => 4 commits
    - spec/gen feature => 30 commits
    - art assets => 4 commits
    - styles => 3 commits
    - translations => 20 commits
    - guided evolution => 100 commits

    --- total 170x => 170k commits / year for full-time dev

# Collaboration system
    [] Codebase easy to contribute to
    - Key here is to have thousands of active threads of work that can be executed by executors or further split by coordinators 
    - A large number of commits should come automatically from bots (Bors, CI, dependabot)
        [] Design Lint to catch design bugs https://lintyour.design/
        [x] ESLint to catch bugs
        [] TypeScript for IntelliSense
        [] Storybook to develop components
        [] Documentation with https://docusaurus.io/
        [] Getting Started 
        [] Book with deep knowledge
        [] Self-contained components
        [] Bors to keep master a-OK
        [] Tests to keep things working
        [] Issue dispatcher
        [] Translation project
        [] Documentation project
        [] Artwork / theme project
        [] Music / audio project
        [] Fun project
        [] Optimization project
        [] Quality project
        [x] Prettier in CI hook to enforce coding style
    [] Actively prompt for commits
        [] Issue dispatcher
    [] Commit flow management best practices
        [] Rust
        [] Linux
        [] LLVM
        [] VSCode
        [] Chromium
    [] Positive community mood
        [] Like Fortnite &c online games deal with griefers and keeping it fun for all
    [] Automatic formatting
    [] Easy refactoring
        [] TypeScript
        [] js-i18n to multilang
    [] Neutral naming policy
    [] Instant editing
        - Edit live version of app, see changes, push commit to repo
    [] Anonymous contribution
        [] No chat, emoji/dance-based comms
        [] Random 12-digit id numbers
        [] No gender pronouns
        [] High velocity reviews
            [] Bors-NG to enforce that master works
            [] Review automation to allow thousands of reviews per day
            [] Find files for PR, find authors for files, distribute review request across authors with enough commits
    [] Non-English contributor languages
    [] Competition around contribution amount and quality
    [] CodeSquare - become the Mayor of a file / dir by contributing to it
    [] Embarrassingly parallel architecture - imagine a million devs simultaneously working on the codebase
        [] Commits to one component don't screw up others
        [] Large number of simple individual components
        [] Hot-patching architecture to allow loading components only when needed
        [] No One Language -- well-defined API + WASM -- bring C/C++/Rust/Go libs into lang easily
        [] High failure tolerance, high failure detection, high failure avoidance
            [] Auto-generated fuzzer tests
            [] Tests next to code
            [] QuickCheck
            [] Flag failures in individual components for quick review & fixing
            [] Disable failed components from affecting rest of app
            [] Runtime monitoring of failure causes & stack traces to replicate failure

# Make a pleasant place
    [] Party
    [] Theme music for tasks / parts of project
    [] Artwork
