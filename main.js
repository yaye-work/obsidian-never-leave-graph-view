'use strict';

const { Plugin, TFile, Notice, Menu, Keymap, addIcon, setIcon, setTooltip, normalizePath } = require('obsidian');

const GRAPH_VIEW_TYPES = ['graph', 'localgraph'];

// The source artwork is on a 24x24 canvas; wrap each so it fills Obsidian's
// expected 0 0 100 100 viewBox (uniform scale 100/24) and inherits color.
const ICON_ID = 'graph-node-preview';
const ICON_SVG =
  '<g transform="scale(4.16667)" fill="currentColor">' +
  '<path fill-rule="evenodd" clip-rule="evenodd" d="M11.9541 3.53198C12.4662 3.53215 12.8816 3.94772 12.8819 4.4598V7.41359C14.6883 7.48099 16.3833 7.75396 17.8798 8.18677L20.145 5.13512C20.4503 4.72402 21.0323 4.63807 21.4437 4.94304C21.855 5.24842 21.941 5.83032 21.6358 6.24174L19.7076 8.83552C22.3313 9.96575 24 11.6608 24 13.5567L23.9843 13.8733C23.6631 17.1286 18.4202 19.7179 12 19.718L11.9698 19.7168C11.9646 19.7168 11.9593 19.718 11.9541 19.718C11.9368 19.718 11.9194 19.7158 11.9021 19.7156L11.3827 19.7096C5.0426 19.5445 0.000307469 16.8529 0 13.5567L0.0157052 13.239C0.188709 11.489 1.78383 9.9316 4.21987 8.86572L2.27122 6.24174C1.96624 5.83034 2.05205 5.24835 2.4633 4.94304C2.87457 4.6378 3.45649 4.72414 3.76201 5.13512L6.04289 8.20731C7.53281 7.76908 9.22336 7.49154 11.0263 7.41721V4.4598C11.0266 3.94762 11.4418 3.53198 11.9541 3.53198ZM12 9.2511C8.91914 9.25114 6.22139 9.89622 4.36243 10.8506C2.40608 11.8551 1.85563 12.9111 1.85563 13.5567C1.8558 14.2024 2.40624 15.2585 4.36243 16.2629C5.37424 16.7823 6.63482 17.2083 8.07007 17.4903C7.67977 16.8243 7.45515 16.0491 7.45515 15.2215C7.45523 12.7386 9.46982 10.7262 11.9541 10.7262C14.4383 10.7263 16.4517 12.7387 16.4518 15.2215C16.4518 16.0583 16.222 16.8411 15.8236 17.512C17.3029 17.2304 18.6009 16.7951 19.6376 16.2629C21.5936 15.2585 22.1442 14.2024 22.1444 13.5567C22.1444 12.9111 21.5938 11.8551 19.6376 10.8506C17.7786 9.89623 15.0808 9.25114 12 9.2511Z"/>' +
  '</g>';

const NEW_NOTE_ICON_ID = 'graph-node-preview-new-note';
const NEW_NOTE_ICON_SVG =
  '<g transform="scale(4.16667)" fill="currentColor">' +
  '<path d="M19.5437 10.6878C19.5435 5.79725 15.5784 1.83275 10.6878 1.83275C5.79739 1.83298 1.83298 5.79739 1.83275 10.6878C1.83275 15.4256 5.55343 19.2948 10.2323 19.5321L10.6878 19.5437C15.4256 19.5437 19.2948 15.823 19.5321 11.1442L19.5437 10.6878ZM21.3765 10.6878C21.3765 16.5907 16.5907 21.3765 10.6878 21.3765C4.78505 21.3762 0 16.5906 0 10.6878C0.000226699 4.78519 4.78519 0.000226694 10.6878 0C16.5906 0 21.3762 4.78505 21.3765 10.6878Z"/>' +
  '<path d="M11.579 8.61055C11.579 9.26624 12.1105 9.79778 12.7662 9.79778H16.4097C16.9014 9.79778 17.3001 10.1964 17.3001 10.6882C17.3001 11.18 16.9014 11.5786 16.4097 11.5786H12.7662C12.1105 11.5786 11.579 12.1102 11.579 12.7659V16.4102C11.579 16.902 11.1803 17.3006 10.6886 17.3006C10.1968 17.3006 9.79814 16.902 9.79814 16.4102V12.7659C9.79814 12.1102 9.2666 11.5786 8.61091 11.5786H4.96658C4.47481 11.5786 4.07616 11.18 4.07616 10.6882C4.07616 10.1964 4.47481 9.79778 4.96658 9.79778H8.61091C9.2666 9.79778 9.79814 9.26624 9.79814 8.61055V4.96622C9.79814 4.47445 10.1968 4.07579 10.6886 4.07579C11.1803 4.07579 11.579 4.47445 11.579 4.96622V8.61055Z"/>' +
  '</g>';
// Live tab icon: the eye outline from preview.svg plus a pupil that the
// plugin moves toward the pointer. The outline's opening is centered at
// (11.95, 15.22) with radius ~4.5, so a 2.4 pupil can deflect up to ~1.7.
// Live eye, built from the Figma design's labeled layers (Canvas Kit Icon /
// preview-claude): a stroked "eye_socket" outline, and an "eyeball" disc
// clipped by an elliptical "mask" of the eye's interior. The eyeball is the
// part that moves — it rolls behind the socket, the mask keeps it inside.
const EYE_VIEWBOX = '0 0 24 24';
const EYE_SOCKET_D = 'M23.0723 12.8824C23.0723 14.0559 22.1256 15.3539 20.0615 16.4136C18.0462 17.4484 15.1974 18.1158 12 18.1158C8.80264 18.1158 5.95376 17.4483 3.93848 16.4136C1.87453 15.3539 0.927735 14.0559 0.927735 12.8824C0.927738 11.7089 1.87453 10.4109 3.93848 9.35114C5.95376 8.31642 8.80264 7.649 12 7.64899C15.1974 7.64899 18.0462 8.31642 20.0615 9.35114C22.1256 10.4109 23.0723 11.7089 23.0723 12.8824Z';
const EYE_LASH_D = 'M11.9541 7.43375V3.78613M5.30935 8.10249L3.01709 5.01482M18.5988 8.10249L20.8911 5.01482';
const EYEBALL_REST_X = 11.9541;
const EYEBALL_REST_Y = 14.5477;
const EYEBALL_R = 4.497;
let eyeMaskCounter = 0;

// Node emphasis while its note is being edited: 1.33x over 300ms with a
// springy ease (slight overshoot from the 1.4 in the curve).
const EDIT_NODE_SCALE = 1.33;
const EDIT_NODE_SCALE_MS = 300;

// y-for-x evaluator for a CSS-style cubic-bezier easing curve.
function cubicBezierEase(p1x, p1y, p2x, p2y) {
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const xt = 3 * t * (1 - t) * (1 - t) * p1x + 3 * t * t * (1 - t) * p2x + t * t * t - x;
      const dxdt = 3 * (1 - t) * (1 - t) * p1x
        + 6 * t * (1 - t) * (p2x - p1x)
        + 3 * t * t * (1 - p2x);
      if (Math.abs(dxdt) < 1e-6) break;
      t = Math.max(0, Math.min(1, t - xt / dxdt));
    }
    return 3 * t * (1 - t) * (1 - t) * p1y + 3 * t * t * (1 - t) * p2y + t * t * t;
  };
}
const editNodeEase = cubicBezierEase(0.7, 0, 0.4, 1.4);

