### Tasks

# Strengths

    Keep these in mind when deciding what to work on. Improving these increases project value for everyday use.

    [] Code browsing
    [] Seeing through hierarchy
    [] Understanding structure
    [] Following links visually
    [] Displaying large linkages
    [] Comparing linkages
    [] Lateral navigation
    [] Cherry-picked revert of a file
    [] Browsing large image collections
    [] Opening content in-line
    [] Editing content in-line
    [] Fast filesystem browsing

## Quality targets

    Total [300k]

    World class:
        - Collaboration system [120k]
        - Structure vis [60k]
        - Code understanding [50k]
        - Art workflow [50k]

    Successful:
        - Content playback [5k]
        - Content editing [5k]
        - Repo activity vis [3k]

Architecture change time:
_ Design it operating system style
_ Tree with filesystems mounted onto it
_ Overlay filesystems for things like per-session data, UI state, selections, search highlights, etc. metadata that shouldn't be a part of the filesystem, needs fast edits, and isn't trivial enough to be fully transient UI state.
_ Render list generator that traverses the visible parts of the tree and creates a drawable model out of them.
_ Renderer that draws the render list
_ UI controller that converts UI events and the latest render list into tree edits

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

Use https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API to generate a fully resolved AST of codebase, visualize it and make it navigable.
Combine with type-based test generators, auto-perf, V8 emitted code, code coverage, inline editor, live feed of git commits to repo & package updates across all the deps, LM for generating docs from source, LM for suggesting high-quality replacements for AST subtrees + auto-replacement if tests pass / proven functional equivalence.
Live view of the codebase. Live perf of codebase. Live tests update as you write. Live docs update as you write. Live deploy as you write.

A beautiful landscape with your files and folders in it as 3D models. People and processes as characters doing things in the landscape.

react-component-benchmark
https://buildtracker.dev/
https://sentry.io/welcome/
componentDidCatch
https://astexplorer.net/
Use TypeScript compiler to automate coding & docs & tests:

- Pull type defs to top of file
- Grab all exports
- Use function parameters type to generate tests
- Make generators for native types & use interface declarations to auto-generate generators for interfaces

## Active

Trying to do too many things in one go.
TreeView shouldn't at this stage be about efficient megascene rendering.
It should be about flexible rendering with an eye towards megascenes.

[] Compute element screen
[] Partial tree render
[x] View re-parenting

# KEY FEATURES

    [] Dynamic tree loading
        [x] One directory at a time
            [x] API to load single dirs
            [x] If directory is larger than X, fetch its contents and graft onto file tree
            [x] If directory is smaller than X, remove it from the file tree
        [] Cheap tree updates
            [] Edit tree geometry instead of regenerating the whole thing
            [] Individual models per dir / subtree
        [] Hide and show tree parts
            [x] Based on size
            [] Based on frustum
        [x] Lots of directories at a time
            [x] Batch fetch directories smaller than X
    [x] View re-parenting prototype
        [x] Move camera instead of changing FOV
        [x] Change transformation matrices  when containing object changes
    [] Dynamic commit loading
        [] 10k commits at a time
        [] Calendar data from server
    [] Thumbnail mip pyramid server
        [] Copy from Muryu?
    [] Custom layouts
        [] Move files around
        [] Save file positions in DB
        [] Load file positions from .layout
    [] Workflow to export file / dir models from Blender
        [x] Instanced rendering demo
        [] Load demo models from GLB
        [] Add instancing & model loading to main app
        [] Load models based on directory scene file (e.g. add trees and other props)
        [] Palette editor for live editing of file type looks
    [] Path tracer as renderer
        - For easy instanced rendering of complex scenes
        - For high visual quality
        - Target machine is 3x 2080 Ti

# Make a pleasant place

    [] Party
    [x] Theme music for tasks / parts of project
        [x] Per-dir playlist URL
    [] Artwork

