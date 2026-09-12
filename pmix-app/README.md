# MAX ZETA

Private reporting app for Michael Goyone. The GoyoneByDesign website footer opens this owner-only workspace. MAX uses an on-device Qwen model through Transformers.js, with no API key required. Confirmed layout/column/menu mappings persist in a private D1 database. The version, build, update timestamp, learning revision, and applied timestamp appear in the footer.

## Current release: 3.4.0 · Build 15

Same-period reports align the union of line items across locations, with zero for items absent from a complete loaded source. Location display offers Side by side, two-location VS with DIFF/VAR and reversal, or Combined total only. Source-date comparisons remain separate. A supported Toast workbook with a row-level location field preserves each store's values. A workbook listing multiple stores only in Summary is treated as a combined-only source, with its store scope carried in `aggregateStores`; it cannot be used to infer individual shares. Combined and individual sources with overlapping coverage are blocked before import. Public tests use synthetic data; private supplied workbook values are never bundled.

Report titles use 16-point bold, subtitles use 12-point bold initial capitals, and printed timestamps and all footer/page lines use 8 points. Headers and footers use Times New Roman (or the disclosed PDF fallback). Printed timestamps have no timezone suffix. Short reports use white body rows; dense reports use restrained light-gray fills. Report headings use 12-point bold ITEM and numeric column labels; dining options use uppercase 12-point bold. Categories use initial capitals at 10 points with Aptos SemiBold; items and numbers use regular 8-point type. PDF embeds OFL-licensed Source Sans 3 Semibold for category labels. One numeric column uses QTY, NET SALES or VALUE, with the store in the report header and no duplicate TOTAL. Multiple locations keep their right-side totals. Automatic filenames follow `FX - PMIX Full 2026 - 0819_0825`, with canonical store order, real reporting dates and distinct comparison intervals.

### Continuing on another computer

Open MAX ZETA from the portfolio and sign in with the same owner account, then unlock the existing PIN. Owner-private saved formats, confirmed mappings, conversations, provider connections and History belong to the hosted workspace. The open report/filter session and selected installed fonts are local to the browser: use Save report and open the resulting `.max-report.json` on the other device to continue that session. History retains archived files up to 40 MB, with redownload, Trash and Undo; pending Google Drive copies stay in private staging until OAuth is configured and authorized. No Drive API key is sufficient for private file access.

The main website's MAX-G link opens a separate companion at `/max-g/`. Its browser-local IndexedDB state does not automatically synchronize with MAX ZETA or another device. File, microphone and native Mac permissions are granted on that Mac; copying source code does not grant them. The public repository contains source only. Preserve the existing Sites project ID, owner-only access, private D1/R2 bindings and hosted secrets when continuing development from a Mac. Do not recreate or publish a public copy of the private Worker.

## Report Studio 3.0

The private workspace now supports PMIX, standalone net sales, and combined reports. Filenames such as `ProductMix_2026-08-19_2026-08-25` fill explicit dates; month/year headers, scopes, and locations are used where supported. Conflicts remain unresolved for review. Formatted workbooks use the declared print area and separate dining-option sheets. ORIG copies, category subtotals, parent day-part totals, and derived comparison columns are excluded from additive data.

The dark report collection offers Classic grid, Compact ledger, and Category pages. Preview renders the actual generated PDF with pagination; changing filters invalidates old downloads and regenerates the document. The preview has PDF, Excel, CSV, print, and header/footer editing controls. Save report includes imported data plus filters and formatting, with a downloadable `.max-report.json` backup. This backup contains private report data and is not synced to public source.

All paper layouts share centered titles, date/filter lines, printed timestamps, and the Downloads/MG/date/page footer. Excel uses Times New Roman headers/footers and Aptos Display body styles. PDF embeds licensed Liberation fonts by default; supported browsers can enable installed Times New Roman/Aptos faces with Local Font Access, storing them only in device IndexedDB. No Microsoft font files are redistributed. PDF widens or splits location columns across pages when needed; Compact ledger is useful for wide comparisons. CSV retains numerical ratios as decimals and does not preserve page styling. Excel includes live row totals, grand totals, DIFF and VAR formulas with cached results and zero/missing-data guards.

Recognized PDF templates include quantity/net-sales subcolumns, revenue centers by store/year, category quantity tables by dining option, and store comparisons with separate source quantity and sales columns. Scans still require review. A summary that combines every location without separate store numbers cannot be distributed among stores; use a source with location detail. Older reference DIFF/VAR columns never override the owner rules.

## Reporting

