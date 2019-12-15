### Tasks

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
    [] Shrink search results outside current view
    [] Highlight found search token
    [] Pull and display line snippet context somehow

# Performance
    [] Pipeline text model creation to avoid frame stutter (probably coming from shader compile / geometry creation)
    [] Handle unlimited number of lines by rendering only a portion

# Visualization
    [] Different representation for zoomed-out-text (solid lines minimap)
    [] All files in repo by type (all the images, all the c, all the py, all the rs, all the js)

# Visuals
    [] Fade out text before hiding it
    [] Output a 3D model for rendering with a path tracer
    [] Sparkling precious particle diamonds like on Precious Nature map
    [] Design that makes you feel awesome

# UX tweaks
    [x] Use scroll for lateral navigation
    [x] Breadcrumb navigation
    [x] In text view, constrain scroll to up-down with snap distance to free scroll (Normally scrolls just up and down but if you go to the side enough, you unlock free scroll)
    [] Show sibling dirs in breadcrumb (like OSX column view)
