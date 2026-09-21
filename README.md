# Glint Knowledge Core

A graph-first hackathon presentation about the context missed by isolated searches and recovered through connected knowledge. The graph fills the browser viewport, with a large retrieval-method heading, a three-step flow, and labels for each source collection. Missed sources are explicitly labeled "Missed context." There are no buttons, panels, or tooltips. All sources and relationships are synthetic; no credentials, backend, or external APIs are required.

## Run

```sh
npm install
npm run dev
```

Open the local address printed by Vite. For a production build:

```sh
npm run build
npm run preview
```

`dist/` can be deployed to a static host, including a subdirectory. Node 18.17+ is compatible with this project's pinned major versions; a supported Node LTS is preferable for deployment tooling.

## GitHub Pages

GitHub Pages publishes the generated `docs/` folder from the `main` branch. The Vite build uses relative asset paths, and `public/.nojekyll` disables Jekyll processing.

To publish an update after editing the source:

```sh
npm run build:pages
npm test
git add src public docs package.json package-lock.json README.md
git commit -m "Update the interactive demo"
git push origin main
```

`docs/` is generated deployment output; edit `src/` or `public/`, not the generated assets. The normal `npm run build` still produces `dist/` for other hosting providers. Repository Settings > Pages should use **Deploy from a branch**, **main**, and **/docs**.

## Present

The presentation opens with a **4.8-second visual problem story**, followed by **Solution definition** and **Graph RAG**. Its casual sequence is "One quick task…" → "Search. Grab. Build." → "Oops. Missing context." A developer requests privacy-preserving pulse survey results, an agent searches code and documentation, and labeled context fragments travel into its **Agent session** and feed a draft answer. The unvisited PM spec reveals the missing minimum-cohort rule: results are shown for only three respondents. The final state holds for commentary until you advance. Pausing extends wall-clock time, not the 4.8-second animation timeline. This is a curated illustration of a possible retrieval gap, not a claim that lexical or semantic search always fails.

**Solution definition** is a second 4.8-second animation with minimal labels: knowledge from Code, Wiki, PM specs, and Docs flows into a centralized core. Relationships then connect the Survey API to AudienceResolver, the minimum-cohort policy, and access roles. The differently named entities illustrate context that lexical or semantic similarity alone might miss. One MCP delivers the connected context to an agent. Source labels remain visible as provenance, and the final diagram holds for commentary. These are curated illustrative relationships, not a live ingestion or retrieval service.

The presentation uses a bright cream background, dark teal text, mint/teal retrieved context, amber relevant nodes, and coral missed-context highlights. The same light palette covers the opening, graph, search labels, closing slides, favicon, and browser theme color; the supplied graph screenshots are unchanged.

**Space** pauses either story at its current frame, **R** replays it, and **Right arrow** advances at any time: Problem → Solution → Ingestion. **Left arrow** retraces that sequence; **Home** restarts the problem story. Reduced-motion mode retains the reveals and sequence without traveling particles or line-drawing movement. The former Standard search section (Search space tour, Code search, and Web search) is no longer part of the presentation.

After the problem and solution stories and three Graph RAG scenes, continue with **Right arrow** through four closing slides: **Benefits**, **Tradeoffs**, **The big picture** (supplied graph overview), and **Inside the graph** (supplied close-up). There are nine slides in total. Left arrow returns to the previous slide. **End** retains its shortcut to the graph result; **Home** restarts the story. The final image slide does not wrap. Text slides can scroll on small screens.

The closing slides explain cross-source relationships, a unified MCP access point, richer retrieval context, and the engineering tradeoffs of graph quality, context budgets, and freshness. The two supplied PNGs are stored in `public/images/` and presented in order without cropping or invented node names/color meanings. These screenshots are separate from the synthetic 100-node animation; captions do not claim benchmark results.

The presenter provides all commentary. **Right arrow** advances one step; **Left arrow** goes back one step. **Space** pauses or resumes at any time, freezing the exact camera position, node/edge animations, labels, progress, and retrieval sequence. The on-screen hint shows when playback is paused. Navigation and **R** start the requested scene unpaused. No click is required after the page loads. **Home** restarts the opening story and **End** jumps to the final result. **R** replays either story or graph creation on Ingestion, without leaving the step. Holding a key does not skip steps or repeatedly toggle pause, and the first and last steps do not wrap. Boundary arrows leave the current playback clock untouched. The normal mouse pointer remains visible.

The graph fills the browser viewport automatically. **Graph RAG** has three steps: Ingestion, Graph retrieval, and Results. The current step is underlined in the flow and numbered within its phase (for example, "STEP 02 / 03"). Use your browser's fullscreen command if you also want to hide its address bar. There is no automatic scene advance: take as long as you need to talk through each step.

1. **Ingestion:** 100 sources across six labeled collections, including 20 relevant sources. An approximately 8.5-second graph-creation animation introduces the nodes, zooms into four code sources, then draws three directed, labeled relationships: the Survey API **uses** Pulse access and **requires** the Survey role; Survey results are **provided_by** the Survey API. The camera returns to the overview and draws the remaining relationships before signaling "Graph ready." Press R or return to this step to replay it.
2. **Graph retrieval:** the user question stays visible. **Call 01 / 07** shows `text.search("pulse survey results", scope: "code", limit: 1)` and its seed, `SurveyResultsController.ts`, selected by a local keyword match over the synthetic code sources. The seed phrase is built from extracted topic and resource entities. **Calls 02–07** show `graph.neighbors(frontier, direction: "both", unvisited: true)` and **graph hops 1–6**. Each wave expands the previous frontier, excludes visited nodes, and displays an example relationship plus source counts. This reaches 19/20 = 95%; Space freezes the current call along with the graph.
3. **Results:** hold the 19 retrieved sources in teal and highlight the one unlinked legacy spec in coral. The opening story provides the contrast with incomplete context; there are no separate standard-search slides.