Upload multiple XLSX, CSV/TSV and PDF files. Toast's All levels item rows supply quantities; Summary and Items are reconciliation controls, not extra sales. The supplied six-tab export and 99-page comparison PDF were used as reference layouts and reconciliation fixtures only. Toast gift-card Add Value is excluded from item PMIX. Private source files are not shipped with this code.

PDF text extraction and scanned PDF English OCR run locally. Review pages, row types and recognized quantities before importing. Unknown spreadsheet layouts offer explicit column mapping and optional MAX proposals, saved after confirmed import. CSV is a single table; Excel can contain multiple tabs. Historical presentation workbooks with mixed channel/day-part columns require column review, not silent addition of subtotals.

Multi-select locations, dining options, menus, categories and items. Matching names may combine across menus. Grand totals retain n.a. for missing coverage. Include item-level net sales only when actually present; Summary-only revenue is not allocated to items. Basket = item quantity - Platter - Meal. Serving revenue is unavailable unless separately sourced; the app does not allocate item revenue among forms.

Compare Previous and Current date periods. DIFF = Previous - Current; VAR = DIFF / Previous. Previous zero means n.a. Total VAR is calculated from grand totals. Comparison rows are stacked for readable printing. Different-period missing locations are not converted to zero. Duplicate and overlapping imports are rejected. Export grayscale Excel/PDF on Letter, Legal or Ledger, portrait or landscape, with MG, date, path and page count.

Exact date/time slicing requires timestamped rows. Source aggregate reports cannot be split into finer intervals. BK 04:00–10:59; LN 11:00–15:59; DN 16:00–23:59, America/New_York. BK serving type means Basket and is separate from BK day part.

## MAX and memory

Start MAX to download its local model on the current device. Model files are cached by the browser when supported; the first download requires internet and sufficient memory. WebGPU is preferred; WASM is the fallback. MAX serves deterministic PMIX help from verified reporting guidance, supports general on-device chat, and proposes column mappings for review. Public web search returns source links using a server-side RSS search request. Microphone input and text-to-speech use supported browser speech APIs; audio is not stored by MAX. Source calculations remain deterministic. Model weights are not retrained, and learning revision advances only for a changed confirmed mapping. Memory is checked when the app opens; a separate scheduled review maintains sourced knowledge and checks relevant documentation; model weights do not train unattended. The open report session stays in browser storage; Save report includes its data and settings in a private portable backup. New imports and downloads are also archived in owner-private History.

Optional OpenAI Responses API support provides cloud help and official Toast web research when a server-side API key is configured. The provisioning connector rejected key creation in this session. No key was created or embedded. Standalone MAX remains usable without it. Standalone web search is also available without the optional OpenAI connection. Saved owner notes and full conversations with source links are private and searchable across devices. Conversation history is not treated as verified factual knowledge. Relevant prior conversations are retrieved for local MAX context; model context and database storage remain finite. The main-site MAX ZETA button opens this owner-only workspace; MAX-G opens the separate companion. Uploaded reports are reference layouts unless explicitly imported as a reporting dataset.

## Build and hosting

`npm ci --ignore-scripts`, `npm run prepare:assets`, then `npm run build`. The asset step downloads public OCR/PDF libraries and the English OCR language file; MAX downloads model weights on first use. `npm test` checks calculations, print settings, missing values, owner access, signed PIN sessions and durable learning revisions. `npm run db:generate` generates schema-only Drizzle migrations.

The worker expects Sites identity headers, owner-only platform access, D1 binding DB, and secret environment values. Never deploy the Worker publicly with spoofable identity headers. GitHub Pages hosts the portfolio and PMIX launcher; it cannot execute this private Worker. Keep private report data, keys, PIN values and session secrets out of GitHub. Runtime secrets belong in hosted environment settings; `.env.local` is ignored.

The source build emits `dist/client` assets, `dist/server/index.js`, and `dist/.openai` hosting/migration metadata. MAX and OCR runtime code is bundled; the model downloads directly from its public model repository. Original GoyoneByDesign logo is reused from the portfolio.

Current build metadata is defined in `src/build-info.mjs`. Browser visual testing has not been requested. Computational, source-file and export checks were run; local model inference was exercised on CPU.

MAX's calculator uses math.js 15.2.0 in a dedicated worker with a four-second timeout and a constrained expression tree. Arithmetic, statistics, small matrices, units and derivatives are computed deterministically. Type `math: expression` in chat or open Calculate with MAX; successful results are saved to private history. No general-purpose code execution is enabled. Coding assistance drafts/explains/reviews code through the model and may be limited by model capability. See the primary [math.js security guidance](https://mathjs.org/docs/expressions/security.html). Future plugins need explicit, individually scoped integration; there is no automatic installation of all tools.


## MAX Create (2.1.0)

