# GameDev audit and incremental upgrade plan

Audit date: 21 November 2026. Repository: PebisnisDigital/Manasik-Haji.
Baseline: `045cab0`. This is an existing browser game; no engine migration or rebuild is planned.

Latest scope update: the 22 November full-campaign increment below supersedes the baseline’s three-playable-chapter status. The original inventory is retained for comparison.

## Source inventory and routing

- Three.js **0.185.1**, locked in package-lock.json; TypeScript, vanilla JavaScript, Vite 8.2.2 and Vitest 5. Keep the pinned engine. The installed Three.js skill targets r187; use only APIs verified against the installed r185 source/types.
- Entry points: 20 production HTML pages in vite.config.ts. index/lobby lead to adventure-map.html; adventure.html redirects there unless `?classic=1` is present.
- New campaign: adventure-map.html plus src/adventure/{tawafGame,saiGame,tahallulGame}.js. Twelve chapters are listed; only chapters 03–05 are playable. Tawaf completion unlocks Sa’i; Sa’i completion unlocks Tahallul. Chapters 01–02 and 06–12 remain planned.
- Classic adventure: src/adventure/{main,homeScene,state,lessons,packing,practice,airport,flight,miqat,ambience}.ts. Eleven playable preparation levels, three ordered objectives each, 10 knowledge coins per objective; 35 named chapters (22 on the umrah route). Includes NPC conversations, packing, airport, flight and miqat interactions. Keep this route and its content.
- Existing training: coreTraining/coreProgress/coreWalk/coreHajj, player/sai, hajjProgress/hajjScenes, missionMap/missionModel and miniScenes. Umrah and hajj progression, walking, ritual counts, field activities, checkpoints and certificates are already implemented.
- Simulation: sim/* provides crowd motion, spatial hashing, obstacles, prayer and sa’i progress; characters/* provides instancing, animation banks and distance budgets; env/* provides procedural environments. These are distinct from the new campaign’s simpler crowd meshes.
- Presentation: camera/CameraSystem, cinematicIntro, graphicsQuality/graphicsModel, comfortMode, smartTutorial, ritualReadings, audio/* and ui/*. The new campaign does not yet reuse the existing adaptive render budget.
- Account/commercial: tenant, playerCloud/playerAccount, certificate*, admin*, partner*, commercialApi, humanVoice*, voiceAdmin and config/site. Existing cloud storage, tenant keys, reporting and administration must keep their contracts.
- Assets: procedural meshes and canvas textures, generated animation data, authored lessons and existing audio configuration. Preserve ASSETS.md and all existing assets. public/ and tools/pwa-* provide browser installation/offline support; .github/workflows/pages.yml builds GitHub Pages.
- Tests: existing unit/integration suites, separate long-running simulation soak, benchmark and desktop/mobile QA tools. Existing new-campaign JavaScript is outside strict TypeScript checking and has no dedicated browser regression harness.

Router selection: threejs-scene-setup; level-design (ordered goals and reachability), game-ai (simple NPC yielding), camera-systems (third-person orbit and occlusion), game-ui-ux (mission/reward HUD and safe areas), input-systems (shared keyboard/touch actions), save-systems (compatible checkpoints and recovery), performance-optimization (measure before changing rendering). No genre conversion is needed.

## Findings before changes

| Priority | Evidence | Consequence |
| --- | --- | --- |
| P1 | New campaign movement adds positive camera-right cosine although the camera looks along +Z from behind | D/right joystick moves to screen left; all three chapter scripts duplicate this |
| P1 | Portrait CSS hides gameplay but frame loops and keyboard/joystick state remain live | Progress and motion can continue behind the rotate overlay |
| P1 | Pausing does not clear held keys; focus loss leaves touch pointer ownership set | Unwanted motion on resume or stuck touch controls |
| P1 | Tawaf/Sa’i save completed laps/legs only | Mid-route checkpoint progress is lost on reload; storage errors are silently ignored |
| P2 | New campaign cameras have horizontal-only drag and linear per-frame smoothing, no occlusion | Abrupt framing and camera passage through scenery |
| P2 | New NPCs move through the player, use visible end-to-end warps, and submit individual body meshes | Weak interactions and avoidable rendering cost |
| P2 | New campaign save loaders/map duplicate raw parsing | Inconsistent validation/recovery; no integrated reward overview |
| P2 | Strict tsc and test:core omit the new chapter JavaScript | A green production build alone does not establish campaign compatibility |

The inventory covers all source areas and entry points. Detailed behavioral review is focused on gameplay, controls, rendering and persistence; this is not a security or religious-content audit. Existing documentation is historical and sometimes describes fewer playable levels than current source.

## Ordered implementation

1. Record baseline typecheck, full existing tests and browser captures. Establish a regression harness for the three playable campaign chapters.
2. Add shared keyboard/touch controls with radial deadzone, independent touch ownership, UI blocking and landscape/visibility pause. Add a collision-aware third-person rig with vertical orbit and time-based smoothing. Integrate without replacing scenes or movement/progression rules.
3. Extend version-1 saves additively for completed sub-checkpoints, retaining keys, counts and avatar/method fields. Recover from a previous valid backup and report failed writes. Derive rewards from achieved progress to avoid duplicate rewards on reload. Keep classic and training saves untouched.
4. Reuse adaptive graphics budgets; batch existing NPC meshes without replacing their art; add predictable yield/resume behavior near the player and contextual guide cues. Keep NPCs nonblocking so missions cannot deadlock.
5. Run old tests, meaningful new control/camera/save tests, production build, and browser desktop/touch flows including reload, level unlocks, menus, portrait rotation, fallback storage and legacy pages. Compare draw submissions using the same scene and browser. Software-rendered timings are not physical-phone FPS.

Future chapters remain gated until authored scenes, interactions and route checks exist. No new religious, medical or travel rules are introduced by these technical upgrades.

## Validation

Implemented in the existing three playable campaign chapters:

- Shared controls: correct screen-right strafe, radial touch deadzone, independent joystick/camera pointer ownership, lost-capture/blur cleanup and blocking while overlays, portrait mode or a hidden tab are active. E works immediately after a menu closes, including when focus still belongs to its hidden button.
- Third-person camera: pitch orbit, shoulder framing, exponential smoothing, reset, and expanded-box occlusion checked again after smoothing. Tahallul table approaches resume outside furniture and player movement slides around the two existing tables.
- Compatible saves: original version-1 keys retained. Optional `gate` records completed checkpoints inside a Tawaf lap or Sa’i leg. Old saves default to gate zero; avatar/method/cuts remain intact. A valid previous record is retained as `.backup`; corrupt primaries can recover it. Failed writes show a status message; newer-version primaries are not overwritten.
- Rewards: 10 coins for finding the start, 10 per completed lap/leg and 30 for meeting the final guide in Tawaf/Sa’i; 10 per Tahallul stage. Completion gives a level badge. Counts are derived from current progress and reloads do not grant duplicate coins. Existing classic knowledge coins retain their own rules.
- NPCs yield and resume with separate distance thresholds, turn at hall endpoints, and guides face the player. Existing crowd art is retained; dense crowds use instancing, while Tahallul's small group retains per-mesh culling after measurement showed it was cheaper.
- Existing graphics quality settings and adaptive render budget now also serve the new campaign. `test:core` includes adventure save/runtime checks, and `qa:adventure` provides browser regression checks. The new map reads the same validated checkpoints as the chapter pages.

Observed checks on this Windows workspace:

| Check | Result |
| --- | --- |
| Baseline full test suite | 139 tests, 27 files passed |
| Full suite after changes | 153 tests, 28 files passed |
| Typecheck and production build | Passed; all 20 production HTML entries retained |
| Build's PWA checks | Manifest/icons, worker syntax and nine routing/privacy checks passed |
| Desktop browser | Old save resume, correct strafe, vertical camera orbit, held-key/menu cleanup passed |
| Gameplay browser | Last Tawaf gate → guide → Sa’i unlock; last Sa’i gate → guide → Tahallul unlock; existing female haircut demonstration → return to group passed |
| Touch browser | Real CDP touch events: simultaneous joystick/look, independent finger release, portrait pause/resume and no horizontal overflow at 844×390 passed |
| Recovery/isolation | Corrupt primary restored from backup; classic-save sentinel preserved during campaign completion |
| Legacy browser smoke | Homepage, classic preparation adventure, training entry and old simulator loaded without page exceptions |
| Production browser smoke | All three built quest canvases loaded without page exceptions; diagnostics absent; old-format completed saves showed 3/3 levels and 260 derived coins on the built map |

`tools/adventure-profile.mjs` compares the same stationary camera at 1280×720, fixed Medium quality, Chrome with SwiftShader. The development-only `?unbatched=1` path retains original meshes for A/B comparison; it is removed from production. Recorded per-render draw calls:

| Scene | Individual crowd meshes | Final batching policy | Reduction |
| --- | ---: | ---: | ---: |
| Tawaf | 153 | 74 | 52% |
| Sa’i | 229 | 123 | 46% |
| Tahallul | 15 | 15 | Sparse crowd left unbatched |

Software-rendered mean frame intervals were approximately 124/130 ms for Tawaf, 124/125 ms for Sa’i and 80/82 ms for Tahallul (unbatched/final). These samples establish draw-submission reductions, **not a measured FPS improvement on target hardware**. GPU timing, sustained phone FPS, thermal throttling, native iOS gestures and listening quality need physical-device testing. No simulation algorithm changed, so the separate 40-minute simulation soak was not rerun.

Reproduce from the repository directory: `npm ci`, `npm test`, `npm run build`; run `npm run dev` in one terminal and `npm run qa:adventure` in another. `ADVENTURE_QA_EXECUTABLE` can select a browser executable. For A/B captures, run `node tools/adventure-profile.mjs unbatched-fixed --unbatched`, then `node tools/adventure-profile.mjs batched-fixed`. Screenshots/reports are generated under ignored `qa-output/`.

The changes remain local and uncommitted. No GitHub Pages deployment, cloud schema, tenant contract or religious-content change was performed. All existing preparation/training content and the roadmap remain available through their original entry points.

## Added direction: exploration, vehicles and scene presentation

Following the request for all three directions, `district.html` adds a compact open neighborhood alongside the existing game. This is the first playable area of that direction, using the original engine, character rigs and quality system. It includes free walking, NPC patrol/yield/conversations, five ordered preparation missions, a driveable bus, terminal parking, 100 derived reward points and safe checkpoint resumes. Existing chapter completion still controls Tawaf/Sa’i/Tahallul availability; the terminal never grants an old chapter completion. The lobby and map link to the new area. Detailed controls, file ownership, save format and limitations are in [DISTRICT.md](DISTRICT.md).

Additional routing: `physics-tuning` for the bounded/substepped kinematic bus, `game-feel` for speed/framing feedback, and `threejs-materials-lighting` / `create-game-assets` for lighting and the original procedural set. Warm directional/hemisphere light, ACES tone mapping, PMREM environment, fog, textured paving and detailed facades improve the scene while keeping the original stylized art. This is not a claim of GTA VI scale, photorealism or an AAA vehicle/traffic simulation.

| Final district verification | Observed result |
| --- | --- |
| Full test suite including district | **170 tests, 29 files passed** |
| Final typecheck/build | Passed; **21 HTML entries**, all original 20 retained; 90 build-gate tests and nine PWA routing/privacy checks passed |
| Real keyboard journey | Farid → luggage → board → steer bus to terminal → brake/park → disembark → Salma → completion/reload; 100 reward, old saves preserved, Tahallul destination still locked when Sa’i is incomplete |
| Touch vehicle checks | Real CDP joystick throttle plus a separate held brake, independent brake release, stopped bus and touch disembarking passed |
| Touch district exploration | Female avatar and corrupt-primary backup recovery passed; movement continued after releasing the camera finger; portrait froze movement and landscape resumed without held input or overflow |
| Legacy regression | All seven grouped `qa:adventure` checks passed again after the new chapter, including three old chapter completions/unlocks, independent touch pointers, backup recovery and classic/home/training/simulator smoke |
| Production browser | District mission interaction, tenant-scoped save/reload and links passed; three original built chapter pages loaded with valid existing unlock records; all development diagnostics absent |
| Fixed presentation capture | Chrome SwiftShader, 1280×720, Medium: **50 draw calls** at the initial on-foot view after local/static mesh merging; no phone FPS inference |
| Lighting probe | Hemisphere 1.8 + directional 3.4, environment present, shadows enabled on Medium, 19 caster meshes, ACES tone mapping, zero color maps missing sRGB |

Desktop/mobile screenshots were inspected at their native capture dimensions. Physical phone performance and native iOS behavior still need device testing. New models and signs are generated in code and recorded in ASSETS.md. No imported commercial/game assets, engine migration or new cloud schema is involved.

Reproduce with the existing development server and `npm run qa:district`. To check the production output, run `npm run preview`, then `node tools/district-production-qa.mjs`. Both harnesses allow `ADVENTURE_QA_URL` and `ADVENTURE_QA_EXECUTABLE`. Reports/screenshots are under ignored `qa-output/`. The feature remains local, with no commit, push or deployment performed.

## Next increment: optional activities and navigation

After completing the five district objectives, existing saves now open two optional activities: accompany Hasan from the courtyard to the southern shelter (+30 points), then carry Rizal's parcel from the northern market to Salma at the terminal (+40). The optional activities never block the existing chapter portals. Their derived reward brings the district total to 170 without repeat-conversation farming. The new mission book shows available, active and completed objectives.

Hasan reuses the existing instanced character renderer. His small FSM walks the authored crossing path, waits at distance with hysteresis, pauses while the player is driving or a menu is open, and yields to an obstructing bus. Reached path nodes are saved; reloading resumes beside the last reached node. The carried parcel is a small original procedural mesh; possession survives reload. These records use a separate tenant-scoped `manasik-district-errands-v1` with validation, valid backups, corrupt-primary recovery and future-version protection. Main district and classic/chapter formats stay intact.

The original bus mission gains a rounded minimap route with turn, detour and parking cues. It remains entirely player controlled. Walking routes to Hasan, Rizal and Salma use a small cached visibility graph, checked against existing building/prop collision solids and refreshed every 300 ms. Escort navigation points back to Hasan while he is waiting. No autonomous driving or new terrain is introduced.

Observed checks for this increment:

- Full suite: **179 tests across 30 files passed**. Final build: strict typecheck, **99 build-gate tests**, all **21 HTML entries** and the nine PWA route/privacy checks passed.
- Model checks include ordered/idempotent side rewards, invalid and future saves, backup/storage failures, distance hysteresis, bus blocking, full escort reachability, safe checkpoint spawns, route cues and collision-free walking segments around the hotel/centre.
- `qa:activities`: completed escort and parcel delivery using actual keyboard/camera controls, including menu freezing, distance waiting, intermediate reloads, 70 bonus points only once, preserved original saves and existing portals.
- Mobile activity flow: female avatar, parcel recovery from a corrupt primary's valid backup, visible walking route, mission-book/portrait blocking, touch handover, 170 points and no horizontal overflow passed in Chrome emulation.
- The complete original district browser suite passed again: all five main objectives, rounded-route display while driving and hiding after parking, original save isolation/unlocks, mobile multi-touch/portrait recovery, and separate held-brake/joystick release with touch disembarking.
- Final production smoke passed: tenant save/reload, the walking detour from terminal to Hasan, the female parcel checkpoint/130-point state, mission book, three existing built chapter pages with valid unlock records, and absence of development diagnostics.

The original instanced crowd handles both new NPCs without creating another character renderer. No dependency, engine version, cloud schema or external asset was added. Reports/screenshots: `qa-output/district-activities-qa.json`, `activities-book.png`, `activities-mobile-parcel.png` and `activities-mobile-complete.png`. Reproduce with the Vite development server and `npm run qa:activities`; physical phone performance remains unmeasured.

## Journey cohesion: chapter progress and return to the group

`journeyProgress.ts` derives a four-part playable journey from existing validated saves: district, Tawaf, Sa’i and Tahallul. It shows the current checkpoint, prerequisite locks and a recommended next destination. Existing chapter saves continue without replaying the new district; explicitly active optional activities remain resumable. The map now contains this journey panel alongside its original 12-chapter roadmap and three-level completion counter. Both views refresh on pageshow/storage changes, avoiding stale counts or duplicate cards when returning from another page/tab.

The district mission book includes the three chapter statuses and a link to the next available chapter. All three chapter pause/completion overlays offer a return to the district, preserving the existing next-chapter and replay actions. Tenant context is retained by the new links and map navigation. No journey-progress record is written: all totals and destinations are derived from the original district/errand/chapter keys, with the same validators and backup recovery.

Verification: 11 new journey-model checks passed; strict typecheck and production build passed with 110 core tests across 21 files, all 21 HTML entry points and the nine PWA checks. `qa:journey` passed against development and production output: new-player routing; cross-tab update of both new and legacy map counters; corrupt-primary backup display without replacing corrupt/future records; old Tawaf continuation; Sa’i pause → district journal → same Sa’i leg/gate with tenant preserved; return links from each completed chapter; and the mobile journal displaying old completions. Native-size map/mobile screenshots were inspected.

The final full suite also passed: **190 tests across 31 files**. Existing source/assets/progress remain in place; these changes are local and uncommitted.

Run `npm run qa:journey` with the development server, or `node tools/journey-qa.mjs --production` with the production preview. Reports are `qa-output/journey-qa.json` and `journey-production-qa.json`. The Indonesian product direction, current scope and next-stage criteria are in [ARAH-PENGEMBANGAN.md](ARAH-PENGEMBANGAN.md). Visual realism, richer animation/AI, more roadmap chapters and physical-device performance remain further production work.

## Presentation increment: locomotion, bus wheels and mode camera

The district now reuses the VAT renderer's existing outgoing-frame blend for 0.18-second walk/idle transitions on the player, patrol NPCs and Hasan. Walking phase derives from actual on-foot travel; driving no longer advances the player's walking animation. Menus freeze the exact submitted pose. Patrol body headings ease toward the existing authored path; path positions and collision rules are unchanged.

Four procedural bus wheels have separate rolling/steering pivots, with original spoke geometry to make rotation visible. Rotation derives from actual resolved displacement projected onto the midpoint heading, so reverse rolls backwards and blocked/parked vehicles do not keep rolling. Only the front wheels steer, using the existing vehicle steering state. Each rolling wheel keeps two material batches; static architecture and rigid bus geometry retain their existing batching.

A district-only presentation helper blends framing, focus and shortest-arc yaw when boarding/disembarking over 0.65 seconds. Ordinary shared third-person follow, orbit and building occlusion remain in use. Orbit pitch survives mode changes; checkpoint teleports cut/reset. System reduced motion skips the new mode blend and speed FOV. The new visual states are transient: no save fields, dependencies, imported assets, mission gates, kinematic constants or old chapter camera defaults changed. There is still no character door-entry/seating animation, vehicle suspension or engine audio.

Verification:

- Full suite: **199 tests across 32 files passed**. Build: strict typecheck, **119 core tests across 22 files**, all **21 HTML entries** and the nine PWA routing/privacy checks passed.
- Nine presentation model checks exercise rapid start/stop clip boundaries, exact pause poses, distance-based stride and camera progression at 30/60/120 Hz, shortest yaw arcs, interrupted mode transitions/checkpoint cuts, and resolved forward/reverse/blocked wheel travel.
- `qa:presentation` passed: female real-keyboard walk/idle crossfades and pose freezing; camera focus/framing blending; forward/reverse wheel rotation, front steering and parked/menu freezing; checkpoint reset, old-save isolation, and reduced-motion behavior. Native-size screenshots were inspected.
- `qa:district` passed again: all five main objectives through keyboard bus driving/braking/parking and disembarking, completion/reload, old-save isolation/locks, female backup recovery, independent touch move/look, portrait recovery, separate joystick/brake pointers and touch exit.
- `qa:activities` passed again: escort distance waiting/menu pause/checkpoint recovery; complete parcel delivery and exactly-once 70 bonus points; original saves/portals preserved; mobile female parcel backup recovery, portrait blocking, touch handover and 170-point completion without overflow.
- Production browser smoke passed again: actual district mission interaction with tenant save/reload/navigation, female parcel checkpoint and walking route/book, all three original built chapters with existing unlock saves, and absence of development diagnostics.
- Fixed initial on-foot view, Chrome SwiftShader at 1280×720/Medium: **57 draw calls**, versus the earlier 50-call capture with rigid merged wheels. The seven-call increase is the measured cost of independent moving wheel batches; caster count stays 19 and no color maps miss sRGB. Side-view wheel geometry and full-size captures were inspected. This is a rendering-cost measurement, not a phone-FPS result.

Reports and captures are under ignored `qa-output/district-presentation-*` and `district-qa.json`. Physical Android/iOS frame time and comfort are still unmeasured; software-rendered browser checks establish functional behavior only.

## NPC conversation increment: contextual questions and acknowledgements

The dialogue-systems skill was selected for the next increment. Existing HTML dialogs and mission reducers remain the integration points. `districtDialogue.ts` builds a small typed graph for Farid, Salma, Hasan, Rizal and roaming pilgrims from existing main/side/companion/chapter state. Indonesian strings have stable IDs; each graph offers repeatable current-direction and character-role questions with back/close choices. No expression evaluator, scripting dependency, remote chat, new save record or narrative flags are introduced.

Directions follow all five main objectives, Hasan's distance/bus/vehicle waiting and destination handover, the market pickup, carried-parcel delivery, and old chapter prerequisites. Farid, Hasan and Salma acknowledge completed help; characters refer a carried parcel toward Salma rather than offering pickup again. Explicit mission choices retain their labels and reward previews. Only those choices dispatch existing guarded/idempotent mission events; entering nodes or asking questions cannot accept tasks, complete them, award points or change saves.

Branches replace content inside the same open native modal, reset scroll and focus to the first new choice, clear movement input and keep gameplay paused. Escape closes through the existing cleanup path. The dialog now describes/announces its visible text for assistive technology. Keyboard checks allow native browser-chrome focus between tab cycles while ensuring background game controls never enter the modal's focus order. Full-size desktop and mobile captures were inspected; mobile actions retain the existing 44 px minimum and portrait/landscape blocking.

Verified checks:

- Full suite: **208 tests across 33 files passed**. Final build: strict typecheck, **128 core tests across 23 files**, all **21 HTML entries**, and nine PWA routing/privacy checks passed.
- Nine dialogue model tests enumerate mission, side activity, waiting and chapter combinations, traverse each question branch, validate targets/exits/text IDs/duplicate choices/reachability, and check read-only questions, eligible commands, chapter locks, acknowledgements and reward idempotence.
- `qa:dialogue` passed with actual keyboard/touch and DOM observations: Farid story/help/back and updated post-acceptance directions; repeated questions without writes or rewards; modal focus/Escape/held-key cleanup; Hasan's arrival handover and single 30-point reward; Rizal's carried-parcel response; Salma's completed-help reply, old chapter locks/tenant links, touch branches, portrait recovery, 44 px actions and unchanged 170-point total.
- The complete `qa:district` suite passed after the dialogue integration: all five objectives through keyboard driving/parking/Salma completion and reload, original-save isolation and unlock rules, female backup recovery, multi-touch move/look, portrait recovery, and independent throttle/brake pointers with touch disembarking.
- The complete `qa:activities` suite passed after integration: actual escort and parcel journeys, waiting/menu pauses/intermediate reloads, exactly-once 70 bonus points and original saves/portals, plus mobile female parcel backup recovery, portrait handling, touch handover, 170-point completion and no overflow.
- The same four `qa:dialogue` browser groups passed against the final production build using only real controls and DOM state, including mobile tenant/unlock links, read-only question paths and absence of development diagnostics.
- Final production smoke also passed: real district acceptance with tenant save/reload/navigation, the female parcel checkpoint with route/journal, and startup of all three original chapter pages using existing valid unlock saves. Development diagnostics remain absent in those builds.

The district production entry is 36.69 kB (14.41 kB gzip), compared with 27.01 kB (11.43 kB gzip) before this dialogue increment. The fixed string table ships in that entry; dialogue graphs are built only when a conversation opens or changes branch. No render pass, mesh, network service or engine dependency was added.

Use `npm run qa:dialogue` against development or `node tools/district-dialogue-qa.mjs --production` against the production preview. Reports/captures are under ignored `qa-output/district-dialogue-*`, `dialogue-desktop-farid.png` and `dialogue-mobile-salma.png`. This adds authored interaction to existing content; it does not add voice acting, facial animation, a new Hajj chapter or measured physical-device performance.


## Full 12-chapter campaign — 22 November 2026

The user chose all twelve chapters in the Hajj campaign map as the first-release content requirement. The 35-item classic preparation route is a preserved separate mode. The router-selected engine remains Three.js r185; level-design, game-ui-ux and save-systems guidance is applied through the existing field controller, scenes and save validators. No new engine, dependency, external asset or cloud schema is added.

Nine field segments now join the three existing adventures. Chapter 01 reuses the preparation walk and miqat cards. Chapter 02 reuses the Haram environment, VAT characters and shared third-person walker for three physical discovery checkpoints. Chapter 06 adds the Mina camp visit after preparation. Arafah/Muzdalifah/Aqabah/Tasyrik reuse the existing field scenes and ordered interaction/throw logic. Ifadah, Hajj Sa’i and Wada retain the actual player/sai arenas and seven-count progression. The chapter catalogue and boundaries are in src/adventure/hajjCampaign.ts; the launcher is hajj-adventure.html and campaignLaunch.ts.

Field sessions use separate playerKey-scoped records by chapter/partner/account. Their bounds are validated, valid prior records are backed up, newer versions are preserved, and incomplete counts cannot advance a counted stage. The original training keys, chapter-03/04/05 keys, classic saves and cloud outbox remain separate. Field sessions are browser-local and are never queued as complete training runs. Completing one segment shows its chapter badge and next destination before the existing full-training certificate branch; original training certificates retain their behavior. New field completion gives a derived 50 coins per chapter; the entire 12-chapter maximum is 710, with existing district rewards separate. Reloading results cannot increment it.

The map now derives 12/12 completion, prerequisites and next chapter from validated records. Existing direct access to Tawaf and old Sa’i/Tahallul unlocks remains compatible. A completed Tahallul overlay adds the chapter-06 link. The old four-part journey view is explicitly labelled as the opening sequence and help activities; it no longer claims the whole Hajj journey is finished after three ritual chapters. Source guidance is reused; [Nusuk’s general Hajj journey](https://hajj.nusuk.sa/Journey) was checked for the broad route. No qualified religious review is claimed.

Checks completed so far:

- Full model/simulation suite: **218 tests across 34 files passed**. Production build: strict typecheck, **138 core tests across 24 files** and **five release-policy tests** passed.
- Vite built **22 entry pages**. Integrity audit checks literal local HTML/CSS/module targets, relative subdirectory deployment, missing required entries and absence of development diagnostics/private files. The build contains **102 files, 1,423,076 bytes** before transfer compression. This is build size, not a download-time or FPS measurement.
- PWA checks now cover **16 public game route variants**, online/offline fallback and seven private-route exclusions, retaining network-only HTML and lazy static-asset caching. All built HTML files participate in the worker version hash; an HTML-only update has a regression test. The application still needs connectivity to open arenas; this is not full offline gameplay.
- Development campaign QA passed ten groups: all nine new segments to their boundaries; three physical arrival visits with reload; inherited female avatar; seven gathered pebbles; seven Aqabah throws and trim/dam guidance; Ifadah→Sa’i page transitions; 42 Tasyrik throws and nafar awal; Wada ending and stable 12/12/710 result; mobile nafar tsani with another 21 throws, portrait blocking and no horizontal overflow. The legacy-training record/checkpoint stayed unchanged. No partial-session certificate was shown.
- Built recovery QA passed nine groups, including fresh chapter-one inheritance from the district character and pause/Escape input cleanup: locked/invalid chapter links; future-version preservation; storage quota failure; unavailable WebGL keeping actions blocked without awarding progress; saved 3/3 discovery completion after reload; movement paused on graphics-context loss; original ihram→Arafah training progression with its mission map; and original complete-training certificate rendering.

Browser checks use isolated Chrome contexts and actual walking/approach/action controls with SwiftShader. Chapters 03–05 use completion fixtures in the new-segment campaign suite and have their own route-regression suite. Ifadah, Hajj Sa’i and Wada resume from **6/7** and perform the final real lap/leg; this is not a fresh 0/7 endurance run of all rituals. A runtime error during early discovery testing revealed an incorrect NPC LOD argument; it was corrected and the campaign suite rerun successfully. Reports are qa-output/campaign-qa.json, campaign-production-qa.json, campaign-recovery-qa.json and release-integrity.json.

The same ten campaign groups passed in production, including the explicit 13 Zulhijah label on nafar tsani. Seven original-adventure regression groups passed: real Tawaf/Sa’i final sub-checkpoints and guide/unlock transitions, the female Tahallul demonstration, desktop camera/input/menu recovery, independent mobile pointers/portrait handling, corrupt-primary recovery, and original preparation/training/lobby/simulator startup.

Final navigation refinements make the 12-chapter map Salma’s primary destination, retain her original chapter shortcuts and locks, inherit an existing character in the first field chapter, and add a native pause dialog to field chapters. After the final build, nine recovery groups, four production journey groups, four production dialogue groups and the production district/three-original-chapter smoke all passed. These targeted checks cover the final pause/avatar/navigation changes; the full production campaign run preceded those small refinements. The ritual/counting stages and their save boundaries did not change during the refinements.

Reproduce with npm test, npm run build, npm run qa:adventure (development), node tools/campaign-qa.mjs --production, npm run qa:recovery, node tools/journey-qa.mjs --production, node tools/district-dialogue-qa.mjs --production and node tools/district-production-qa.mjs. Run browser suites sequentially. Reports are summarized by qa-output/release-readiness.json.

Physical Android/iOS performance, touch comfort under real browser chrome, a qualified content review and public deployment remain outstanding. The project has not been published or pushed.


## Shared journey detail and human cast — 22 November 2026

The user's selected visual reference is the existing bus district. The GameDev Router selected level-design, threejs-materials-lighting, create-game-assets and dialogue-systems for this iteration, using the existing pinned Three.js implementation. The audit and family-by-family implementation plan are in PENINGKATAN-ARENA.md; the procedural asset manifest is arena-assets.json.

PlaceDetails adds material-batched scenery to Haram, Sa'i, Tahallul, preparation/service rooms and all four field families. New scenery is outside navigation space; tall additions in open field/service arenas also clear the camera boom envelope. Existing room backdrops remain open where an extra wall could obstruct the orbit camera. Original historical/environment assets remain in use.

HumanActors replaces the primitive actors in the three older route adventures and field crowds with the existing VAT body rig and distance LODs. The shared CharacterMesh adds facial landmarks and thumbs, and corrects inward triangle winding discovered by close-up inspection. CrowdRenderer corrects an extra sRGB conversion on its colour palette. HumanFeatures adds faces to the original articulated preparation cast without replacing its gestures. The near camera for old adventures is adjusted for the new human proportions; Sa'i's marker no longer covers the character.

All twelve campaign contexts now have read-only, authored guide conversations through Radio rombongan, with a real modal, keyboard focus, touch-sized options, orientation handling and input/audio pause. Existing district and preparation NPC dialogue is retained. Old route checkpoints are unchanged, and avatar inheritance reads existing choices without migrating route saves.

Validation for this iteration: 218 legacy tests plus 14 new presentation tests passed; the final build reran 152 core tests and five release-policy checks. Production campaign, original-route regression, all twelve chapter conversations, eleven preparation-level startups, district smoke and human portrait views passed within the documented fixture/endurance limits. See PENINGKATAN-ARENA.md and qa-output/arena-audit-validation.json for exact scope and reports. Medium-tier old-arena shadows were removed after software profiling; High retains static shadows. Physical-phone frame rate is still unmeasured.

## Expedition conditions and hardships — 22 November 2026

Audit finding: existing missions, ritual counters and rewards had no shared body-condition or provision system. The new lifeModel/lifeWorld modules introduce stamina, nutrition, water, hygiene, health, carried food and drinks, nearby recovery facilities and five persisted trial types. Existing progress records are independent. An unfinished trial follows the player to the next arena so leaving a chapter cannot strand recovery. See TANTANGAN-PERJALANAN.md for the chapter table, balance, storage format and verification scope.

This iteration applies the GameDev Router, survival-crafting, save-systems and game-ui-ux guidance. It retains the current engine, world assets, bus and all old mission/reward systems. Sanitation is a timed facility action; detailed bathing animation, cloud synchronisation of needs and physical-device performance are outside this iteration.

## Adventure title menu — 22 November 2026

The default index now opens a title cover with program, avatar, audio and graphics setup before entering a node-path map. Hajj retains its twelve chapter records; Umroh derives five levels from its existing core run. Setup uses a separate account/tenant preference record and never awards mission progress. Avatar appearance is applied on read; existing run ids, names, counters and stages remain intact. The original 3D lobby remains available as index.html?lobby=1, and install/update UI is mounted on the cover as well.

GameDev Router selected game-ui-ux and audio-design for this menu work. It reuses the original Ka'bah and avatar illustrations and the existing graphics/audio systems. MENU-PETUALANGAN.md records the flow, compatibility rules and validation. The final build passed 180 core tests, five release-policy checks and PWA/release integrity. Menu QA covers both programs, actual arena launch, a resumed Umroh 4/7 checkpoint, selected female Tahallul with existing cuts, three screen classes, installation help and storage failures. It does not replay fresh seven-lap/seven-leg endurance routes or measure physical-phone performance.
