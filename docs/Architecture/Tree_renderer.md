## Dynamic tree

[] Tree cache with LRU ejection on size overflow
[] Tree nodes have bboxes
[] Instance list
[] On frame, do breadth-first traversal of tree bboxes to determine the visibility of nodes
[] If a bbox covers the frustum, use bbox matrix as the view root matrix
[] If a node is visible, add it to the visible node list
[] If the visible node list is full, stop traversal

    -- Basically it's the FileZoo model
        - TreeCache in one thread
        - RenderListGen in one thread, turning current camera position to TreeCache requests and render list
        - Renderer just renders the current render list and on receiving a new render list replaces the current one with it.
        - Render list is made out of object instances (instance id, instance params, matrix)
        - The render list is fixed-size
        - Swapping render lists can be done with arraybuffer worker->worker pass
        - The RenderListGen knows roughly how much time it takes to draw each instance in the list -> keeps render list draw time below frame time target
        - RenderListGen keeps only visible objects in the renderlist (with some margin for camera animations)

## File system design

- A single tree with subtree providers mounted at mount points.
- Overlay trees for UI state (selection, search results, links).
- File view providers to load and display files
- Thumbnail provider to store file image mip pyramids
- Layouter converts the tree model into a render model
- Model loader loads the 3D models for the files and directories

## Use cases

Select a source file and see the dependency graph laid out around the file vs. on the filesystem

    - Custom layouter
    - Overlay tree for the dep links
    - Custom tree provider

Show all image files in a long list

    - Custom layouter
    - Custom tree provider

## Different methods for working with files

- Individual file
  - viewer
    - image viewer
    - video viewer
    - text viewer
    - directory ls
  - editor
- Directory tree
  - viewer
    - Photo collection viewer (Lightroom)
    - Audio collection player
  - editor
    - Project folder (VSCode Workspace)
    - File manager
- Selection
  - viewer
  - editor
- Array
  - viewer
    - music / video playlist
  - editor
- Search result
  - viewer
  - editor
- Graph of files
  - viewer
  - editor
