The thumbnail server stores the mip pyramids for all the files in the store.

The lower mip levels are accessed through a 64-bit key that has a 32-bit block pointer and a 32-bit thumb pointer.
To load a thumbnail:
```
    thumbs = (*Thumb<size>)memmap(blocks[key.block]);
    Thumb<size> thumb = thumbs[key.thumb]; 
```

Lower mip level thumbnails are loaded in blocks by the client: the client requests the thumbnail indices it needs, the server collects the thumbnails into a response buffer (collected response) and sends it over.

Higher mip levels are stored in the database as RGBA webm images and served as collected responses.

Mip levels above 256px are served as tilemaps, with the image being split into multiple 256x256 tiles.

Lower mip levels are aggressively cached and pre-fetched by the client. For small datasets, the client can fetch an entire mip level at above-zero mip and create lower mip levels itself.

Low mip levels require color highlighting to create identifiable patterns, the server should provide a highlight palette and palette indices at low mips.

