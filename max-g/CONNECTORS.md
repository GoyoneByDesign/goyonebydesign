# MAX-G — accounts, Mac controls and browser automation

MAX-G includes a working **Connectors & devices** hub and a local Mac companion.
Your existing chat, Orbit animations, WebLLM model, voice choices, notes, files,
learning controls and static PWA remain. The original Python desktop application
is preserved separately, unchanged.

The companion runs on your Mac at `http://127.0.0.1:8766`. It serves the same MAX-G
interface and provides the native capabilities a GitHub Pages website cannot
execute by itself. Language inference still runs inside your browser through
WebLLM; no paid model API is introduced. Email and cloud-file access naturally
require an internet connection to your chosen provider.

## Start on your Intel Mac

Keep the complete `max-g-web` folder together. In Finder:

1. Double-click **Setup MAX-G Companion.command** once. This creates a private
   Python virtual environment and installs Playwright and its Chromium browser.
2. Double-click **Start MAX-G Companion.command**. Leave its Terminal window open.
   It opens the local MAX-G interface with a fresh pairing key automatically.
3. Open **Connectors & devices**. Refresh connection status and select the
   capabilities you want. macOS can request Automation or Accessibility permission
   when you first use the corresponding native feature.
4. Stop the companion with **Control-C** in its Terminal window. Closing MAX-G’s
   web window alone does not stop the companion.

Equivalent Terminal commands, from this folder:

```sh
bash 'Setup MAX-G Companion.command'
bash 'Start MAX-G Companion.command'
```

Python 3.10 or newer is required. If Python is missing, install it with Homebrew:

```sh
brew install python
```

For supported display-brightness control, install the optional native utility:

```sh
brew install brightness
```

Some displays do not expose controllable brightness; MAX-G reports unsupported
instead of pretending to change them. [Native setup details](NATIVE-SETUP.md)

The local app and the hosted `max-g.goyonebydesign.com` app are different browser
origins, so each has its own local conversations and model cache. Continue using
one origin to avoid duplicate model downloads. Export/import notes when moving.

## Search the web without a Cloudflare setup

Version 1.3.1 adds public search to the local companion. Keep the optional Worker
URL blank in **Settings → Connection**, then select **Test web search**. No email,
cloud-file or browser-automation permission is needed for a public query. MAX-G's
Internet permission still applies. Only the current query goes to Bing's public
RSS search endpoint; account content, notes and chat history are not added.

The helper checks certificates using the native Mac trust store through the pinned
`truststore` package. It never disables HTTPS verification. A provider block,
timeout or certificate error is reported honestly. [Search setup](LOCAL-SEARCH.md)

## Connect accounts

Use **Connections → OAuth application configuration** to register your own free
provider client IDs, then choose scopes and **Connect account**. Follow the secure
sign-in link, approve provider consent, and return to **Refresh accounts**. These
are actual OAuth authorization-code flows with PKCE and expiring, one-use state.
Provider registration and sign-in have not been performed on your behalf.

| Connector | Implemented capabilities | Setup |
| --- | --- | --- |
| Google / Gmail | List/read mail, create drafts/reply drafts, send reviewed messages with attachments, archive, move to trash | Google desktop OAuth client; Gmail API enabled |
| Google Drive | List files, download supported files, upload files | Drive API and selected scopes; write scope covers app-created/selected files |
| Microsoft / Outlook / Hotmail | List/read mail, drafts/replies, reviewed send, archive and trash | Public-client Microsoft registration supporting your personal/work account |
| OneDrive | List, download and upload files | Microsoft delegated file scopes |
| Dropbox | List, download and upload files | Scoped Dropbox app with PKCE |
| Apple Mail / Yahoo / iCloud / other configured mail | List/read messages, plain-text drafts/replies, reviewed send, explicit archive folder and trash | Add the account in Apple Mail yourself and grant macOS Automation access |

[Exact provider registration, callback URLs and scope instructions](PROVIDER-SETUP.md)
are included. Account credentials remain in macOS Keychain. Public client IDs and
Google’s desktop-client secret, if required, are stored by the companion, not in
the public GitHub repository. MAX-G never requests your email password in chat.

The Mail tab provides a real message list and reader, a composer, and **Professional**
and **Casual** local rewriting. Rewrites preserve requested facts but need review:
small local models can still make mistakes. Replies are saved as drafts first.
Sending uses a separate, immutable preview of the exact recipients, subject, body
and attachment names. Provider acceptance is reported separately from delivery.
Mail cleanup uses selected messages and reversible archive/trash; there is no
unreviewed bulk purge or permanent-delete endpoint. Apple Mail’s own trash settings
may later remove trashed mail, so review your Mail preferences.

Cloud transfers and browser uploads are bounded to **8 MB per action**. Direct
email attachments allow **six files, 2 MB combined**. Apple
Mail’s adapter handles plain-text mail; use the direct Google/Microsoft connector
or the automation browser for attachments. Basic Google-native file downloads may
be exported to the supported document format; see provider details.

## Mac tools and spoken/direct commands

Open the Mac & devices tab to list installed apps, launch or request normal quit,
set output volume, adjust supported brightness, control Spotify, hand off a call,
send through Messages, or inspect supported Accessibility controls.

Direct chat/voice commands include:

- `Open Spotify`
- `Close Spotify`
- `Volume up`
- `Set volume to 30%`
- `Set brightness to 60%`
- `Pause Spotify`
- `Restart my Mac`
- `Shut down my Mac`
- `Call +15555550123`
- `Text +15555550123: I will be there at five.`
- `Send an iMessage to michael@example.com: See you soon.`
- `/mail`, `/files`, `/browser`, `/devices` open the corresponding tool panel
- `/connectors`

