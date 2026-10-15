# MAX-ALPHA

MAX-ALPHA is a personal assistant web app with an optional Mac companion. Install the iPhone Home Screen edition using [the installation page](install.html) and [iPhone guide](IOS-INSTALL.md).

## Updates

Use **Check updates** at the top of the app, or Settings → Install & updates. Automatic checks default to off; enable **Check for updates automatically when online** on each device if wanted. Checks also require internet permission. Downloaded updates wait for Update & reopen after saving work. Automatic installation is disabled until a separately signed update channel is configured. The browser separately manages its service-worker lifecycle. Software updates do not synchronize personal records between devices.

Review build 1.16.3/build224 adds the saved opt-in. This uses the existing HTTPS/SHA256 web-release mechanism; the existing manifest remains unsigned. The separate signed-check foundation in draft PR #1 is not integrated. Native Mac updates and the standalone repository/security branch require separate reconciliation. This review does not establish release-signing authenticity or native installer compatibility.

Compared standalone security branch `ec21c0560d90b273517750be1d83626245d1b4e5` with the website. The website already has memory-only support access and no direct OpenAI/Gemini key requests, key persistence, key import/export or key tests. Ported only applicable provider-prefix rejection and pre-history/pre-request pasted-key blocking, preserving the unsent draft. Did not import unrelated features or the standalone storage migration. No credential was inspected, configured or deleted.

## Features and requirements

- Settings > Extensions > Check this device reports browser support for local AI, voice input, spoken replies and selected files, plus companion and cloud setup requirements. This read-only check requests no permissions and performs no network calls. Detected APIs do not establish that a model, microphone, account or service works.
- In the separate Hosted AI setup section, Check hosted AI setup reads the existing services' health metadata and configured model names after internet permission. It sends no question or provider-key test and makes no inference request. Setup readiness is distinct from a tested AI answer; it does not connect accounts.
- Conversation uses a separately configured AI connection or compatible downloaded local model. Installing the interface does not install a model or grant unlimited hosted AI.
- Bills & budget works locally without AI credits. It tracks user-entered statements and budget assumptions; it does not access banks, pay bills or guarantee savings.
- Work studio creates and exports documents and source files. Generated code requires review and testing. Local coding proposals depend on the Mac companion and configured local model.
- Voice, files, location and offline capabilities depend on device support and permissions. See [device coverage](DEVICE-GUIDE.md).
- Account and computer automation require separate setup in the Mac companion. Installing on a phone does not connect it to a Mac.

## Development

Use Node.js 22 or later for `npm test`. Serve the folder over localhost for development; use HTTPS for the public installation. `python3 scripts/build-release.py` creates the release manifest from the explicit shipped-file inventory. Publish every manifest-listed file and release.json together at the established app path. Never publish credentials, private runtime data or personal backups. Internal development history is retained separately and is not in the public release inventory.
