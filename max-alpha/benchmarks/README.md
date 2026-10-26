# MAX-ALPHA document retrieval benchmark — October 26, 2026

Synthetic Node.js microbenchmark, not a browser or end-to-end assistant benchmark. No provider requests, files from the user, downloads or paid services are used. Six synthetic files, each capped at120,000 characters. Cold timing is a single observation; warm timing is the median of35 repeated queries. Both runs verified identical output before and after. Runtimes vary with host load; these are observations, not a performance guarantee.

Baseline: `document-context.js` from public website commit `8a12bfc630fa915a28cccdb7f5ab1769aa41aab5`, browser1.16.7/build228. Save that file as an absolute-path `.mjs` file, then run:

```
node benchmarks/document-retrieval.mjs /absolute/path/to/build228-document-context.mjs
```

| Case | Run1 warm median before→after | Run2 warm median before→after |
|---|---|---|
| Short English query |0.480→0.216ms (2.22×)|0.323→0.227ms (1.42×)|
| Repeated Japanese query |1.195→1.046ms (1.14×)|1.356→1.377ms (0.98×; approximately unchanged)|
| Long diverse query |102.047→4.024ms (25.36×)|134.018→8.652ms (15.49×)|

Optimization intersects the smaller term set and normalizes selected excerpt text once rather than once per match. Scores, ordering, budgets, source labels and output are preserved.24 deterministic golden outputs generated with the baseline are also tested. This does not establish10× overall performance, zero lag, faster model generation, improved cold startup or UI rendering. Network/provider latency and browser visual responsiveness were not measured in the restricted execution environment.
