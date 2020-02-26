# Source tree vis

## Git vis

1. Display git repo source tree at given revision
2. Display commits, grouped & sorted by date, or grouped by author
3. Draw lines from commits to touched files
4. Draw lines from people to commits & files
5. Draw lines from issues to people & commits & files

## Dependency vis

1. Analyze requires / includes to draw dependency lines from one file to another
2. Highlight unused requires (no symbols from dep used)

## Test vis

1. Color tests green / red based on test passing status
2. Show test coverage by file
3. Draw lines from tests to files & coverage

## Git vis UI model

The two main ways to show an object are highlighting it in the tree and bringing it to fore.
Highlighting displays the object in context but requires navigation to view object details.
Bringing the item to fore displays object details readily but uses a large solid angle and makes the context hard to see.

For single objects, quick dive to detail + back button for quick return is workable.
For multiple objects, bringing related detail to fore is better (e.g. search results with snippets.)
Commit change lists need a view that's a scrollable drill-down list with a diff view of the code files.

Currently selected file
Authors of the file
Commits that modified the file
Diffs that created the file
Timeline of the file
Dependencies of the file

## Code vis

Use https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API to generate a fully resolved AST of codebase, visualize it and make it navigable.
Combine with type-based test generators, auto-perf, V8 emitted code, code coverage, inline editor, live feed of git commits to repo & package updates across all the deps, LM for generating docs from source, LM for suggesting high-quality replacements for AST subtrees + auto-replacement if tests pass / proven functional equivalence.

Live view of the codebase. Live perf of codebase. Live tests update as you write. Live docs update as you write. Live deploy as you write.