Create with MAX adds editable Markdown-to-Word/PDF, CSV/JSON multi-sheet Excel, source code and isolated HTML preview, LaTeX rendering, symbolic math, image format conversion, looping GIFs, browser-recorded slideshows with optional audio, and instrumental PCM WAV synthesis. The main PMIX exporter remains the route for specialized reporting formats. Use saved drafts to sync text; original media stays on the device. Examples are labeled example data.

Chat and drafting default to on-device mode with no API calls. Select Cloud AI to use paid OpenAI chat/drafting. Image/video controls separately require selecting paid AI generation. No paid generation occurs merely from saving a key. Provider availability, permissions, model limits and billing still apply. AI music with singing/full arrangements is not implemented; WAV synthesis supports editable notes, chords and tempo. Browser video uses WebM or MP4 depending on encoder support and must keep the tab visible. Downloads are generated locally and archived through the owner-private History module before download. Unicode Word text is preserved; PDF uses bundled DejaVu Sans and refuses unsupported characters instead of silently replacing them.

### Private AI connections

The owner signs into Work and unlocks the PIN before entering a key in MAX → AI connections. Keys are tested with the provider models endpoint then AES-GCM encrypted in the owner-scoped D1 settings table. The encryption key is derived from the server SESSION_SECRET; retain that secret or reconnect keys after rotating it. Keys are never returned to the client, put in app source, or stored in browser storage. OPENAI_API_KEY / GEMINI_API_KEY environment secrets are also supported and take precedence. Removing a saved connection does not revoke the provider key or remove an environment secret. Revoke unwanted keys at the provider.

OpenAI draft/image adapter follows https://developers.openai.com/api/docs/guides/image-generation . Gemini video adapter follows https://ai.google.dev/gemini-api/docs/veo . Video jobs use signed owner-bound expiring tokens and restricted download hosts. No Sora integration is added because its API is scheduled to retire September 24, 2026. API media calls have not been tested against a paid live account in this release; mocked routes and failure cases are covered.

### Learning communication

Teach MAX my wording saves an explicit owner note describing shorthand or misspellings. Future AI prompts receive those notes along with instructions to resolve informal English/Tagalog in context, reason through requirements and ask when ambiguity matters. This is contextual memory, not model retraining or a guarantee of accuracy. Saved wording never rewrites source quantities or code.


### Connection fix (2.1.2)

The production key test failed before any provider response because the deployed Cloudflare runtime rejects `redirect: "error"`. Reproduced using the Cloudflare workerd runtime at compatibility date 2025-01-01: the old setting throws `Invalid redirect value`; manual mode succeeds. Provider requests now use manual redirect handling and a portable AbortController timer. Redirects are rejected without forwarding credentials. HTTP authentication, API credit exhaustion, rate limits and transport errors have separate messages. Diagnostic logs contain only provider name, failure category and elapsed time; no keys or user content. Key validation still must succeed before encrypted persistence.

### Report formats and free Excel-style editor (3.2)

The collection includes All locations, a compact ten-location landscape grid. Category and grand totals can each be placed at the top or bottom. Right-side totals include every selected location; source comparisons keep separate totals for separate date periods. All exports use the owner margins in inches: top 0.85, bottom 0.75, left/right 0.25, header/footer 0.30. Body alignment is left; Excel title/date information lives in the native print header.

Reusable formats support add/upload, edit, save, duplicate, delete and `.max-format.json` download. Definitions sync in the owner-private `report_formats` table and contain presentation settings only. Reference measurements can be refined by the existing local MAX model or explicitly selected paid cloud mode. API revisions prevent stale saves from replacing a newer format.

The bundled Jspreadsheet CE editor is free for business use under MIT, with no license key or subscription. It edits worksheet cells and formatting, supports worksheet tabs, copy/paste, undo/redo and widths/heights, and downloads the edited workbook. It preserves native XLSX parts, existing formulas and print settings while applying the owner's margins. Formula execution is disabled in the browser; Excel recalculates formulas on open. It does not provide Excel macros, chart editing or the complete Excel feature set. Only format settings, not edited workbook data, go into the reusable format library.

Evaluated primary documentation (2026-09-12): [Jspreadsheet CE](https://github.com/jspreadsheet/ce), [MIT license](https://github.com/jspreadsheet/ce/blob/master/LICENSE), [Handsontable licensing](https://handsontable.com/docs/javascript-data-grid/license-key/) (business use requires commercial licensing), and [Univer file conversion](https://docs.univer.ai/guides/sheets/features/import-export) (requires a conversion backend). CE was selected for a local, free editor that fits the existing app. Bundled license notices ship with the runtime.