# Plugins

    [] Some sort of plugin system to enable parallel development
    [] TreeProvider
    [] FileInlineProvider
    [] FileViewProvider
    [] LinkageProvider
    [] HistoryProvider
    [] MetadataProvider
    Somehow:
      - Detect when you're viewing a git repo with node_modules, pull in commits and tree history and depcruise.
      - Register FileViewProvider for filename pattern
      - Display directory of photos organized into calendar and events

# "Payment" system

    [] Commit prompt to pay for use via commit

# Frontend data model

    [] Use URIs to refer to objects
        [] commit:sha
        [] author:authorString
    [] When drawing a link, find all objects with the URI

# UX tweaks

    [] Zoom text doc left side to screen left side (instead of middle of screen)
    [] Snap scroll to document boundaries
    [] Line numbers for text view
    [] Kb navigation of search results
    [] Better dashboard view
        [] Recent activity (commits, issues)

# Performance

    [] Optimize lines
        [] Limit to ~10k lines in view
        [] Stratified random sampling
        [] Update visible lines when navigating
    [] Fetch configurable level deep
    [] Server approximates what's visible and sends that in one go
    [] Instanced rendering of all models

# Website engine

    [] Turn README.md into HTML and display it on top of directory
    [] Display images nicely - design system for directories
    [] Use a Blender scene as directory and models as files

# Layout

    [] Layout text files as vertical [] (think of the minimap, source files are tall and narrow)
    [] Split folders into [subdirs | files]
    [] Navigation tags (little models next to long lists like e.g. Android contacts)
        [] Commit date tags (show "2019-09-01" next to first commit on that date)
            [] Commit dates in UTC
        [] Author alphabetical tags (show "C" next to first author starting with "C")

# Font

    [] MSDF for sharp corners
    [] Full Unicode support

# Search

    [] Highlight found search token
    [] Non-regexp search FFS. Exact string matching (case-sensitive).
    [] Color code search results by category
    [] Uncategorized result view

# Backend

    [] Public/private repos
    [] Public repo/list
    [] Better non-logged-in experience
        [] Public repos explorer
    [] Poll server for new commits

