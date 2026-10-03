# MAX-ALPHA

MAX-ALPHA is a personal assistant web app with an optional Mac companion. Install the iPhone Home Screen edition using [the installation page](install.html) and [iPhone guide](IOS-INSTALL.md).

## Updates

Use **Check updates** at the top of the app, or Settings → Install & updates. Web editions check on opening and foregrounding while online. A fresh, idle launch can apply a downloaded update automatically. Once interaction begins, choose Update & reopen after saving work. Software updates do not synchronize personal records between devices.

## Features and requirements

- Conversation uses a separately configured AI connection or compatible downloaded local model. Installing the interface does not install a model or grant unlimited hosted AI.
- Bills & budget works locally without AI credits. It tracks user-entered statements and budget assumptions; it does not access banks, pay bills or guarantee savings.
- Work studio creates and exports documents and source files. Generated code requires review and testing. Local coding proposals depend on the Mac companion and configured local model.
- Voice, files, location and offline capabilities depend on device support and permissions. See [device coverage](DEVICE-GUIDE.md).
- Account and computer automation require separate setup in the Mac companion. Installing on a phone does not connect it to a Mac.

## Development

Use Node.js 22 or later for `npm test`. Serve the folder over localhost for development; use HTTPS for the public installation. `python3 scripts/build-release.py` creates the release manifest from the explicit shipped-file inventory. Publish every manifest-listed file and release.json together at the established app path. Never publish credentials, private runtime data or personal backups. Internal development history is retained separately and is not in the public release inventory.
