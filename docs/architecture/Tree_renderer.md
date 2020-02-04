
Dynamic tree:
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
