Mistakes are costly. Most mistakes are easy to detect, given a recording of activity. Eliminating all detectable mistakes gets you into 99.999% performance category.

Eliminate mistakes
_ Detect mistakes
_ Auto-fix what you can
_ Block what you can't, forcing manual fix
_ Minimize impact of mistakes
\_ Minimize lifetime of mistakes

_ Record coding sessions
_ Do video review right after & next morning & rehearse without mistakes
\_ Record and spot mistakes and immediately correct

_ Each function in its own file.
_ Functions can't access globals and closure, you have to pass them in.
_ Well-defined and enforced function structure to quickly parse information about the function to auto-test fuzz and perf and QuickCheck and SmallCheck.
_ Conflicts arise from simultaneous edits into same file -> smaller files. If edits are randomly distributed across all files, and a conflict happens when two edits edit the same file.