# Version history

    [] Compare file at any revision to HEAD in file diff view (so that you can first find a file with code you want to revert, then compare that with the current version to know what to revert.)
    [] Commit view
        [] Show list of files after message (click file to open)
        [] Collapse/expand individual diffs
        [] Navigate
    [] Show commit filter
    [] Don't hide other authors when clicking an author
    [] Editable commit filter
        [] Select multiple authors with
            + - = Author Name <email>
        [] Select date range (ctrl/shift drag)
        [] Crop / expand path filter
    [] Parse change metadata like
        [cleanup][CSA] TNodify InitializeAllocationMemento
        Bug: v8:10021
        Change-Id: I78948e93ca61116a6a1a45ccbc1dfa7c27988c30
        Reviewed-on: https://chromium-review.googlesource.com/c/v8/v8/+/1995391
        Reviewed-by: Maya Lekova <mslekova@chromium.org>
        Commit-Queue: Santiago Aboy Solanes <solanes@chromium.org>
        Cr-Commit-Position: refs/heads/master@{#65730}
    [] Parse URLs into links
    [x] Crop commits by date
    [x] Sort authors by commit count

# Commits

    [] Display list of files touched by author
    [] Navigate to file in zoom view

# Visualization

    [] All files in repo by type (all the images, all the c, all the py, all the rs, all the js)

# Visuals

    [] Fade out text before hiding it
    [x] Output a 3D model for rendering with a path tracer
    [] Sparkling precious particle diamonds like on Precious Nature map
    [] Design that makes you feel awesome

# Payment system

    [] Ad magazine to pay for today's use
    [] Buy ads
    [] Buy platform credits

## Completed

# KEY FEATURES

    [x] [Directories | Files] layout
        [x] 1:1 wide rectangle
        [x] N:M split based on count

# Visuals

    [x] Output a 3D model for rendering with a path tracer

# Backend

    [x] Register & Log in
    [x] Add your own repos (supply repo URL -> pull repo -> add to repo list)
        [x] repo/create
        [x] repo/list
        [x] UI for repo/list
        [x] UI for repo/create
        [x] Make App use repo/list
        [x] View public repo
    [] Better non-logged-in experience
        [x] Public repo MainApp view

# Search

    [x] Add line number to search index
    [x] Group search results by file and sort in-file hits by line number:
        search_result_1.txt
            |- Line 234
            '- Line 625
        search_result_2.txt
            |- Line 23
            |- Line 48
            '- Line 300
        [x] Navigate to line when clicking a line result
    [x] Highlight search hit line
        [x] Draw connection line to hit line
        [x] Add a line-sized quad under each hit line
        [x] Render the damn quads properly (instead of 3 lines)
    [x] Switch search engine to codesearch
        - codesearch is server-side (it only uses the index to get the names of potentially matching files, then runs grep on the file contents)
    [x] Fix lunr search with <3 letter search queries (Well, it seems to work?)
    [x] Shrink search results outside current view
    [x] Pull and display line snippet context somehow
    [z] Score results by relevancy (lunr-style)
    [x] Categorize results
    [x] Search for Commits and Authors

# Commits

    [x] Animated file tree history
    [x] Animated commit history
    [x] Show files touched by single commit
    [x] Show files and commits for author
    [x] Show commits and authors for file
    [x] Add a button to toggle commits view
    [x] Click on commit to show files touched by commit
        [x] Slider to scrub commits
        [x] Frame navigation to go from commit to next
    [x] Click on file to show commits and authors for file (Who worked on this and when and how?)
        [x] Constrain commit slider to file commits
        [x] Show commits under directory hierarchy
        [x] Show diffs for file commits (How did this file came to be?)
    [x] Play button to play commits animation
    [x] Display list of authors who have worked on the file
    [x] Display list of commits and diffs for a file
    [x] Crop commit diffs to only ones relevant to file
    [x] Link from authors list to files and commits in current active set
    [x] Click on author to show commits by that author
        [/] Click handler for author timeline (raycast to scene, find closest author to ray if ray is in the active area for authors)
    [/] Click handler for commit timeline (raycast to scene, find closest commit to ray if ray is in the active area for commits)
    [x] Link from commits list to files and authors in current active set

# Version history

    [x] Single-file version history + moving between versions

# Visualization

    [/] Different representation for zoomed-out-text (solid lines minimap)

# Visuals

    [x] Fix images: proper alpha & CORS

# UX tweaks

    [x] Breadcrumb navigation
        [x] Show sibling dirs in breadcrumb (like OSX column view)
    [x] Use scroll for lateral navigation
        [x] In text view, constrain scroll to up-down with snap distance to free scroll (Normally scrolls just up and down but if you go to the side enough, you unlock free scroll)
        [x] Snap scroll to vertical or horizontal, only do freeform after a diagonal swipe
        [x] Better y-x-snap
    [x] Use gestures to zoom on touchpad
    [x] Parse text file URLs into links
    [x] Find out which letter you clicked on
    [x] Keyboard zoom controls
    [x] Kb navigation in dir contents
    [x] Hide search results without erasing search term
    [x] All my repos

## Data model

    [x] Use React to maintain current UI state
        [x] Slicing-dicing MegaQueryObject to pass down fileTree, highlights, connections
        [x] Search query
        [x] Search results
        [x] Commit filters
        [x] HTML UI elements
    [x] file:filePath URI
    [x] Element-FSEntry
    [x] FSEntry-FSEntry
    [x] Element-Element
    [x] Single line geometry for all lines
        [x] Links
        [x] Search results

# Performance

    [x] Pipeline text model creation to avoid frame stutter (probably coming from shader compile / geometry creation)
    [z] Handle a million commits somehow
