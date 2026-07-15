# Never Leave the Graph View

An Obsidian plugin for a graph-first workflow: **preview, edit, and create notes without ever leaving the graph view.**

The graph stops being a read-only map and becomes the place you actually work.

## How do I never leave the graph view?

**You will now summon a companion pane in the right sidebar, whenever you open the graph view.**

- **Hover a node in the graph view → preview it.** Quickly browse through your notes by hovering on the nodes.

- **Click an existing node → edit it directly in the campanion pane.** Hell yeah dude, hell yeah.

<img alt="Hover Node to Preview and Click to Edit" src="https://github.com/user-attachments/assets/0023f040-7166-473a-bf56-0e82c6bfe0a7" />

   
- **Click a greyed-out node → create it.** The note is created *at that node's position*. Opened for editing immediately. Leave without typing and it quietly deletes itself, reverting the node to grey.

-  **Add a note anywhere.** A button in the graph's control bar, or right-click empty canvas → *New note here* — the note is born at that exact spot.

<img alt="make new node" src="https://github.com/user-attachments/assets/3a689d99-b660-493e-9cf7-84138f4a31a0" />

- **Filter-aware creation.** With a graph filter active, new notes are made to *match* it (created in a `path:` folder, seeded with a `tag:` or search term) so they don't vanish on creation. When conforming isn't possible, the filter is briefly lifted and restored once the note qualifies on its own.

- **An lone eye watching over you, because why not** A little bit of fun. Click to edit a note to make it happy. 

The **companion pane** appears whenever a graph view is open and closes with it.

## Installation (manual)

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release.
2. Copy them into `<your vault>/.obsidian/plugins/graph-node-preview/`.
3. Reload Obsidian and enable the plugin under Settings → Community plugins.

## Notes

This plugin drives Obsidian's graph renderer through internals that aren't part of the public API, so a future Obsidian update could require adjustments.

## Feedback & Support

Thank you for using Never Leave the Graph View! If you run into a bug or have an idea, please [open an issue](https://github.com/yaye-work/obsidian-never-leave-graph-view/issues). Feature requests and bug reports are very welcome.

And if you like NLtGV, you can [buy me a coffee ☕](https://buymeacoffee.com/yaye.work). It's genuinely appreciated.

Happy noting! 
Yaye

## License

MIT © [yaye.work](https://yaye.work) · hi@yaye.work