class GraphNodePreviewPlugin extends Plugin {
  async onload() {
    this.patchedRenderers = [];
    this.hookedEls = new WeakSet();
    this.previewLeaf = null;
    this.opening = false;
    this.locked = false;
    // The path a node was *clicked* to edit (persists until editing ends).
    // Hovering is transient; only an armed note stays shown in the pane.
    this.armedPath = null;
    this.lastPreviewMode = null;
    // Notes created by clicking a grey node this session; if left empty,
    // they are removed again and the node reverts to unresolved.
    this.createdNotes = new Map();
    this.pendingFilterRestore = null;
    // Plugin-created notes not yet "committed" (given real content or a
    // title); their create/delete notices are suppressed as churn.
    this.pendingStubs = new Set();
    this.modifyTimers = new Map();
    this.settings = (await this.loadData()) || {};

    addIcon(ICON_ID, ICON_SVG);
    addIcon(NEW_NOTE_ICON_ID, NEW_NOTE_ICON_SVG);

    this.addCommand({
      id: 'open-panel',
      name: 'Open graph view with preview panel',
      callback: () => {
        // The panel follows the graph, so opening the graph is all it takes;
        // hookGraphViews reveals the panel alongside it.
        if (!this.hasGraphView()) this.openGraphView();
        this.hookGraphViews();
      },
    });

    this.addCommand({
      id: 'toggle-lock',
      name: 'Toggle graph preview lock',
      callback: () => {
        this.locked = !this.locked;
        new Notice(this.locked
          ? 'Graph preview locked — hovers won\'t change it'
          : 'Graph preview unlocked');
      },
    });

    // File-explorer integration (only while a graph view is visible):
    // hovering a file previews it and highlights its node; clicking a
    // markdown file arms it in the preview pane instead of opening a tab.
    this.explorerHoverPath = null;
    this.registerDomEvent(document, 'mouseover', (evt) => this.onExplorerHover(evt));
    this.registerDomEvent(document, 'mouseout', (evt) => this.onExplorerHoverOut(evt));
    this.registerDomEvent(document, 'click', (evt) => this.onExplorerClick(evt), { capture: true });

    // Dim everything but the preview pane while the user is typing in it,
    // so it's obvious where input is going and that hover updates are paused.
    this.registerDomEvent(document, 'focusin', () => this.updateDimming());
    this.registerDomEvent(document, 'focusout', () => this.updateDimming());

    // Esc while editing in the preview pane = Done.
    this.registerDomEvent(document, 'keydown', (evt) => {
      if (evt.key !== 'Escape') return;
      const leaf = this.previewLeaf;
      if (this.isLeafAlive(leaf)
          && leaf.containerEl
          && leaf.containerEl.contains(document.activeElement)) {
        this.finishEditing();
      }
    });

    // The pane's tab icon is a little eye whose pupil follows the pointer.
    this.lastPointer = null;
    this.eyeFrame = null;
    this.wasEditing = false;
    this.scaledNode = null;
    this.lastArmedPos = null;
    this.nodeScaleAnims = new Map();
    this.pinnedHighlight = null;

    // Keep the filter HUD text in sync with graph settings changes made
    // through the native filter panel.
    this.registerInterval(window.setInterval(() => {
      for (const type of GRAPH_VIEW_TYPES) {
        for (const leaf of this.app.workspace.getLeavesOfType(type)) {
          this.updateFilterHud(leaf.view);
        }
      }
    }, 1000));

    // Graph rebuilds (autosave while typing) replace node objects, wiping
    // the armed node's scale-up and leaving the pinned highlight pointing
    // at a dead object (which fades the whole graph); keep both fresh.
    this.registerInterval(window.setInterval(() => {
      if (this.scaledNode && this.wasEditing) {
        if (this.nodeScaleAnims.size === 0) {
          this.ensureNodeScale(this.scaledNode, EDIT_NODE_SCALE);
        }
        // Remember the armed node's live position so a rename can re-pin
        // the renamed node exactly where the old one was.
        const { renderer, nodeId } = this.scaledNode;
        const n = renderer.nodeLookup && renderer.nodeLookup[nodeId];
        if (n && n.x != null) this.lastArmedPos = { renderer, x: n.x, y: n.y };
      }
      // paneBusy (live keyboard focus) rather than the transition flag:
      // after a blur the flag lags a frame, and re-pinning in that window
      // fights the exit cleanup.
      if (this.pinnedHighlight && this.paneBusy()) {
        const { renderer, nodeId } = this.pinnedHighlight;
        const node = renderer.nodeLookup && renderer.nodeLookup[nodeId];
        if (node && renderer.__gnpPinnedNode !== node) {
          renderer.__gnpPinnedNode = node;
          renderer.highlightNode = node;
          if (renderer.changed) renderer.changed();
        }
      }
    }, 250));
    this.registerDomEvent(document, 'mousemove', (evt) => {
      this.lastPointer = { x: evt.clientX, y: evt.clientY };
      if (this.eyeFrame != null) return;
      this.eyeFrame = requestAnimationFrame(() => {
        this.eyeFrame = null;
        this.updateEye();
      });
    });

    // The preview pane lives and dies with the graph view: it appears when
    // a graph opens and closes again when the last graph view is closed.
    this.app.workspace.onLayoutReady(() => this.syncWithGraph());
    this.registerEvent(this.app.workspace.on('layout-change', () => this.syncWithGraph()));
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.syncWithGraph()));

    // Renaming the armed note (e.g. titling a new "Untitled") changes its
    // node id; keep the new node pinned where the old one was.
    this.registerEvent(this.app.vault.on('rename', (file, oldPath) => {
      this.onFileRenamed(file, oldPath);
    }));
    // A deletion rebuilds the graph and can leave a stale hover under the
    // pointer; clear it so nothing gets re-armed.
    this.registerEvent(this.app.vault.on('delete', (file) => {
      if (this.armedPath === file.path) this.armedPath = null;
      // A still-pending stub is a plugin throwaway (abandoned empty note):
      // its deletion is silent.
      const wasStub = this.pendingStubs.delete(file.path);
      this.createdNotes.delete(file.path);
      this.clearGraphHover();
      if (this.notifyReady() && this.isNote(file) && !wasStub) {
        new Notice('Deleted: ' + file.basename);
      }
    }));
    this.registerEvent(this.app.vault.on('create', (file) => {
      // Startup fires create for every existing file; only real, non-stub
      // creations get announced.
      if (this.notifyReady() && this.isNote(file) && !this.pendingStubs.has(file.path)) {
        new Notice('New note: ' + file.basename);
      }
    }));
    this.registerEvent(this.app.vault.on('modify', (file) => {
      this.onVaultModify(file);
    }));
  }

  // A graph leaf can exist but be hidden behind another tab; the graph-first
  // extras should only engage when a graph is actually on screen.
  hasVisibleGraphView() {
    for (const type of GRAPH_VIEW_TYPES) {
      for (const leaf of this.app.workspace.getLeavesOfType(type)) {
        const el = leaf.view && leaf.view.containerEl;
        if (!el) continue;
        if (typeof el.isShown === 'function' ? el.isShown() : el.offsetParent) {
          return true;
        }
      }
    }
    return false;
  }

  // Vault notices are part of the graph-first workflow: only speak when a
  // graph view is actually visible (and never during startup indexing).
  notifyReady() {
    return this.app.workspace.layoutReady && this.hasVisibleGraphView();
  }

  focusGraphLeaf() {
    for (const type of GRAPH_VIEW_TYPES) {
      const graphLeaf = this.app.workspace.getLeavesOfType(type)[0];
      if (graphLeaf) {
        this.app.workspace.setActiveLeaf(graphLeaf, { focus: true });
        return true;
      }
    }
    return false;
  }

  isNote(file) {
    return file instanceof TFile && file.extension === 'md';
  }

  async onVaultModify(file) {
    if (!this.notifyReady() || !this.isNote(file)) return;
    // A plugin stub becomes a real note the moment its content goes beyond
    // what we seeded — announce it then (not on the empty create), and let
    // later edits fall through to the debounced "Modified" notice.
    if (this.pendingStubs.has(file.path)) {
      const entry = this.createdNotes.get(file.path);
      let content = '';
      try { content = await this.app.vault.cachedRead(file); } catch (e) { /* ignore */ }
      if (content.trim() !== ((entry && entry.initial) || '').trim()) {
        this.pendingStubs.delete(file.path);
        new Notice('New note: ' + file.basename);
      }
      return;
    }
    const prev = this.modifyTimers.get(file.path);
    if (prev) window.clearTimeout(prev);
    this.modifyTimers.set(file.path, window.setTimeout(() => {
      this.modifyTimers.delete(file.path);
      // The graph may have closed during the debounce window.
      if (this.notifyReady()) new Notice('Modified: ' + file.basename);
    }, 1200));
  }

  // Migrate armed/spotlight/created state to a note's new path and re-pin
  // its node so titling a freshly created note doesn't fling it away.
  onFileRenamed(file, oldPath) {
    if (this.armedPath !== oldPath) {
      // Not the armed note, but still un-track a created note by its new
      // path so reclaim keys stay correct.
      if (this.createdNotes.has(oldPath)) {
        this.createdNotes.delete(oldPath);
      }
      return;
    }
    const newPath = file.path;

    // Capture where the old node currently sits.
    let pos = null;
    let renderer = null;
    for (const { renderer: r } of this.patchedRenderers) {
      const n = r.nodeLookup && r.nodeLookup[oldPath];
      if (n && n.x != null) { pos = { x: n.x, y: n.y }; renderer = r; break; }
    }
    if (!pos && this.lastArmedPos) {
      pos = { x: this.lastArmedPos.x, y: this.lastArmedPos.y };
      renderer = this.lastArmedPos.renderer;
    }

    // Renaming commits the note: it's deliberate now, no longer an
    // auto-reclaim candidate. Titling a stub is its "created" moment.
    this.createdNotes.delete(oldPath);
    if (this.pendingStubs.delete(oldPath) && this.notifyReady()) {
      new Notice('New note: ' + file.basename);
    }

    this.armedPath = newPath;
    if (this.scaledNode && this.scaledNode.nodeId === oldPath) {
      this.scaledNode = { renderer: this.scaledNode.renderer, nodeId: newPath };
    }
    if (this.pinnedHighlight && this.pinnedHighlight.nodeId === oldPath) {
      this.pinnedHighlight = { renderer: this.pinnedHighlight.renderer, nodeId: newPath };
    }
    if (renderer && pos) this.keepNodeInPlace(renderer, newPath, pos);
  }

  onunload() {
    document.body.classList.remove('gnp-editing');
    document.querySelectorAll('.gnp-graph-pane').forEach((el) => el.removeClass('gnp-graph-pane'));
    this.unpinHighlight();
    for (const t of this.modifyTimers.values()) window.clearTimeout(t);
    this.modifyTimers.clear();
    for (const anim of this.nodeScaleAnims.values()) cancelAnimationFrame(anim);
    this.nodeScaleAnims.clear();
    if (this.scaledNode) {
      const { renderer, nodeId } = this.scaledNode;
      const node = renderer.nodeLookup && renderer.nodeLookup[nodeId];
      if (node && node.__gnpBaseGetSize) {
        node.getSize = node.__gnpBaseGetSize;
        if (renderer.changed) renderer.changed();
      }
      this.scaledNode = null;
    }
    for (const type of GRAPH_VIEW_TYPES) {
      for (const leaf of this.app.workspace.getLeavesOfType(type)) {
        const view = leaf.view;
        if (!view || !view.contentEl) continue;
        const btn = view.contentEl.querySelector('.gnp-new-note');
        if (btn) btn.remove();
        const hud = view.contentEl.querySelector('.gnp-filter-hud');
        if (hud) hud.remove();
      }
    }
    for (const { renderer, originalHover, originalUnhover, originalClick } of this.patchedRenderers) {
      if (renderer.onNodeHover && renderer.onNodeHover.__graphNodePreview) {
        renderer.onNodeHover = originalHover;
      }
      if (renderer.onNodeUnhover && renderer.onNodeUnhover.__graphNodePreview) {
        renderer.onNodeUnhover = originalUnhover;
      }
      if (renderer.onNodeClick && renderer.onNodeClick.__graphNodePreview) {
        renderer.onNodeClick = originalClick;
      }
      if (renderer.__gnpHighlightPatched) {
        renderer.__gnpPinnedNode = null;
        delete renderer.highlightNode;
        renderer.highlightNode = null;
        renderer.__gnpHighlightPatched = false;
      }
    }
    this.patchedRenderers = [];
  }

  hasGraphView() {
    return GRAPH_VIEW_TYPES.some(
      (type) => this.app.workspace.getLeavesOfType(type).length > 0
    );
  }

  openGraphView() {
    const opened = this.app.commands && this.app.commands.executeCommandById
      ? this.app.commands.executeCommandById('graph:open')
      : false;
    if (!opened) {
      this.app.workspace.getLeaf('tab').setViewState({ type: 'graph' });
    }
  }

  syncWithGraph() {
    if (!this.app.workspace.layoutReady) return;
    if (this.hasGraphView()) {
      this.hookGraphViews();
    } else {
      let leaf = this.isLeafAlive(this.previewLeaf) ? this.previewLeaf : null;
      if (!leaf && this.settings.leafId) {
        // A pane restored from a previous session counts too.
        const restored = this.app.workspace.getLeafById(this.settings.leafId);
        if (restored && restored.getRoot() === this.app.workspace.rightSplit) {
          leaf = restored;
        }
      }
      if (leaf) leaf.detach();
      this.previewLeaf = null;
    }
  }

  hookGraphViews() {
    // Refresh the graph-pane marks (used by editing-dim to exempt graph
    // panes without a costly :has()); clear stale ones so a leaf that
    // stopped being a graph loses the exemption.
    document.querySelectorAll('.gnp-graph-pane').forEach((el) => el.removeClass('gnp-graph-pane'));
    for (const type of GRAPH_VIEW_TYPES) {
      for (const leaf of this.app.workspace.getLeavesOfType(type)) {
        const view = leaf.view;
        const leafEl = view && view.containerEl && view.containerEl.closest('.workspace-leaf');
        if (leafEl) leafEl.addClass('gnp-graph-pane');
        this.addGraphControlButton(view);
        this.ensureFilterHud(view);
        const renderer = view && view.renderer;
        if (!renderer) continue;
        // A renderer we haven't seen yet means a graph view just opened;
        // bring the preview pane up alongside it.
        if (!(renderer.onNodeHover && renderer.onNodeHover.__graphNodePreview)) {
          this.ensurePreviewLeaf()
            .then((previewLeaf) => {
              if (previewLeaf) {
                this.app.workspace.revealLeaf(previewLeaf);
                if (!this.armedPath && !this.paneBusy()) this.showBlankState();
              }
            })
            .catch(() => {});
        }
        this.patchRenderer(renderer);
        // Clicking the graph canvas doesn't move keyboard focus, so an
        // editor left focused in the preview pane would keep hover updates
        // paused forever. Blur it explicitly when the graph is clicked.
        const el = renderer.interactiveEl;
        if (el && !this.hookedEls.has(el)) {
          this.hookedEls.add(el);
          // Listen on the pane container, not the canvas: while editing the
          // canvas is pointer-inert, and the click passing through to the
          // container is what ends the editing session.
          this.registerDomEvent(view.contentEl || el, 'pointerdown', () => this.blurPreviewPane());
          // Right-click on empty canvas: offer to create a note right there.
          // (Right-clicks on nodes keep Obsidian's native node menu.)
          this.registerDomEvent(el, 'contextmenu', (evt) => {
            const r = view.renderer;
            if (!r || r.highlightNode) return;
            evt.preventDefault();
            const rect = el.getBoundingClientRect();
            if (rect.width === 0) return;
            // The right-button pointerdown started a pan; the context menu
            // swallows the pointerup that would end it, leaving the graph
            // glued to the cursor. End the gesture ourselves.
            const upInit = {
              bubbles: true,
              button: 2,
              clientX: evt.clientX,
              clientY: evt.clientY,
              pointerId: 1,
              pointerType: 'mouse',
            };
            el.dispatchEvent(new PointerEvent('pointerup', upInit));
            window.dispatchEvent(new PointerEvent('pointerup', upInit));
            // The renderer's own space is CSS px * devicePixelRatio (see
            // its zoomCenter math), so convert the click the same way.
            const dpr = window.devicePixelRatio || 1;
            const scale = r.scale || 1;
            const pos = {
              x: ((evt.clientX - rect.left) * dpr - r.panX) / scale,
              y: ((evt.clientY - rect.top) * dpr - r.panY) / scale,
            };
            const menu = new Menu();
            menu.addItem((item) => item
              .setTitle('New note here')
              .setIcon(NEW_NOTE_ICON_ID)
              .onClick(() => {
                this.createUntitledInGraph(view, pos).catch((e) => {
                  console.error('graph-node-preview:', e);
                });
              }));
            menu.showAtMouseEvent(evt);
          });
        }
      }
    }
  }

  // The graph renderer does its own node hover detection and reports it
  // through the onNodeHover callback (set by the graph view). Wrap it so we
  // hear about hovers too, then pass through to Obsidian's original handler.
  patchRenderer(renderer) {
    const originalHover = renderer.onNodeHover;
    if (originalHover && originalHover.__graphNodePreview) return;
    const originalClick = renderer.onNodeClick;

    const plugin = this;

    const wrappedHover = function (event, nodeId, nodeType, ...rest) {
      try {
        plugin.handleNodeHover(nodeId, nodeType);
      } catch (e) {
        console.error('graph-node-preview:', e);
      }
      if (typeof originalHover === 'function') {
        return originalHover.call(this, event, nodeId, nodeType, ...rest);
      }
    };
    wrappedHover.__graphNodePreview = true;
    renderer.onNodeHover = wrappedHover;

    // The renderer fires this when the pointer leaves a node onto empty
    // canvas. That's our cue to drop a transient preview back to the blank
    // state (unless a node is armed for editing).
    const originalUnhover = renderer.onNodeUnhover;
    const wrappedUnhover = function (...args) {
      try {
        plugin.handleNodeUnhover();
      } catch (e) {
        console.error('graph-node-preview:', e);
      }
      if (typeof originalUnhover === 'function') {
        return originalUnhover.apply(this, args);
      }
    };
    wrappedUnhover.__graphNodePreview = true;
    renderer.onNodeUnhover = wrappedUnhover;

    // Clicking a node means "edit it in the preview pane": hover is the
    // volatile peek, click is the commit. Cmd/Ctrl-click falls through to
    // Obsidian's default (open in a main tab), and so do tag nodes.
    const wrappedClick = function (event, nodeId, nodeType, ...rest) {
      const isMod = event && Keymap.isModEvent && Keymap.isModEvent(event);
      if (nodeId && !isMod) {
        if (nodeType === 'unresolved') {
          // Remember where the grey node sits so the created note's node
          // can be pinned to the same spot instead of re-laid-out elsewhere.
          const node = this.nodeLookup && this.nodeLookup[nodeId];
          const pos = node && node.x != null ? { x: node.x, y: node.y } : null;
          plugin.createAndEditInPreview(nodeId, this, pos).catch((e) => {
            console.error('graph-node-preview:', e);
          });
          return;
        }
        if (nodeType !== 'tag') {
          const file = plugin.app.vault.getAbstractFileByPath(nodeId);
          if (file instanceof TFile) {
            plugin.editInPreview(file).catch((e) => {
              console.error('graph-node-preview:', e);
            });
            return;
          }
        }
      }
      if (typeof originalClick === 'function') {
        return originalClick.call(this, event, nodeId, nodeType, ...rest);
      }
    };
    wrappedClick.__graphNodePreview = true;
    renderer.onNodeClick = wrappedClick;

    this.patchedRenderers.push({ renderer, originalHover, originalUnhover, originalClick });
  }

  // Once the freshly created note shows up in the graph (under its full
  // path as node id), snap it to where the unresolved node was, hold it
  // there while the simulation settles, then let it float freely again.
  keepNodeInPlace(renderer, nodeId, pos) {
    if (!renderer || !renderer.worker || !pos) return;
    const start = performance.now();
    // Ask the worker ahead of time in case it already knows the node.
    renderer.worker.postMessage({ forceNode: { id: nodeId, x: pos.x, y: pos.y } });
    const tryPin = () => {
      const node = renderer.nodeLookup && renderer.nodeLookup[nodeId];
      if (!node) {
        if (performance.now() - start < 5000) requestAnimationFrame(tryPin);
        return;
      }
      // fx/fy pin the rendered position locally on the very next frame,
      // so the node never draws at the worker's random spawn point.
      node.x = pos.x;
      node.y = pos.y;
      node.fx = pos.x;
      node.fy = pos.y;
      renderer.worker.postMessage({ forceNode: { id: nodeId, x: pos.x, y: pos.y } });
      if (renderer.changed) renderer.changed();
      setTimeout(() => {
        const pinned = renderer.nodeLookup && renderer.nodeLookup[nodeId];
        if (pinned) {
          pinned.fx = null;
          pinned.fy = null;
        }
        if (renderer.worker) {
          renderer.worker.postMessage({ forceNode: { id: nodeId, x: null, y: null } });
        }
      }, 2500);
    };
    requestAnimationFrame(tryPin);
  }

  // Add our "new note" button to the graph's floating control buttons
  // (bottom of the gear / timelapse stack in the top-left), reusing the
  // native classes so it matches their size and hover styling exactly.
  addGraphControlButton(view) {
    if (!view || !view.contentEl) return;
    const controls = view.contentEl.querySelector('.graph-controls');
    if (!controls || controls.querySelector('.gnp-new-note')) return;

    const btn = controls.createDiv('clickable-icon graph-controls-button gnp-new-note');
    setIcon(btn, NEW_NOTE_ICON_ID);
    setTooltip(btn, 'New note in graph preview', { placement: 'right' });
    btn.addEventListener('click', () => {
      this.createUntitledInGraph(view).catch((e) => {
        console.error('graph-node-preview:', e);
      });
    });
  }

  // Toolbar button on the graph view: create a fresh untitled note, drop
  // its node at the center of the current viewport, and start editing it
  // in the preview pane right away.
  // Break a graph search query into pieces a new note can conform to:
  // path: → destination folder, tag: → seed tags, plain words → seed text.
  // Returns null when the query has anything we can't conform to safely.
  parseConformableQuery(search) {
    const tokens = search.match(/(?:[A-Za-z]+:)?"[^"]*"|\S+/g) || [];
    const out = { folder: null, tags: [], words: [] };
    for (const token of tokens) {
      const m = token.match(/^([A-Za-z]+):(.*)$/);
      if (m) {
        const value = m[2].replace(/^"|"$/g, '');
        if (m[1].toLowerCase() === 'path' && value) {
          if (out.folder) return null;
          out.folder = value;
        } else if (m[1].toLowerCase() === 'tag' && value) {
          const tag = value.replace(/^#/, '');
          if (!/^[\w/-]+$/.test(tag)) return null;
          out.tags.push(tag);
        } else {
          return null;
        }
      } else if (/^[\w-]+$/.test(token)) {
        out.words.push(token);
      } else {
        return null;
      }
    }
    return out;
  }

  // Small text pill at the bottom center of the graph so an active filter
  // is never invisible context.
  ensureFilterHud(view) {
    if (!view || !view.contentEl) return;
    if (!view.contentEl.querySelector('.gnp-filter-hud')) {
      view.contentEl.createDiv('gnp-filter-hud');
    }
    this.updateFilterHud(view);
  }

  updateFilterHud(view) {
    if (!view || !view.contentEl) return;
    const hud = view.contentEl.querySelector('.gnp-filter-hud');
    if (!hud) return;
    let text = '';
    try {
      const engine = view.dataEngine || view.engine;
      const opts = engine && engine.getOptions ? engine.getOptions() || {} : {};
      const parts = [];
      if (opts.search) parts.push('Filter: ' + opts.search);
      if (opts.showOrphans === false) parts.push('orphans hidden');
      text = parts.join('  ·  ');
    } catch (e) { /* HUD is cosmetic; never break the graph over it */ }
    if (hud.textContent !== text) hud.textContent = text;
    hud.toggleClass('gnp-hud-hidden', text.length === 0);
  }

  // A brand-new note would normally be invisible under an active filter.
  // Preferred approach: make the note conform to the filter (right folder,
  // seed tags/words). Only when the query is too complex do we fall back to
  // temporarily overriding the filter and restoring it later (see
  // maybeRestoreGraphFilters). Orphan visibility always needs the temporary
  // override, since a new note can't conform to "has links".
  accommodateFilter(view) {
    const engine = view && (view.dataEngine || view.engine);
    let prev = null;
    let conform = null;
    if (engine && engine.setOptions && engine.getOptions) {
      try {
        const opts = engine.getOptions() || {};
        if (opts.search) conform = this.parseConformableQuery(opts.search);
        const changes = {};
        prev = {};
        if (opts.search && !conform) {
          changes.search = '';
          prev.search = opts.search;
        }
        if (opts.showOrphans === false) {
          changes.showOrphans = true;
          prev.showOrphans = false;
        }
        if (Object.keys(changes).length > 0) {
          engine.setOptions(changes);
          if (engine.requestUpdateSearch) engine.requestUpdateSearch();
        } else {
          prev = null;
        }
      } catch (e) {
        prev = null;
        console.error('graph-node-preview:', e);
      }
    }
    return { engine, conform, prev };
  }

  async ensureFolderPath(folder) {
    const normalized = normalizePath(folder.replace(/^\/+|\/+$/g, ''));
    let cur = '';
    for (const seg of normalized.split('/')) {
      cur = cur ? cur + '/' + seg : seg;
      if (!this.app.vault.getAbstractFileByPath(cur)) {
        await this.app.vault.createFolder(cur).catch(() => {});
      }
    }
    return normalized ? normalized + '/' : '';
  }

  defaultNewNoteDir() {
    const parent = this.app.fileManager.getNewFileParent('');
    return parent && parent.path && parent.path !== '/' ? parent.path + '/' : '';
  }

  // Seed content that makes the note match the filter. Words already in the
  // note's name match by themselves and don't need seeding.
  conformSeed(conform, basename) {
    if (!conform) return '';
    const parts = [];
    if (conform.tags.length > 0) parts.push(conform.tags.map((t) => '#' + t).join(' '));
    const lower = (basename || '').toLowerCase();
    const words = conform.words.filter((w) => !lower.includes(w.toLowerCase()));
    if (words.length > 0) parts.push(words.join(' '));
    return parts.length > 0 ? parts.join('\n') + '\n' : '';
  }

  getGraphViewForRenderer(renderer) {
    for (const type of GRAPH_VIEW_TYPES) {
      for (const leaf of this.app.workspace.getLeavesOfType(type)) {
        if (leaf.view && leaf.view.renderer === renderer) return leaf.view;
      }
    }
    return null;
  }

  async createUntitledInGraph(view, posOverride) {
    const { engine, conform, prev } = this.accommodateFilter(view);

    const dir = conform && conform.folder
      ? await this.ensureFolderPath(conform.folder)
      : this.defaultNewNoteDir();
    const initial = this.conformSeed(conform, 'Untitled');

    let name = 'Untitled';
    for (let i = 1; this.app.vault.getAbstractFileByPath(normalizePath(dir + name + '.md')); i++) {
      name = 'Untitled ' + i;
    }
    const stubPath = normalizePath(dir + name + '.md');
    this.pendingStubs.add(stubPath);
    const file = await this.app.vault.create(stubPath, initial);

    const renderer = view && view.renderer;
    let pos = posOverride || null;
    if (!pos && renderer && renderer.width != null && renderer.scale) {
      pos = {
        x: (renderer.width / 2 - renderer.panX) / renderer.scale,
        y: (renderer.height / 2 - renderer.panY) / renderer.scale,
      };
    }
    this.createdNotes.set(file.path, { linktext: file.basename, renderer, pos, initial });
    if (prev) this.pendingFilterRestore = { engine, prev, path: file.path };
    if (renderer && pos) this.keepNodeInPlace(renderer, file.path, pos);
    await this.editInPreview(file);
  }

  // Put temporarily overridden graph filters back, but only once doing so
  // won't hide the note that prompted the override: the search filter comes
  // back when the note's name/content matches it (or the note is gone), and
  // "show orphans: off" comes back once the note has a link (or is gone).
  async maybeRestoreGraphFilters() {
    const pending = this.pendingFilterRestore;
    if (!pending) return;
    const { engine, prev, path } = pending;
    const file = this.app.vault.getAbstractFileByPath(path);

    const restore = {};
    if (!(file instanceof TFile)) {
      Object.assign(restore, prev);
    } else {
      if (prev.search != null) {
        const q = prev.search.toLowerCase().trim();
        // Only attempt matching for plain-text queries; complex queries
        // (path:, tag:, quotes...) keep the filter cleared to stay safe.
        if (q && !/[:"[\]()]/.test(q)) {
          const content = (await this.app.vault.cachedRead(file)).toLowerCase();
          if (file.basename.toLowerCase().includes(q) || content.includes(q)) {
            restore.search = prev.search;
          }
        }
      }
      if (prev.showOrphans === false) {
        const resolved = this.app.metadataCache.resolvedLinks || {};
        const outgoing = resolved[file.path]
          && Object.keys(resolved[file.path]).length > 0;
        let incoming = false;
        if (!outgoing) {
          for (const source in resolved) {
            if (resolved[source][file.path]) { incoming = true; break; }
          }
        }
        if (outgoing || incoming) restore.showOrphans = false;
      }
    }

    if (Object.keys(restore).length > 0) {
      try {
        engine.setOptions(restore);
        if (engine.requestUpdateSearch) engine.requestUpdateSearch();
      } catch (e) {
        console.error('graph-node-preview:', e);
      }
    }

    if (!(file instanceof TFile)) {
      this.pendingFilterRestore = null;
      return;
    }
    const remaining = {};
    if (prev.search != null && restore.search == null) remaining.search = prev.search;
    if (prev.showOrphans != null && restore.showOrphans == null) {
      remaining.showOrphans = prev.showOrphans;
    }
    this.pendingFilterRestore = Object.keys(remaining).length > 0
      ? { engine, prev: remaining, path }
      : null;
  }

  async createAndEditInPreview(linktext, renderer, pos) {
    // The unresolved node id is the link text; if a matching file somehow
    // exists, use it, otherwise create it — accommodating any active graph
    // filter so the freshly resolved node doesn't get filtered out.
    let file = this.app.metadataCache.getFirstLinkpathDest(linktext, '');
    if (!file) {
      // Link text with characters Obsidian forbids in file names (e.g. ":")
      // can never become a file; creating would throw and leave the plugin
      // in a half-armed state. Say so instead.
      if (/[\\:]/.test(linktext)) {
        new Notice('Can\'t create "' + linktext
          + '": file names can\'t contain \\ or :');
        return;
      }
      const view = this.getGraphViewForRenderer(renderer);
      const { engine, conform, prev } = this.accommodateFilter(view);

      const name = linktext.endsWith('.md') ? linktext : linktext + '.md';
      // A linktext with its own path keeps it; a bare name goes to the
      // filter's path: folder when one is set, else the default location.
      const dir = conform && conform.folder && !name.includes('/')
        ? await this.ensureFolderPath(conform.folder)
        : this.defaultNewNoteDir();
      const path = normalizePath(dir + name);
      const parentDir = path.substring(0, path.lastIndexOf('/'));
      if (parentDir && !this.app.vault.getAbstractFileByPath(parentDir)) {
        await this.ensureFolderPath(parentDir);
      }
      const initial = this.conformSeed(conform, linktext);
      this.pendingStubs.add(path);
      file = await this.app.vault.create(path, initial);
      this.createdNotes.set(file.path, { linktext, renderer, pos, initial });
      if (prev) this.pendingFilterRestore = { engine, prev, path: file.path };
      this.keepNodeInPlace(renderer, file.path, pos);
    }
    if (!(file instanceof TFile)) return;
    await this.editInPreview(file);
  }

  // Open a file in the preview pane focused for editing: keyboard focus
  // moves into the editor, which also pauses hover swaps and turns on the
  // editing orientation (dimming, accent border, badge).
  async editInPreview(file) {
    const leaf = await this.ensurePreviewLeaf();
    if (!leaf) return;
    // Clicking commits: this note is armed and stays shown while editing.
    this.armedPath = file.path;
    await this.maybeReclaimEmptyNote(file.path);
    const openState = file.extension === 'md'
      ? { active: true, state: { mode: 'source' } }
      : { active: true };
    await this.openInPreview(leaf, file, openState);
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
    this.app.workspace.revealLeaf(leaf);
    const view = leaf.view;
    if (view && view.editor) {
      view.editor.focus();
      // Land the cursor after any seeded content, ready to type.
      const lastLine = view.editor.lastLine();
      view.editor.setCursor(lastLine, view.editor.getLine(lastLine).length);
    }
    this.updateDimming();
  }

  updateDimming() {
    // Wait a frame so document.activeElement reflects the finished focus move.
    requestAnimationFrame(() => {
      const leaf = this.previewLeaf;
      const alive = this.isLeafAlive(leaf);
      // Editing requires BOTH keyboard focus in the pane AND an explicitly
      // armed node (set only by a real node click). Focus returning to the
      // pane on its own — e.g. a context menu or delete closing — must not
      // arm the last hovered note.
      const editing = !!this.armedPath
        && alive
        && leaf.containerEl
        && leaf.containerEl.contains(document.activeElement);
      document.body.classList.toggle('gnp-editing', !!editing);
      if (alive && leaf.containerEl) {
        leaf.containerEl.classList.toggle('gnp-preview-pane', !!editing);
      }
      if (alive) this.installEye(leaf);
      // Blink once whenever editing starts or ends, and pop the edited
      // note's graph node up / back down with it.
      if (!!editing !== this.wasEditing) {
        this.wasEditing = !!editing;
        this.blinkEye();
        if (editing) {
          this.scaleUpEditedNode();
        } else {
          // Cheap visual teardown immediately; the workspace surgery
          // (view swap, reclaim, focus moves) waits 200ms so whatever
          // gesture caused this exit — e.g. a click on the settings gear —
          // fully lands before we churn the workspace under it.
          this.scaleDownEditedNode();
          this.armedPath = null;
          window.setTimeout(() => {
            this.onEditingEnded().catch((e) => console.error('graph-node-preview:', e));
          }, 200);
        }
      }
    });
  }

  // Every editing exit funnels through here, whatever caused it (click on
  // the graph, Esc, focus moving to another pane): disarm, reclaim an
  // abandoned empty note, then return everything to the idle blank state.
  async onEditingEnded() {
    // Deferred from the exit transition; a new edit may have started in
    // the meantime — leave it alone (visual teardown already happened).
    if (this.wasEditing || this.armedPath) return;
    try {
      // Read the abandoned-empty verdict while the file is still open,
      // but blank the pane BEFORE deleting: a file that isn't open in any
      // pane triggers no deleted-file handling — no history restoring the
      // last hovered note into the pane, no pane getting closed.
      const candidate = await this.getReclaimCandidate();
      await this.blankOutPane();
      if (candidate) await this.reclaimNote(candidate);
      await this.maybeRestoreGraphFilters();
    } catch (e) {
      console.error('graph-node-preview:', e);
    }
    // If a new edit started while we were busy, leave it alone.
    if (this.wasEditing || this.armedPath) return;
    this.clearGraphHover();
  }

  // True blank state: no file open in the pane at all. This clears the
  // graph's "open file" accent on the node and prevents the pane's history
  // from resurrecting the previously shown note after a deletion.
  async blankOutPane() {
    const leaf = this.previewLeaf;
    if (!this.isLeafAlive(leaf)) return;
    if (leaf.view && leaf.view.getViewType() !== 'empty') {
      // Remember the reading/editing mode across the blank gap.
      if (leaf.view.getViewType() === 'markdown' && leaf.view.getState) {
        const state = leaf.view.getState();
        if (state && state.mode) this.lastPreviewMode = state.mode;
      }
      await leaf.setViewState({ type: 'empty' });
      this.applyPreviewIcon(leaf);
    }
    // The empty view (or its neighbors) must not hold keyboard focus, or
    // we'd still count as "editing".
    const active = document.activeElement;
    if (leaf.containerEl && active && leaf.containerEl.contains(active)) {
      active.blur();
    }
    // Don't leave the emptied pane as the active leaf (an empty view
    // swallows leaf-scoped hotkeys) — but wait for the gesture that caused
    // this exit to land first, and yield if anything else claimed focus
    // (e.g. the user clicked the settings gear and a modal opened; stealing
    // focus mid-click would eat that click).
    window.setTimeout(() => {
      if (this.wasEditing || this.armedPath) return;
      const active = document.activeElement;
      const focusIsLoose = !active
        || active === document.body
        || (leaf.containerEl && leaf.containerEl.contains(active));
      if (focusIsLoose && this.app.workspace.activeLeaf === leaf) {
        this.focusGraphLeaf();
      }
    }, 150);
    this.showBlankState();
    this.updateDimming();
  }

  // Wait (a few seconds at most) for a node id to appear in some graph —
  // a note created a moment ago only gets its node once metadata resolves.
  waitForGraphNode(nodeId, cb) {
    const start = performance.now();
    const tick = () => {
      for (const { renderer } of this.patchedRenderers) {
        if (renderer.nodeLookup && renderer.nodeLookup[nodeId]) {
          cb(renderer);
          return;
        }
      }
      if (performance.now() - start < 4000) requestAnimationFrame(tick);
    };
    tick();
  }

  scaleUpEditedNode() {
    const leaf = this.previewLeaf;
    const file = this.isLeafAlive(leaf) && leaf.view && leaf.view.file;
    if (!file) return;
    // The pre-click hover highlight may reference a node object that no
    // longer exists (a grey node replaced by the real one) — a dead
    // highlight fades the whole graph. Start clean; the pin follows.
    this.clearGraphHover();
    const nodeId = file.path;
    this.waitForGraphNode(nodeId, (renderer) => {
      // Bail if editing ended (or moved on) while we waited.
      const currentLeaf = this.previewLeaf;
      if (!this.wasEditing
          || !this.isLeafAlive(currentLeaf)
          || !currentLeaf.view
          || !currentLeaf.view.file
          || currentLeaf.view.file.path !== nodeId) return;
      const target = { renderer, nodeId };
      if (this.scaledNode && this.scaledNode.nodeId !== nodeId) {
        this.animateNodeScale(this.scaledNode, 1);
      }
      this.scaledNode = target;
      this.bringNodeToFront(target);
      this.pinHighlight(target);
      this.animateNodeScale(target, EDIT_NODE_SCALE);
    });
  }

  // Keep Obsidian's native hover spotlight (node + linked neighbors bright,
  // everything else faded) alive while the note is being edited. The
  // renderer clears/reassigns highlightNode from several internal paths, so
  // instead of racing it, highlightNode becomes an accessor that pins to
  // our node while __gnpPinnedNode is set.
  pinHighlight(target) {
    const { renderer, nodeId } = target;
    const node = renderer.nodeLookup && renderer.nodeLookup[nodeId];
    if (!node) return;
    if (!renderer.__gnpHighlightPatched) {
      let current = renderer.highlightNode;
      Object.defineProperty(renderer, 'highlightNode', {
        configurable: true,
        get() { return current; },
        set(value) {
          current = renderer.__gnpPinnedNode || value;
        },
      });
      renderer.__gnpHighlightPatched = true;
    }
    this.pinnedHighlight = { renderer, nodeId };
    renderer.__gnpPinnedNode = node;
    renderer.highlightNode = node;
    if (renderer.changed) renderer.changed();
  }

  unpinHighlight() {
    if (!this.pinnedHighlight) return;
    const { renderer } = this.pinnedHighlight;
    this.pinnedHighlight = null;
    renderer.__gnpPinnedNode = null;
    renderer.highlightNode = null;
    if (renderer.changed) renderer.changed();
  }

  // Pixi draws children in order, so re-appending a node's display objects
  // to their parent container moves them to the top of the draw order.
  bringNodeToFront(target) {
    const { renderer, nodeId } = target;
    const node = renderer.nodeLookup && renderer.nodeLookup[nodeId];
    if (!node) return;
    for (const key of ['circle', 'text']) {
      const obj = node[key];
      if (obj && obj.parent && typeof obj.parent.addChild === 'function') {
        obj.parent.addChild(obj);
      }
    }
    if (renderer.changed) renderer.changed();
  }

  scaleDownEditedNode() {
    this.unpinHighlight();
    if (!this.scaledNode) return;
    this.animateNodeScale(this.scaledNode, 1);
    this.scaledNode = null;
  }

  // Apply a scale factor to whatever node object currently answers to this
  // id. The graph rebuilds node objects on data changes (e.g. autosave of
  // the note being edited), so the getSize wrapper must be re-installed on
  // the current object every time, never cached.
  ensureNodeScale(target, factor) {
    const { renderer, nodeId } = target;
    const node = renderer.nodeLookup && renderer.nodeLookup[nodeId];
    if (!node) return;
    if (!node.__gnpBaseGetSize) {
      node.__gnpBaseGetSize = node.getSize.bind(node);
      node.__gnpScale = 1;
      node.getSize = () => node.__gnpBaseGetSize() * (node.__gnpScale || 1);
    }
    if (node.__gnpScale !== factor) {
      node.__gnpScale = factor;
      if (renderer.changed) renderer.changed();
    }
  }

  // Animate a node's rendered size, resolving the node by id each frame so
  // object churn mid-animation can't strand the scale.
  animateNodeScale(target, to) {
    const { renderer, nodeId } = target;
    const prev = this.nodeScaleAnims.get(nodeId);
    if (prev != null) cancelAnimationFrame(prev);

    const startNode = renderer.nodeLookup && renderer.nodeLookup[nodeId];
    const from = (startNode && startNode.__gnpScale) || 1;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / EDIT_NODE_SCALE_MS, 1);
      const value = p >= 1 ? to : from + (to - from) * editNodeEase(p);
      this.ensureNodeScale(target, value);
      if (p < 1) {
        this.nodeScaleAnims.set(nodeId, requestAnimationFrame(step));
      } else {
        this.nodeScaleAnims.delete(nodeId);
      }
    };
    this.nodeScaleAnims.set(nodeId, requestAnimationFrame(step));
  }

  blinkEye() {
    for (const svg of document.querySelectorAll('.gnp-eye-svg')) {
      svg.classList.remove('gnp-blink');
      // Force a reflow so re-adding the class restarts the animation.
      void svg.getBoundingClientRect();
      svg.classList.add('gnp-blink');
      window.setTimeout(() => svg.classList.remove('gnp-blink'), 500);
    }
  }

  // Where the pane's tab icon lives. Try the leaf property first, then a
  // DOM query on the tab header as a fallback across Obsidian versions.
  getTabIconEl(leaf) {
    if (!leaf) return null;
    if (leaf.tabHeaderInnerIconEl) return leaf.tabHeaderInnerIconEl;
    if (leaf.tabHeaderEl) {
      return leaf.tabHeaderEl.querySelector('.workspace-tab-header-inner-icon');
    }
    return null;
  }

  buildEyeSvg() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', EYE_VIEWBOX);
    svg.classList.add('gnp-eye-svg');

    // eye socket: stroked ellipse outline (squashes shut during a blink).
    const socket = document.createElementNS(ns, 'path');
    socket.setAttribute('d', EYE_SOCKET_D);
    socket.setAttribute('fill', 'none');
    socket.setAttribute('stroke', 'currentColor');
    socket.setAttribute('stroke-width', '1.7');
    socket.setAttribute('stroke-linecap', 'round');
    socket.setAttribute('stroke-linejoin', 'round');
    socket.setAttribute('vector-effect', 'non-scaling-stroke');
    socket.classList.add('gnp-lid');
    svg.appendChild(socket);

    // mask: the eye's interior; the eyeball only shows inside it.
    const maskId = 'gnp-eye-mask-' + (++eyeMaskCounter);
    const mask = document.createElementNS(ns, 'mask');
    mask.setAttribute('id', maskId);
    mask.setAttribute('maskUnits', 'userSpaceOnUse');
    mask.setAttribute('x', '0');
    mask.setAttribute('y', '6');
    mask.setAttribute('width', '25');
    mask.setAttribute('height', '14');
    mask.setAttribute('vector-effect', 'non-scaling-stroke');

    const maskShape = document.createElementNS(ns, 'ellipse');
    maskShape.setAttribute('cx', '12.0003');
    maskShape.setAttribute('cy', '12.8824');
    maskShape.setAttribute('rx', '11.9999');
    maskShape.setAttribute('ry', '6.16114');
    maskShape.setAttribute('fill', '#fff');
    maskShape.classList.add('gnp-mask-shape');
    maskShape.setAttribute('vector-effect', 'non-scaling-stroke');
    mask.appendChild(maskShape);
    svg.appendChild(mask);

    // eyeball: the moving part, rolling behind the socket.
    const maskedGroup = document.createElementNS(ns, 'g');
    maskedGroup.setAttribute('mask', 'url(#' + maskId + ')');
    const eyeball = document.createElementNS(ns, 'circle');
    eyeball.classList.add('gnp-pupil');
    eyeball.setAttribute('cx', String(EYEBALL_REST_X));
    eyeball.setAttribute('cy', String(EYEBALL_REST_Y));
    eyeball.setAttribute('r', String(EYEBALL_R));
    eyeball.setAttribute('fill', 'currentColor');
    maskedGroup.appendChild(eyeball);
    svg.appendChild(maskedGroup);

    // eyelash: on top; rides down with the blink without squashing.
    const lash = document.createElementNS(ns, 'path');
    lash.setAttribute('d', EYE_LASH_D);
    lash.setAttribute('fill', 'none');
    lash.setAttribute('stroke', 'currentColor');
    lash.setAttribute('stroke-width', '1.7');
    lash.setAttribute('stroke-linecap', 'round');
    lash.setAttribute('stroke-linejoin', 'round');
    lash.setAttribute('vector-effect', 'non-scaling-stroke');
    lash.classList.add('gnp-lash');
    svg.appendChild(lash);

    return svg;
  }

  // Replace the pane's static tab icon with a live eye whose pupil follows
  // the mouse pointer, and add a larger one to the pane's header where the
  // movement is actually legible. Idempotent — safe to call repeatedly.
  installEye(leaf) {
    const iconEl = this.getTabIconEl(leaf);
    if (iconEl && !iconEl.querySelector('.gnp-eye-svg')) {
      iconEl.empty();
      iconEl.appendChild(this.buildEyeSvg());
    }

    const view = leaf && leaf.view;
    const header = view && view.containerEl
      && view.containerEl.querySelector('.view-header');
    if (header && !header.querySelector('.gnp-header-eye')) {
      const actions = header.querySelector('.view-actions');
      const wrap = document.createElement('span');
      wrap.classList.add('gnp-header-eye');
      wrap.appendChild(this.buildEyeSvg());
      if (actions) actions.insertBefore(wrap, actions.firstChild);
      else header.appendChild(wrap);
    }
  }

  // Move every pupil toward the pointer, clamped inside the eye's opening.
  updateEye() {
    if (!this.lastPointer) return;
    const leaf = this.previewLeaf;
    if (this.isLeafAlive(leaf)) this.installEye(leaf);
    for (const pupil of document.querySelectorAll('.gnp-pupil')) {
      const svg = pupil.ownerSVGElement;
      if (!svg) continue;
      const rect = svg.getBoundingClientRect();
      if (rect.width === 0) continue;
      const dx = this.lastPointer.x - (rect.left + rect.width / 2);
      const dy = this.lastPointer.y - (rect.top + rect.height / 2);
      const dist = Math.hypot(dx, dy) || 1;
      // The eyeball rolls behind the socket: wide horizontal travel, a
      // little vertical, saturating once the pointer is ~80px away.
      const sat = Math.min(dist / 80, 1);
      const ox = (dx / dist) * sat * 5.5;
      const oy = (dy / dist) * sat * 1.8;
      pupil.setAttribute('cx', (EYEBALL_REST_X + ox).toFixed(2));
      pupil.setAttribute('cy', (EYEBALL_REST_Y + oy).toFixed(2));
    }
  }

  blurPreviewPane() {
    const leaf = this.previewLeaf;
    if (!this.isLeafAlive(leaf)) return;
    const active = document.activeElement;
    if (active && leaf.containerEl && leaf.containerEl.contains(active)) {
      active.blur();
    }
    // Reclaim/cleanup happens in onEditingEnded, which the blur triggers
    // via the focus-change listeners.
  }

  // A note created from a grey node and left empty ("empty" = the user
  // never typed beyond what the plugin seeded) is a reclaim candidate: it
  // gets trashed again and its node reverts to unresolved, pinned in place.
  async getReclaimCandidate() {
    const leaf = this.previewLeaf;
    if (!this.isLeafAlive(leaf)) return null;
    const view = leaf.view;
    const file = view && view.file;
    if (!file || !this.createdNotes.has(file.path)) return null;
    const entry = this.createdNotes.get(file.path);
    const content = view.editor
      ? view.editor.getValue()
      : await this.app.vault.read(file);
    if (content.trim() !== (entry.initial || '').trim()) return null;
    return { file, entry };
  }

  async reclaimNote(candidate) {
    const { file, entry } = candidate;
    // Prefer the node's current position; fall back to where it was created.
    let renderer = entry.renderer;
    let node = renderer && renderer.nodeLookup && renderer.nodeLookup[file.path];
    if (!node) {
      for (const patched of this.patchedRenderers) {
        const n = patched.renderer.nodeLookup && patched.renderer.nodeLookup[file.path];
        if (n) { renderer = patched.renderer; node = n; break; }
      }
    }
    const pos = node && node.x != null ? { x: node.x, y: node.y } : entry.pos;

    this.createdNotes.delete(file.path);
    await this.app.fileManager.trashFile(file);
    if (renderer && pos) {
      // The unresolved node comes back under its link text as id.
      this.keepNodeInPlace(renderer, entry.linktext, pos);
    }
  }

  async maybeReclaimEmptyNote(keepPath) {
    const candidate = await this.getReclaimCandidate();
    if (!candidate) return;
    if (keepPath && candidate.file.path === keepPath) return;
    await this.reclaimNote(candidate);
  }

  isLeafAlive(leaf) {
    return !!(leaf && leaf.parent && this.app.workspace.getLeafById(leaf.id) === leaf);
  }

  // The preview pane is a regular workspace leaf in the right sidebar that we
  // open files into, so it behaves like any note pane: editable, with the
  // normal reading/editing mode toggle. Its id is persisted so the same pane
  // is reclaimed after a restart instead of piling up new ones.
  async ensurePreviewLeaf(options) {
    const reveal = !options || options.reveal !== false;
    if (this.isLeafAlive(this.previewLeaf)) {
      this.applyPreviewIcon(this.previewLeaf);
      return this.previewLeaf;
    }
    this.previewLeaf = null;

    if (this.settings.leafId) {
      const leaf = this.app.workspace.getLeafById(this.settings.leafId);
      if (leaf && leaf.getRoot() === this.app.workspace.rightSplit) {
        this.previewLeaf = leaf;
        this.applyPreviewIcon(leaf);
        return leaf;
      }
    }

    const leaf = this.app.workspace.getRightLeaf(false);
    if (!leaf) return null;
    this.previewLeaf = leaf;
    this.settings.leafId = leaf.id;
    await this.saveData(this.settings);
    if (reveal) this.app.workspace.revealLeaf(leaf);
    this.applyPreviewIcon(leaf);
    return leaf;
  }

  // Give the preview pane our custom sidebar/tab icon. The view's getIcon
  // drives that icon; openFile can swap the view instance, so this is
  // re-applied after every load.
  applyPreviewIcon(leaf) {
    const view = leaf && leaf.view;
    if (!view) return;
    if (view.getIcon.__gnp !== true) {
      view.getIcon = () => ICON_ID;
      view.getIcon.__gnp = true;
    }
    if (leaf.updateHeader) leaf.updateHeader();
    // updateHeader rebuilds the tab icon from getIcon; put the live eye back.
    this.installEye(leaf);
  }

  finishEditing() {
    this.blurPreviewPane();
    this.focusGraphLeaf();
    this.updateDimming();
  }

  async openInPreview(leaf, file, openState) {
    this.hidePaneMessage();
    try {
      await leaf.openFile(file, openState);
    } finally {
      this.applyPreviewIcon(leaf);
    }
  }

  // A full-pane message overlay with an optional title. Used for both the
  // idle "blank state" and the grey-node "not created yet" hint.
  showPaneMessage(title, text) {
    const leaf = this.previewLeaf;
    if (!this.isLeafAlive(leaf) || !leaf.containerEl) return;
    const content = leaf.containerEl.querySelector('.view-content') || leaf.containerEl;
    let overlay = content.querySelector('.gnp-pane-overlay');
    if (!overlay) {
      overlay = content.createDiv('gnp-pane-overlay');
      overlay.createDiv('gnp-pane-overlay-title');
      overlay.createDiv('gnp-pane-overlay-text');
    }
    const titleEl = overlay.querySelector('.gnp-pane-overlay-title');
    titleEl.textContent = title || '';
    titleEl.toggleClass('gnp-hidden', !title);
    overlay.querySelector('.gnp-pane-overlay-text').textContent = text;
  }

  hidePaneMessage() {
    const leaf = this.previewLeaf;
    if (!this.isLeafAlive(leaf) || !leaf.containerEl) return;
    const overlay = leaf.containerEl.querySelector('.gnp-pane-overlay');
    if (overlay) overlay.remove();
  }

  showBlankState() {
    this.showPaneMessage('', 'Hover a node to preview it — click a node to edit.');
  }

  showUnresolvedHint(linktext) {
    this.showPaneMessage(
      linktext,
      'This note hasn’t been created yet. Click the node to start writing.'
    );
  }

  // True while the pane shouldn't respond to graph hovers: locked, or the
  // user is actively editing (keyboard focus is inside the pane).
  paneBusy() {
    const leaf = this.previewLeaf;
    return !!(this.locked
      || (this.isLeafAlive(leaf)
        && leaf.containerEl
        && leaf.containerEl.contains(document.activeElement)));
  }

  // Pointer left a node onto empty canvas: a transient preview reverts to
  // the blank state. An armed (clicked) note stays put.
  handleNodeUnhover() {
    if (this.armedPath || this.paneBusy()) return;
    this.showBlankState();
  }

  // Forget any hovered/highlighted node in every graph, so after editing
  // ends nothing is left highlighted and a later click can't re-fire on a
  // node that was merely hovered before.
  clearGraphHover() {
    for (const { renderer } of this.patchedRenderers) {
      if (this.pinnedHighlight && this.pinnedHighlight.renderer === renderer) {
        continue;
      }
      if (renderer.__gnpPinnedNode) renderer.__gnpPinnedNode = null;
      // The renderer re-derives hover from its remembered mouse position,
      // so clearing highlightNode alone re-highlights the node under the
      // (stationary) pointer. Park the remembered position off-canvas too;
      // the next real mouse move restores it.
      renderer.mouseX = -1e9;
      renderer.mouseY = -1e9;
      if (renderer.highlightNode) renderer.highlightNode = null;
      // A few spaced re-renders let the un-fade fully settle even if a
      // stray internal update lands right after the first frame.
      for (const delay of [0, 100, 250]) {
        window.setTimeout(() => {
          if (renderer.changed) renderer.changed();
        }, delay);
      }
    }
  }

  async handleNodeHover(nodeId, nodeType) {
    if (!nodeId || nodeType === 'tag') return;
    // A node is armed for editing: the pane is frozen on it, hovers ignored.
    if (this.armedPath) return;
    // Never disturb the pane mid-edit or while locked.
    if (this.paneBusy()) return;

    if (nodeType === 'unresolved') {
      this.showUnresolvedHint(nodeId);
      return;
    }

    const file = this.app.vault.getAbstractFileByPath(nodeId);
    if (!(file instanceof TFile)) return;
    await this.previewFile(file);
  }

  explorerFileFromEvent(evt) {
    const target = evt.target instanceof Element ? evt.target : null;
    const titleEl = target && target.closest('.nav-file-title');
    if (!titleEl) return null;
    const path = titleEl.getAttribute('data-path');
    if (!path) return null;
    const file = this.app.vault.getAbstractFileByPath(path);
    return file instanceof TFile ? file : null;
  }

  // Spotlight a hovered file's node using the same pinned-highlight
  // accessor as editing: a raw highlightNode assignment gets cleared by
  // the renderer's own hover re-evaluation as soon as the pointer rests.
  pinExplorerHover(nodeId) {
    for (const { renderer } of this.patchedRenderers) {
      if (renderer.nodeLookup && renderer.nodeLookup[nodeId]) {
        this.unpinHighlight();
        this.pinHighlight({ renderer, nodeId });
        return;
      }
    }
    // File has no node in any graph (filtered out, attachment...).
    this.unpinHighlight();
  }

  onExplorerHover(evt) {
    if (!this.hasVisibleGraphView()) return;
    if (this.armedPath || this.paneBusy()) return;
    const file = this.explorerFileFromEvent(evt);
    if (!file) return;
    if (this.explorerHoverPath === file.path) return;
    this.explorerHoverPath = file.path;
    this.pinExplorerHover(file.path);
    if (file.extension === 'md') {
      this.previewFile(file).catch((e) => console.error('graph-node-preview:', e));
    }
  }

  onExplorerHoverOut(evt) {
    if (!this.explorerHoverPath) return;
    const from = evt.target instanceof Element
      ? evt.target.closest('.nav-file-title') : null;
    if (!from) return;
    const to = evt.relatedTarget instanceof Element
      ? evt.relatedTarget.closest('.nav-file-title') : null;
    // Moving within the same item (or straight onto another, which the
    // mouseover handler covers) isn't a real leave.
    if (to === from || to) return;
    this.explorerHoverPath = null;
    if (this.armedPath || this.paneBusy()) return;
    this.unpinHighlight();
    this.clearGraphHover();
    this.showBlankState();
  }

  onExplorerClick(evt) {
    if (!this.hasVisibleGraphView()) return;
    // Modifier clicks keep their native meaning (open in new tab, etc.).
    if (Keymap.isModEvent(evt)) return;
    const file = this.explorerFileFromEvent(evt);
    if (!file || file.extension !== 'md') return;
    evt.preventDefault();
    evt.stopPropagation();
    this.explorerHoverPath = null;
    // The edit flow installs its own pin; release the hover one first.
    this.unpinHighlight();
    this.editInPreview(file).catch((e) => console.error('graph-node-preview:', e));
  }

  // Transiently show a file in the preview pane (shared by graph-node
  // hovers and file-explorer hovers).
  async previewFile(file) {
    if (this.opening) return;
    this.hidePaneMessage();

    this.opening = true;
    try {
      const leaf = await this.ensurePreviewLeaf();
      if (!leaf) return;

      // Don't swap files while the user is working in the pane: the lock
      // command freezes it, and keyboard focus inside it (i.e. actively
      // editing) pauses hover updates until they click back into the graph.
      if (this.locked) return;
      if (leaf.containerEl && leaf.containerEl.contains(document.activeElement)) return;

      await this.maybeReclaimEmptyNote(file.path);
      await this.maybeRestoreGraphFilters();

      const view = leaf.view;
      if (view && view.file && view.file.path === file.path) return;

      const openState = { active: false };
      if (view && view.getViewType() === 'markdown') {
        const state = view.getState();
        if (state && state.mode) {
          openState.state = { mode: state.mode, source: state.source };
        }
      } else if (this.lastPreviewMode) {
        // Coming out of the blank (empty-view) state: restore the mode the
        // user last had the pane in.
        openState.state = { mode: this.lastPreviewMode };
      }
      await this.openInPreview(leaf, file, openState);
    } finally {
      this.opening = false;
    }
  }
}

module.exports = GraphNodePreviewPlugin;
