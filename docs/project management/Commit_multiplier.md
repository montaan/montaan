# Commit multiplier

Peopleware, hardware or software that multiplies the impact of each commit.

Group commit velocity is how many raw commits per day the project team generates.

Commit velocity is how many raw commits per day a single developer can generate.

"Raw commit" here refers to something like how a commit would look like without automation. No automated tests, no documentation, no generated code, no linting, no code review, etc.

A commit multiplier increases the amount of raw commits generated per commit. A commit multiplier system with a commit factor of three would generate three raw commits of value per commit.

E.g. Tests increase group commit velocity by baking "fix bug" commits into the feature commit. Documentation increases group commit velocity by making it faster and easier to commit against the codebase.

Imagine a giant digger vs a shovel.

## Types of commit multipliers

Testing
Documentation
Linters
Style guides
Type systems
Refactoring tools
Boilerplate generators
Code generators
Compilers
UI generators
Language translators
Formatters
Test generators
Coverage generators
Dependency generators
Story generators
Documentation generators
Auto-fixing issues
Spell checker
Grammar checker
Automatic deployment
Automated scaling
Vulnerability detection, isolation and fixing
Automatic merging of code
Continuous integration
Performance testing
Fuzz testing

E.g. if you need to write a React component, a commit multiplier would generate you a full component source directory with tests, stories and documentation. The next version of the multiplier could ask you briefly describe the component and its properties and types to generate a more fleshed out component. The generator could be augmented by a system that would automatically update tests and documentation on changes to the code and the API.

The Grail System would allow you to commit small changes that have commit factors in the thousands: You commit something like "add fireworks at moments of success", and the Grail System builds a fully tested and document high-performance fireworks animation with different levels of intensity, defines moments of success and threads the implementation in a self-confined scalable fashion through the codebase. To finish the commit, you'd work with the Grail System to refine and evolve the look and feel of the fireworks and the moments of success, and ask for audio and background music. The whole process would take a few hours and the resulting commit would be equal to thousands of raw commits.

To make something like the Grail System, you need to: - recognize "fireworks" - create visual that matches "fireworks" - create code that creates a similar visual - evolve code to higher-quality code - create tests for code - create documentation for code - recognize "moments of success" - match "moments of success" to UI states - add a visual to UI states - evolve visual according to developer feedback - evolve moments of success matcher - create audio - create background music

Snippets for algorithms (indexed for-loop, foo[x] ||= [], binary search, tree algos, heap algos, DFS, BFS, graph algos, add test property)

## Training a model to generate code

Spider StackOverflow for highly ranked answers. Spider GitHub for commits. Combine to create high quality commits on top of an existing codebase.

Find recipes, algorithms, bugfixes, improved versions of code, microcopy, styles, color schemes.

## Faster commits

To hit a million commits in ten years (necessary for building something like Chromium or the Linux kernel), you need a commit every three waking minutes. More realistically, the minimum commit velocity that'd get you there is one commit per minute.

How could you reach a commit per minute?

It takes a minute just to write a commit message. So you need to get rid of writing commit messages. Use git status output, diff, and AI to generate one.

In a minute, you can write around 60 words of text, or speak around 200 words. Using speech as the input device would allow for a higher commit rate when you know what you're doing.

Commits should be made automatically. Commit messages should be spoken or generated automatically.

It's easy to create breaking changes in a minute, so the codebase should be difficult to break. This points towards a non-textual editor, where you work with a visual editor, node graph or AST, or some other symbolic syntatically & parse-level correct representation (Also, getting away from text would allow each keystroke encode for a more complete symbol vs verbose syntax. Read-time syntax should be auto-generated.)

Having slow blocking pre-commit tests is going to negatively impact commit rate. Tests should be extremely fast and in-editor so that introducing breakage is very difficult.

You need to be able to commit from the mobile. This again points towards speech + touch manipulation as the UI for development. If you want to commit every three minutes, it has to be quite ambient, driven by ambient speech (always-on mic on the phone) and gesturing (3d pose tracking, gesture recognition from poses).

The impact achievable in a 200-word commit is moderate. It's about a kilobyte in size, or 30 lines of code. About 300 kB in a day. Expansion is crucial to create impact. A thousand-fold expansion would allow for creation of meaningful projects. A ten million -fold expansion is required for superhuman performance.

## Compound growth

A commit multiplier system that can be applied to its own codebase will show compound growth. If every raw commit to the multiplier system increases its commit factor by 1%, the commit factor grows as 1.01^n where n is the number of commits to the commit multiplier system.

The amount of raw commits in the above system would be 378 at commit 100, 421 at commit 101, 49479 at commit 105 and 6.6e213 at commit 106. This is ridiculous.

## Limits of human performance

GitHub receives 1800 commits per minute (gitlive), or 30 commits per second. If each commit is roughly 30 lines of code and about 1 kB in size, that's 30 kB per second or 2.6 GB per day.

Massive corporations generate on the order of 5 GB of commits per year (5M commits at 1 kB each.) That's around 14 MB per day.

GitHub has around 40 million developer accounts. If each of these developers generates 100 commits per year, they'd generate 4 TB of commits per year, or 11 GB per day.

If every person in the world was a developer and did 100 commits per year, the maximum output of humanity would be 2 TB per day.

The fastest speaker in the world can speak 4.3 MB of text in a day. 24 hours non-stop. Over a year that would amount to 1.6 GB. The theoretical maximum output for humanity is 30 PB of spoken text per day.

If you can generate more than 4.3 MB of code per day, you're weakly superhuman.
If you can generate more than 15 MB of code per day, you're surpassing large corporations.
If you can generate more than 11 GB of code per day, you're surpassing human developers.
If you can generate more than 2 TB of code per day, you're strongly superhuman.
At 30 PB output per day, humanity cannot match it even in theory without using commit multipliers.
