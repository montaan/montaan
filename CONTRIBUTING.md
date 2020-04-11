# Contributing

## North star

### Maximize

1. Commit volume - any problems you have, this will fix...
1. Project quality - ...as long as the commits increase project quality
1. Project scope - expanding scope is required to increase commit volume

### Minimize

1. Merge conflicts - slow down commit flow
1. Merge work - creates bottlenecks in commit flow
1. Errors - decreases value of commits

## In theory

We do a map across all developers to generate a large array of commits.

The array of commits is filtered to ensure they meet minimum acceptable quality.
The remaining commits are bucketed into subsystems and sorted to pick the highest-quality implementations.

The commits are merged into main tree without conflicts or human intervention. In case conflicts or other sync points happen, either retry or sort it out with the people involved, don't try to introduce a sync point across the entire project.

There are commit volume and commit quality boosters at each stage:

-   Pre-commit scripts fix formatting, spelling, linting, and tests passing.
-   Pre-commit scripts generate documentation, tests and other group commit velocity boosters.
-   Ugly machine-generated code is preferred to code written without tooling. We don't use shovels, we use diggers.

## What to expect

The Montaan contribution path follows Wikipedia style. As soon as your PR passes the automated tests, it's merged. Anonymous drive-by PRs are encouraged.

Your edits may get reverted rapidly (again, following Wikipedia style). Reverts must be followed by tests updates to guard against the issues that caused the revert.

New code should go into components that follow the `yarn makeComponent` style. You need a separate directory, `index.tsx`, `ComponentName.tsx`, `ComponentName.test.tsx` and `README.md`. If this sounds like a lot, use `yarn makeComponent` and it'll do it for you. Why this structure? `ComponentName.tsx` gives you a meaningful tab name. `README.md` makes your component easier to understand when browsing the tree. Splitting everything into directories makes the structure composable, so you can move your component somewhere else or increase hierarchy depth without much trouble. `index.tsx` removes the need to write `ComponentName/ComponentName` when importing. Small files reduce the probability of merge conflicts.

Code formatting is imposed by Prettier. The pre-commit hooks should keep your code ship-shape. ESLint warnings cause test failure.

If you're not a native English speaker, don't worry too much about spelling and grammar. We'll fix it post-merge.

Do use the Code Spell Checker VSCode plugin. It'll put a squiggly blue line below misspelled words. Fix all of those or you'll end up with a test failure.

Anonymous commits are encouraged. AI-powered commits are doubly encouraged.
