# Architecture

    - Design it operating system style
    - Tree with filesystems mounted onto it
    - Overlay filesystems for things like per-session data, UI state, selections, search highlights, etc. metadata that shouldn't be a part of the filesystem, needs fast edits, and isn't trivial enough to be fully transient UI state.
    - Render list generator that traverses the visible parts of the tree and creates a drawable model out of them.
    - Renderer that draws the render list
    - UI controller that converts UI events and the latest render list into tree edits
    - Well-defined APIs to allow swappable components

## Everything is a vDOM node.

    - Filesystem tree of vDOM nodes
    - Mounts are vDOM nodes that know how to populate themselves
        - Pass in URL and loader => FS API starts to work
        - Loader because the view needs to control the loading pipeline to minimize the number of loads and prioritize their order. The mount can send GET/POST requests wherever through the loader, or use the API.
        - Swapping renderers becomes "easy" -- you take in the FS tree and output renderable vDOM objects
        - Or just wrap each FSEntry in a div and boom! 60000 divs!
    - File viewers as mounts
        - "It's just vDOM nodes, right!?"
    - UI elements as mounts