Voice commands use the existing on-device speech support and follow the same
permissions as typed commands. Exact recipients are required for communications;
MAX-G does not guess a contact from a first name.
Replace the example phone/address with your intended recipient. `Text` requests
SMS; explicit iMessage and RCS commands choose those services. SMS/RCS require
configured iPhone forwarding. These commands display a review before dispatch.
Opening the Mail panel does not read an account until you choose a mailbox action.

Spotify search opens the requested query in the Spotify app. Playing a specific
track, album or artist uses a real Spotify URI. It never invents a URI or says a
search has started playback. Public music lookup, where offered, uses your existing
configured search Worker and shows verified Spotify links to choose from.

Calling hands off an exact phone number or email address to the system calling
application. It does not claim a connected call. Phone calling and SMS/RCS depend
on your Mac/iPhone accounts, carrier and forwarding settings. Messages requires the
corresponding enabled native account; iMessage availability differs from SMS/RCS.
[Apple’s Mac Messages guide](https://support.apple.com/guide/messages/welcome/mac)

Shutdown and restart request the standard macOS action after an explicit review;
macOS may show unsaved-document prompts. **Reset computer** opens macOS’s own
Transfer or Reset settings for you to finish. It does not erase disks or bypass
macOS authentication. A local MAX-G reset code clears MAX-G data, not the computer.

## Browser and desktop work

Version 1.2 adds **Shopping & food** for retailer and restaurant websites. Start
with a list, budget and fulfillment choice; MAX-G proposes cart-preparation steps
and pauses for your final order review. Try `shop on Amazon for headphones` or
`order food from DoorDash` to open the shopping panel with your request. Those
commands do not place an order by themselves. [Shopping and phone-call setup](SHOPPING.md)

The Browser tab opens a separate persistent Chromium profile. Sign into websites
there yourself; MAX-G does not extract your normal browser cookies/passwords.
Observe the page, select a visible target, fill or select a value, upload chosen
files, and review a button press. The local model can propose a sequence of up to
five browser actions using an Observe–Think–Act loop. Each proposed action uses
real observed target IDs, never arbitrary executable JavaScript.

A press/upload review identifies the page, target and form values. A changed page,
control, form value or expired observation requires a fresh observation/review.
CAPTCHA, MFA and password screens hand control back to you. After completing the
check in the browser, select **Observe page** to continue. MAX-G does not bypass
verification or promise universal access to websites.

Desktop control uses bounded Accessibility observations and validated button
presses on the current frontmost app/window. It requires macOS permission and does
not offer arbitrary shell commands or blind coordinate clicks. macOS and individual
apps can withhold unsupported controls.

## Permissions, cancellation and reset

The hub has separate **Ask / Allow / Deny** permissions for mail reading/writing/
sending, cloud reading/writing, browser, apps, system, desktop controls, calls and
messages. Limited defaults to Ask. Full can allow routine operations such as volume
changes and app launch. It does not override macOS or provider permissions.

Sends, destructive mail changes, app closing, browser/desktop presses, uploads,
power actions and calls retain explicit review. Action previews are immutable,
expire after five minutes and are consumed before execution. Changing permissions,
changing/reconnecting an account, disconnecting or starting reset invalidates old
pending actions. An old approval cannot be reused after an account switch.

**Cancel** stops further steps and discards a pending review. It cannot undo an
already submitted email, native operation or completed upload. An uncertain network
result is not automatically retried; check the target before requesting it again.

Typing or saying the existing MAX-G reset code also attempts to reset a paired
companion. The hub can independently reset connector credentials, the helper-owned
browser profile and connector permissions. It does not delete online accounts or
cloud/email data. If the helper is offline/unpaired or its Keychain is unavailable,
MAX-G reports that its reset could not be confirmed. Provider account settings can
also revoke MAX-G’s account grant directly.

## Hosting and privacy

Continue publishing the static PWA to GitHub Pages with the existing custom DNS.
The companion runs only on the local Mac; GitHub Pages does not host it. Its HTTP
listener binds only to IPv4 loopback and checks Host, exact Origin and a random
Bearer pairing key. The pairing key goes in the initial URL fragment, is removed
from the address bar, and is kept only for that browser session. Account tokens
remain in Keychain; no secret is placed in IndexedDB or the model prompt.

The hosted PWA may connect to the helper on the same Mac after pairing and granting
browser Local Network Access. If a browser blocks this route, use the local app
opened by the launcher. This is not a LAN/remote-control server. An iPhone’s
`localhost` is the iPhone, not your Mac; the iPhone PWA keeps its supported local-chat
features but cannot use this Mac-only companion remotely.
[Chrome Local Network Access](https://developer.chrome.com/blog/local-network-access)

`companion/private/`, `companion/.venv/`, browser profiles and pairing keys must not
be uploaded or synced to Google Drive. `.gitignore` excludes them from Git only;
it does not configure cloud-sync exclusions. Sync the source ZIP instead. Search
queries still go through your configured search Worker; private email/file contents
used for rewriting stay in the local model and never go to that search tool.

## Validation and remaining setup

See [CONNECTOR-VERIFICATION.md](CONNECTOR-VERIFICATION.md). Automated tests use
explicit provider/native fixtures; browser form tests use an isolated synthetic
page. Actual account consent, email delivery, calls, native app control permissions
and hardware brightness must be checked on your device after you opt in. Nothing
was sent, erased, shut down or reset during development.
