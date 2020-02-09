// Search for embarrassingly parallel development structures.

// Level 1 -- merge conflicts require serialization

// Generate a repo structure and multiple topic branches with a
// number of random modifications into the files.
// Merge the topic branches back into master in random order.
// Count the number of merge conflicts.
// The structure with the fewest conflicts wins.

// Level 2 -- Cross-dependencies create merge conflicts

// Generate code organization with deps across files.
// Generate refactoring modifications in topic branches with dev work in others.
// Merge and count conflicts.
// Find minimal conflict count.
