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
Code translators
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

## Compound growth

A commit multiplier system that can be applied to its own codebase will show compound growth. If every raw commit to the multiplier system increases its commit factor by 1%, the commit factor grows as 1.01^n where n is the number of commits to the commit multiplier system.

The amount of raw commits in the above system would be 378 at commit 100, 421 at commit 101, 49479 at commit 105 and 6.6e213 at commit 106. This is ridiculous.

## Limits of human performance

Massive corporations generate on the order of 5 GB of commits per year (5M commits at 1 kB each.) That's around 14 MB per day.

GitHub has around 40 million developer accounts. If each of these developers generates 100 commits per year, they'd generate 4 TB of commits per year, or 11 GB per day.

If every person in the world was a developer and did 100 commits per year, the maximum output of humanity would be 2 TB per day.

The fastest speaker in the world can speak 4.3 MB of text in a day. 24 hours non-stop. Over a year that would amount to 1.6 GB. The theoretical maximum output for humanity is 30 PB of spoken text per day. 

If you can generate more than 4.3 MB of code per day, you're weakly superhuman.
If you can generate more than 15 MB of code per day, you're surpassing large corporations.
If you can generate more than 11 GB of code per day, you're surpassing human developers.
If you can generate more than 2 TB of code per day, you're strongly superhuman.
At 30 PB output per day, humanity cannot match it even in theory without using commit multipliers.