Muted dots are unrelated sources; amber ringed dots are relevant sources. Retrieved sources light up teal with a check, while missed relevant sources have a coral dashed ring and cross. Each collection has a name and source count, plus a missed-context count when applicable. A matching callout identifies the one remaining graph miss.

Graph retrieval highlights entities extracted from the sample question using a small deterministic domain vocabulary. This is rule-based extraction, not a general-purpose NER model. The graph seed uses a local keyword match against the synthetic source fixture, followed by actual adjacency traversal. All displayed calls are explanatory notation, not external API integrations or shell execution; the percentages are illustrative, not live-service benchmarks. Historical baseline search fixtures remain in the data for comparison, but are no longer presented as standalone slides.

The same 100 nodes retain their graph coordinates across all steps; ingestion temporarily fades them out and introduces them at those same positions, while the camera zooms for the relationship close-up. Colors, glows, check marks, labels, and relationship edges ease between states; relationships also fade out on backward navigation. Within the graph-retrieval step, the traversal animates automatically at 2.4 seconds per hop with a single, gently fading pulse, leaving time to read each call; moving away cancels it, and returning replays it. Reduced-motion settings disable scanning, node growth, and animated camera movement; the camera changes instantly, and graph creation still progresses with opacity fades and readable relationship labels. Screen readers receive a hidden step/recall announcement, retrieval-call updates, and keyboard instructions.

Ingestion is a visual simulation using the fixture relationships, not a live extraction service. The close-up labels and arrow directions come from actual graph edges, not decorative connections. Shared timings in `src/data.ts` ensure that example relationships are drawn after zoom-in, the remaining edges appear after the camera returns, and "Graph ready" appears after the last edge finishes. The sequence is visible in both normal and reduced-motion modes.

The overview camera is approximately 10% closer than the previous framing. Relevant-node radii are 9.5 graph units (previously 7.5), and other-node radii are 6 (previously 4.5), with brighter colors. Outside nodes remain faintly visible during focus rather than nearly disappearing. Camera, node, and entity-label tracks are all explicitly sought to the same playhead on each frame; this avoids drift between browser-native SVG animation and the JavaScript camera after pause/resume. Leaving interrupted ingestion restores full-size, fully visible nodes in the next overview.

## Implementation

- React + TypeScript for the presentation state.
- D3 Force for a deterministic, collision-separated, 100-node layout.
- Motion for a unified, pausable timeline controlling SVG relationships, node transitions, and the camera.
- Vite for development and static builds.

`src/data.ts` contains the editable source fixture, graph relationships, presenter narration, and retrieval logic. `src/Graph.tsx` contains the graph, and `src/App.tsx` coordinates keyboard navigation and traversal. The layout stays fixed between methods so the comparison uses the same sources.

```sh
npm test
```

The data tests cover source counts, both search passes, exact recall, reachable paths, valid graph endpoints, duplicate handling, and cycle-safe traversal.

With `playwright-cli` installed and the dev server running on port 5173, run the browser checks using a modern Node runtime:

```sh
playwright-cli -s=glint-demo open http://localhost:5173
playwright-cli -s=glint-demo run-code --filename=tests/browser-check.js
playwright-cli -s=glint-demo run-code --filename=tests/pause-check.js
playwright-cli -s=glint-demo run-code --filename=tests/retrieval-layout-check.js
playwright-cli -s=glint-demo run-code --filename=tests/retrieval-crash-check.js
playwright-cli -s=glint-demo run-code --filename=tests/closing-slides-check.js
playwright-cli -s=glint-demo run-code --filename=tests/problem-story-check.js
playwright-cli -s=glint-demo run-code --filename=tests/solution-story-check.js
playwright-cli -s=glint-demo close
```

The browser checks exercise the nine-slide sequence in both directions, ensure standard-search screens cannot be reached, and verify graph-step numbering, exact rendered node counts, progressive ingestion, relationship labels, seven retrieval calls, 95% recall, fullscreen layout, and reduced motion.

The solution check verifies source-to-core motion, named cross-source relationships, a single MCP delivery, the 4.8-second duration, pause/replay, responsive label bounds, and reduced motion.

The pause checks compare the actual rendered SVG styles, camera, progress, and retrieval state before and after a pause during zoom, relationship drawing, and traversal. They also cover resume without restart, replay, navigation while paused, and reduced-motion mode.

The retrieval layout check verifies that seed and graph-hop captions fit desktop, laptop, and mobile viewports without covering nodes.

The retrieval crash regression supplies frame timestamps that predate scene setup, then exercises entry, pause/resume, all retrieval hops, and repeated entry in both motion modes. Playback samples `performance.now()` consistently instead of mixing setup time with an earlier frame-start timestamp; retrieval call indices are also bounded.

## Important presentation caveats

The baseline is **two curated keyword searches**, not a claim that Codex, Agency, or all developer agents are limited to grep and web search. No real agent or retrieval service is called. Microsoft Learn entries are fictional sample titles and excerpts, not quotations or downloaded documentation.

The 70% and 95% figures illustrate a story; they are not experimental measurements or guaranteed Graph RAG performance. The fixture deliberately has a clean relevant component; a real system must handle irrelevant neighbors, ranking, extraction quality, graph freshness, access controls, provenance, and context limits. Recall is not precision, latency, answer accuracy, or a guarantee of correct code.

A production implementation would replace the synthetic ingestion edges and result fixtures with permission-aware ingestion, entity/relationship extraction, semantic seed retrieval, bounded traversal, ranking, and source-backed context assembly.
