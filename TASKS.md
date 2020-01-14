### Tasks


## Active

# Frontend data model
    [] Links between objects
        [] Use URIs to refer to objects
            [] commit:sha
            [] author:authorString
            [] file:filePath
        [] When drawing a link, find all objects with the URI
        [] Element-FSEntry
        [] FSEntry-FSEntry
        [] Element-Element
        [] Single line geometry for all lines (limit to ~10k lines in view, stratified random sampling, update line set when zooming and navigation)

# UX tweaks
    [] Keyboard zoom controls
    [] Zoom text doc left side to screen left side (instead of middle of screen)
    [] Snap scroll to document boundaries
    [] Line numbers for text view
    [] Kb navigation of search results
    [] Hide search results without erasing search term

# Performance
    [] Pipeline text model creation to avoid frame stutter (probably coming from shader compile / geometry creation)
    [] Handle unlimited number of lines by rendering only a portion
    [] Handle a million commits somehow

# Website engine
    [] Turn README.md into HTML and display it on top of directory
    [] Display images nicely - design system for directories
    [] Use a Blender scene as directory and models as files

# Layout
    [] Navigation tags
        [] Commit date tags (show "2019-09-01" next to first commit on that date) 
            [] Commit dates in UTC
        [] Author alphabetical tags (show "C" next to first author starting with "C")
    [] Layout text files as vertical [] (think of the minimap, source files are tall and narrow)

# Font
    [] MSDF for sharp corners
    [] Full Unicode support

# Search
    [] Highlight found search token
    [] Search for Commits and Authors
    [] Non-regexp search FFS. Exact string matching (case-sensitive).

# Backend
    [x] Register & Log in
    [] Add your own repos (supply repo URL -> pull repo -> add to repo list)
        [x] repo/create
        [x] repo/list
        [] UI for repo/list
        [] UI for repo/create
        [] Make App use repo/list
        [] Public/private repos
        [] Public repo/list
    [] Better non-logged-in experience
        [] Public repo MainApp view
        [] Public repos explorer

# Version history
    [] Commit view
        [] Show list of files after message (click file to open)
        [] Collapse/expand individual diffs
        [] Navigate 
    [] Crop commits by date
    [] Single-file version history + moving between versions
    [] Show commit filter
    [] Don't hide other authors when clicking an author
    [] Sort authors by commit count
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

# Commits
    [x] Click on author to show commits by that author
        [/] Click handler for author timeline (raycast to scene, find closest author to ray if ray is in the active area for authors)
        [] Display list of files touched by author
    [/] Click handler for commit timeline (raycast to scene, find closest commit to ray if ray is in the active area for commits)
    [x] Link from commits list to files and authors in current active set

# Visualization
    [] All files in repo by type (all the images, all the c, all the py, all the rs, all the js)

# Visuals
    [] Fade out text before hiding it
    [] Output a 3D model for rendering with a path tracer
    [] Sparkling precious particle diamonds like on Precious Nature map
    [] Design that makes you feel awesome




## Completed


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

# Commits
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

## Data model
    [x] Use React to maintain current UI state
        [x] Slicing-dicing MegaQueryObject to pass down fileTree, highlights, connections
        [x] Search query
        [x] Search results
        [x] Commit filters
        [x] HTML UI elements
