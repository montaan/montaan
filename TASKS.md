### Tasks

# Website engine
    [] Turn README.md into HTML and display it on top of directory

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
    [/] Switch search engine to codesearch
        - codesearch is server-side (it only uses the index to get the names of potentially matching files, then runs grep on the file contents)
    [x] Fix lunr search with <3 letter search queries (Well, it seems to work?)
    [] Shrink search results outside current view
    [] Highlight found search token
    [] Pull and display line snippet context somehow

# Commits
    [] Add a button to toggle commits view
    [] Click on author to show commits by that author
    [] Click on commit to show files touched by commit

# Performance
    [] Pipeline text model creation to avoid frame stutter (probably coming from shader compile / geometry creation)
    [] Handle unlimited number of lines by rendering only a portion
    [] Handle a million commits somehow

# Visualization
    [] Different representation for zoomed-out-text (solid lines minimap)
    [] All files in repo by type (all the images, all the c, all the py, all the rs, all the js)

# Visuals
    [] Fade out text before hiding it
    [] Output a 3D model for rendering with a path tracer
    [] Sparkling precious particle diamonds like on Precious Nature map
    [] Design that makes you feel awesome

# UX tweaks
    [x] Breadcrumb navigation
        [x] Show sibling dirs in breadcrumb (like OSX column view)
    [x] Use scroll for lateral navigation
        [x] In text view, constrain scroll to up-down with snap distance to free scroll (Normally scrolls just up and down but if you go to the side enough, you unlock free scroll)
        [x] Snap scroll to vertical or horizontal, only do freeform after a diagonal swipe
        [x] Better y-x-snap
    [x] Use gestures to zoom on touchpad
    [] Keyboard zoom controls
    [] Zoom text doc left side to screen left side (instead of middle of screen)
    [] Snap scroll to document boundaries
    [] Line numbers for text view
    [] Kb navigation of search results
    [] Hide search results without erasing search term
