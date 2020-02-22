# Storing files for personal file archive

Is it feasible to use Git as the underlying database for something like Muryu (100k images per user, PDFs, docs, videos, all sorts of binary files)?

There are not many overwriting changes, unless you allow editing. So the lack of diff is not a major problem. If the collection is used from the server, there's no need to clone the repo. VFS for Git could make clients viable. Only fetch the files you need, only clone the history you need, etc.

Binary files in structured formats that change a lot, e.g. blend files, psd files. You'd want to have bsdiff or something to generate small diffs between the versions for sending over the wire. For local storage, it'd be feasible to just store entire copies, switching over to block-hash based de-duplication and bsdiff when disk space is running out / during maintenance gc.

Structured files could have their own storage format adapters, much like [Courgette](https://chromium.googlesource.com/chromium/src/courgette/+/master). Detect file format, then convert it into a bsdiff-friendly format. At its simplest this could be decompressing compressed files, at the more complex end you could break a file into its constituent pieces and do a stable sort to maintain easy-to-diff ordering. Or even write your own diff system for a file format.

You can even make one with plain git: have a pre-commit hook that converts a file format into a directory of small parts of the file, and a pull hook that puts the parts back together into the big file. That way git's object-per-file de-duplication system can operate on your file.

Avoiding packfiles and gc would be preferable when you're working with a repo full of binary files. Packing the files doesn't give you much benefit (no proper diff) and the pack ends up huge.
