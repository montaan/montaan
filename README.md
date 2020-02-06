# Montaan

Montaan is an in-browser git repo visualizer.

It displays the git repo as an easy-to-understand 2D hierarchy, with folders surrounding their contents. Projects in supported languages (read: JavaScript) also have dependency graphs to show the dependencies of source files.

There's code search that splits the results into Definition, Documentation, Uses and Tests, making it quick to things in the tree. The search results are overlaid on top of the tree with little pins, making huge result sets navigable.



## Make it better

New features should be initially implemented as components. To create a component, run `yarn makeComponent` in `frontend`.

The components are split into two categories, `qframe` and `Montaan`. Qframe components deal with framework-level stuff like user login, registration, activation etc. Montaan components make up the tree visualizer. 

```sh
cd frontend
yarn makeComponent MyShinyComponent
# Fill in the questionnaire
open src/components/MyShinyComponent/MyShinyComponent.tsx
# Add your component to src/Montaan/index.jsx render() for top-level components
# or under one of the sub-components in src/Montaan.
```


## The focused project description

- Understand a new project quickly (even old projects are new after a while - you forget how they work)
- See who is working on what
- See what is new and what has changed
- See what is related to what
- Target user: freelancers, project managers


## Vis milestones

- First two layers of homedir, with labels (1000 items) [x]
- Full homedir, without labels (500k items) [x]
- Full homedir with labels (500k items) [ ]
- Google Drive contents, with labels (500 items) [ ]
- Google Drive contents, with thumbnails (500 items) [ ]
- Full homedir with labels and thumbnails (500k items) [ ]
- Full local disk contents (2.2M items) [ ]
- English Wikipedia articles (5.5M items) [ ]
- Wikipedia with categories & interlinking (55M-ish) [ ]

