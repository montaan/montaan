Working on a new codebase
===

The way I work on a new codebase is by:
	
	1. Get it to compile.

	2. *Browse the code structure* and *skim the code* to get a rough understanding of how it works

		2.1. Browse the source tree to see *what filenames* there are
		2.2. Skim the source code of *interesting files* by looking at the *data structure definitions* and *function names & signatures*
		2.3. Skim through *all the files* one by one *really quickly*
		2.4. *Search the source* to find *function definitions* & *examples of use*

	3. *Jot down notes* about how the API is used in the examples.

		3.1. *Names and signatures* of the called functions.
		3.2. *Order* of calls. *Initialization and teardown*.
		3.3. Call *arguments*. *How the arguments were made*.
		3.4. Example *files loaded*. *Data structures generated* as result of file loads.
		3.5. *Header filenames*.

	3. Change something small / create a small spike function that uses the API. See if it compiles.

	4. *Focused full reading of a file* to gain a fuller understanding of the things surrounding the modified bit.

	5. Deeper modifications if necessary.
