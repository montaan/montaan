Thoughts on search
===

Search in Tabletree is about giving you the full result set, highlighted in context and ranked by score.

	- This wouldn't work in big web search because the ranking of results is usually more important than the full context.
	- Works for project search because projects are of limited size and lack spam.
	- Regular [Google-style] search is bad for projects because all hits tend to have similar importance and the goal of the search is either the definition or implementation of the function, and possibly the different uses for it. Often the search is about finding _all_ appearances of a token.

Search should be ranked so that definition and implementation are the top hits, documentation second, uses in code third and tests coming last.

The search visualization should highlight all hits in the tree [+scale the hits so that they're larger than other things]. 
There should also be a ranked list of results with snippets to give source context. 
The results in the ranked list should be linked to the visualization so that you can see where a given result appears in the tree. 
If the result is not visible in the current view, there shouldn't be a line going out from it. 
Hovering over a result should highlight it and its connection to the tree, fading out other connections and visualization highlights.

Search should search both the path of the file and the contents of the files.

	- Is there a GH API to do content search? If there is, it's shit. We can do better.
	- So: clone the repo. Build a search index. Pass the index to the client. Do the search client-side for max responsiveness :----D


The above are based on learnings from the connections prototype:
	- Having a line from each search result to the tree is very messy.
		- The lines occlude the overview and remove focus from the tree hit vis (which is the more important source of information)
		- Zooming in, the lines cross the view, going to various places off-screen and occlude the view
		- Showing only the lines for the currently visible set of results hides where in the list a particular tree result lies
	- The search results set is slow to build because DOM, so it's currently limited to the first 100 hits
		- This is shit.
		- Lies to the user, saying that there's only this many hits (even if there are a thousand more in various dirs)
		- The search lines double the lie, hiding the accurate search vis highlights
		- If showing only first 100 hits, don't draw lines for all
		- If showing all hits, lines are fine
	- The search results set is not very useful as a scrollable list (because paged, Google-thing, unknown how much stuff there is -> give up after first two screens)
		- Use a tabletree for the results set
