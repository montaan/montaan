### Tasks


## Active


# Website engine
    [] Turn README.md into HTML and display it on top of directory
    [] Display images nicely - design system for directories

# Frontend data model
    [] Move state to React app
        [] Current navigation target
        [] Active commit list
        [] Current commit
        [] Search results

# Layout
    [] Navigation tags
        [] Commit date tags (show "2019-09-01" next to first commit on that date) 
            [] Commit dates in UTC
        [] Author alphabetical tags (show "C" next to first author starting with "C")

# Font
    [] MSDF for sharp corners
    [] Full Unicode support

# Search
    [] Highlight found search token
    [] Search in Commits and Authors

# Commits
    [] Click on author to show commits by that author
        [] Click handler for author timeline (raycast to scene, find closest author to ray if ray is in the active area for authors)
        [] Display list of files touched by author
    [] Click handler for commit timeline (raycast to scene, find closest commit to ray if ray is in the active area for commits)
    [x] Display list of authors who have worked on the file
    [x] Display list of commits and diffs for a file
    [] Crop commit diffs to only ones relevant to file
    [] Link from authors list to files and commits in current active set
    [] Link from commits list to files and authors in current active set

# Performance
    [] Pipeline text model creation to avoid frame stutter (probably coming from shader compile / geometry creation)
    [] Handle unlimited number of lines by rendering only a portion
    [] Handle a million commits somehow

# Visualization
    [] All files in repo by type (all the images, all the c, all the py, all the rs, all the js)

# Visuals
    [] Fade out text before hiding it
    [] Output a 3D model for rendering with a path tracer
    [] Sparkling precious particle diamonds like on Precious Nature map
    [] Design that makes you feel awesome

# UX tweaks
    [] Keyboard zoom controls
    [] Zoom text doc left side to screen left side (instead of middle of screen)
    [] Snap scroll to document boundaries
    [] Line numbers for text view
    [] Kb navigation of search results
    [] Hide search results without erasing search term




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