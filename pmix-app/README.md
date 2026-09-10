# Anita's PMIX Reports · MAX

Private reporting app for Michael Goyone. The GoyoneByDesign website footer opens this owner-only workspace. MAX uses an on-device Qwen model through Transformers.js, with no API key required. Confirmed layout/column/menu mappings persist in a private D1 database. The version, build, update timestamp, learning revision, and applied timestamp appear in the footer.

## Reporting

Upload multiple XLSX, CSV/TSV and PDF files. Toast's All levels item rows supply quantities; Summary and Items are reconciliation controls, not extra sales. The supplied six-tab export and 99-page comparison PDF were used as reference layouts and reconciliation fixtures only. Toast gift-card Add Value is excluded from item PMIX. Private source files are not shipped with this code.

PDF text extraction and scanned PDF English OCR run locally. Review pages, row types and recognized quantities before importing. Unknown spreadsheet layouts offer explicit column mapping and optional MAX proposals, saved after confirmed import. CSV is a single table; Excel can contain multiple tabs. Historical presentation workbooks with mixed channel/day-part columns require column review, not silent addition of subtotals.

Multi-select locations, dining options, menus, categories and items. Matching names may combine across menus. Grand totals retain n.a. for missing coverage. Include item-level net sales only when actually present; Summary-only revenue is not allocated to items. Basket = item quantity - Platter - Meal. Serving revenue is unavailable unless separately sourced; the app does not allocate item revenue among forms.

Compare Previous and Current date periods. DIFF = Previous - Current; VAR = DIFF / Previous. Previous zero means n.a. Total VAR is calculated from grand totals. Comparison rows are stacked for readable printing. Different-period missing locations are not converted to zero. Duplicate and overlapping imports are rejected. Export grayscale Excel/PDF on Letter, Legal or Ledger, portrait or landscape, with MG, date, path and page count.

Exact date/time slicing requires timestamped rows. Source aggregate reports cannot be split into finer intervals. BK 04:00–10:59; LN 11:00–15:59; DN 16:00–23:59, America/New_York. BK serving type means Basket and is separate from BK day part.

## MAX and memory

Start MAX to download its local model on the current device. Model files are cached by the browser when supported; the first download requires internet and sufficient memory. WebGPU is preferred; WASM is the fallback. MAX serves deterministic PMIX help from verified reporting guidance, supports general on-device chat, and proposes column mappings for review. Public web search returns source links using a server-side RSS search request. Microphone input and text-to-speech use supported browser speech APIs; audio is not stored by MAX. Source calculations remain deterministic. Model weights are not retrained, and learning revision advances only for a changed confirmed mapping. Memory is checked when the app opens; a separate scheduled review maintains sourced knowledge and checks relevant documentation; model weights do not train unattended. Original reports stay on the importing device; Save report data transfers/backups that data.

Optional OpenAI Responses API support provides cloud help and official Toast web research when a server-side API key is configured. The provisioning connector rejected key creation in this session. No key was created or embedded. Standalone MAX remains usable without it. Standalone web search is also available without the optional OpenAI connection. Saved owner notes and full conversations with source links are private and searchable across devices. Conversation history is not treated as verified factual knowledge. Relevant prior conversations are retrieved for local MAX context; model context and database storage remain finite. Main-site MAX and PMIX buttons open the same owner-only workspace. Uploaded reports are reference layouts unless explicitly imported as a reporting dataset.

## Build and hosting

`npm ci --ignore-scripts`, `npm run prepare:assets`, then `npm run build`. The asset step downloads public OCR/PDF libraries and the English OCR language file; MAX downloads model weights on first use. `npm test` checks calculations, print settings, missing values, owner access, signed PIN sessions and durable learning revisions. `npm run db:generate` generates schema-only Drizzle migrations.

The worker expects Sites identity headers, owner-only platform access, D1 binding DB, and secret environment values. Never deploy the Worker publicly with spoofable identity headers. GitHub Pages hosts the portfolio and PMIX launcher; it cannot execute this private Worker. Keep private report data, keys, PIN values and session secrets out of GitHub. Runtime secrets belong in hosted environment settings; `.env.local` is ignored.

The source build emits `dist/client` assets, `dist/server/index.js`, and `dist/.openai` hosting/migration metadata. MAX and OCR runtime code is bundled; the model downloads directly from its public model repository. Original GoyoneByDesign logo is reused from the portfolio.

Version 2.0.0 · Build 4. Browser visual testing has not been requested. Computational, source-file and export checks were run; local model inference was exercised on CPU.

MAX's calculator uses math.js 15.2.0 in a dedicated worker with a four-second timeout and a constrained expression tree. Arithmetic, statistics, small matrices, units and derivatives are computed deterministically. Type `math: expression` in chat or open Calculate with MAX; successful results are saved to private history. No general-purpose code execution is enabled. Coding assistance drafts/explains/reviews code through the model and may be limited by model capability. See the primary [math.js security guidance](https://mathjs.org/docs/expressions/security.html). Future plugins need explicit, individually scoped integration; there is no automatic installation of all tools.
