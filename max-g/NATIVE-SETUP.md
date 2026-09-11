# MAX-G Mac companion: apps, devices, mail, and browser actions

MAX-G still reasons locally with WebLLM in its browser window. This optional Python process gives that window access to approved Mac actions and account connectors. It runs on Michael’s Mac and has no cloud AI bill. The GitHub Pages copy alone cannot shut down a Mac, read Apple Mail, or drive another browser tab. Use the companion’s local MAX-G window for these features.

## Start on the Intel MacBook Pro

From the downloaded `max-g-web` folder, with Python 3.10 or later installed:

```sh
python3 -m venv companion/.venv
source companion/.venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r companion/requirements.txt
python -m playwright install chromium
python -m companion.server
```

The server binds only to `127.0.0.1:8766` and opens MAX-G with a private pairing fragment. Keep that Terminal window running; Control-C stops the companion. Use `python -m companion.server --no-open` if you want to open the app yourself. Follow the main connector setup guide for provider OAuth registration and pairing details. Do not run `server.py` directly: the package imports expect `python -m companion.server`.

The workflow browser starts only when you ask MAX-G to open a website. Its own Chromium profile lives in the companion’s private data folder, separate from your everyday Safari/Chrome profile. Log in manually inside that visible browser when a site requires it. Signed-in cookies stay in that local profile until you remove it while the companion is stopped.

## Enable the Mac permissions you want

In **System Settings → Privacy & Security → Automation**, grant the process you use to launch the companion permission to control the specific apps you want: Mail, Messages, Spotify, or System Events. macOS normally asks the first time. The entry may appear under Terminal, your Python launcher, or the packaged host you use.

For **desktop Observe/Press**, also enable that host under **Privacy & Security → Accessibility**. MAX-G reads the foreground app’s named accessibility controls and presses a selected control after review. It does not use unrestricted shell commands or blind coordinate clicking. Apps that do not expose accessible controls may need manual interaction. These macOS permissions are separate from MAX-G’s own Deny/Ask/Allow preferences. [Apple’s UI automation documentation](https://developer.apple.com/library/archive/documentation/LanguagesUtilities/Conceptual/MacAutomationScriptingGuide/AutomatetheUserInterface.html) and [Privacy & Security settings](https://support.apple.com/guide/mac-help/mchl211c911f/mac) describe the OS permissions.

No Full Disk Access is needed for this implementation’s Mail or Messages Apple events. Do not add it as a workaround for an Automation permission error.

## What is implemented

| Capability | Behavior and prerequisite |
|---|---|
| Open/close apps | Uses an exact installed bundle ID selected from the app inventory. Quitting respects the app’s unsaved-document prompts. It does not force-kill apps. |
| System volume | Reads or sets output volume 0–100; up/down applies a bounded increment. |
| Display brightness | Optional `brightness` utility, shown below. Supported internal/external displays only. |
| Shutdown/restart | Sends the specific macOS power command after review. Unsaved-document or OS prompts can delay it. |
| Factory reset | Opens **General → Transfer or Reset**. You complete any erasure in macOS. It does not erase disks or bypass an administrator password. |
| Calls | Exact phone numbers open the system’s `tel:` call handler; email addresses open FaceTime Audio. MAX-G reports a handoff, not a connected call. |
| Text messages | Exact number/address plus message body, with an explicit iMessage, SMS, or RCS service. Requires an enabled matching Messages account. SMS/RCS depend on configured iPhone forwarding and carrier support. No contact nickname guessing. |
| Spotify | Search opens a real Spotify search. An exact track/album/artist URI starts playback; pause, next, and Spotify volume also use Spotify’s Mac scripting interface. Availability and playback follow your Spotify account and app. |
| Apple Mail | Lists configured accounts/mailboxes, lists/reads individual messages, creates drafts/reply drafts, sends explicitly addressed plain-text messages, moves an exact message to a chosen archive mailbox, or marks it deleted. |
| Browser forms | Observes public web pages, fills text, selects options, presses an observed target, attaches explicitly selected files, and navigates back. Every mutation goes through the companion review gate. |
| Desktop controls | Reads bounded control labels from the foreground Mac app and presses an observed accessible control. Foreground app/window identity and control details must still match. |

Optional brightness installation:

```sh
brew install brightness
brightness -l
```

The setting accepts 0–1 and an exact display number returned by the read action. If the utility or display is unsupported, MAX-G reports that; it does not claim success. The utility’s [official README](https://github.com/nriley/brightness) documents its display and macOS limitations, including its use of undocumented display APIs on newer macOS versions.

For example, ask MAX-G to search Spotify for Mariah Carey. That opens matching results; it does not invent a track URI or claim music is playing before a real playback command succeeds. Copy a Spotify link’s track/artist/album ID into the equivalent `spotify:track:…`, `spotify:artist:…`, or `spotify:album:…` URI, or select a result through the observed desktop interface.

Apple’s [phone URL documentation](https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/PhoneLinks/PhoneLinks.html) describes calling handoffs. For cellular calls and SMS/RCS, configure the same Apple Account and iPhone continuity/forwarding as described in [Apple’s Mac calls and messages guide](https://support.apple.com/guide/mac-help/mchl1b152152/mac). This version does not autonomously answer incoming calls, listen to calls, or report delivery receipts it cannot verify.

**Intel reset limitation:** Apple’s Erase All Content and Settings feature requires a supported Mac with Apple silicon or the T2 Security Chip. Some Intel Macs do not have it. The companion opens the settings; [Apple’s erase/reset instructions](https://support.apple.com/102664) cover hardware-specific alternatives.

## Gmail, Hotmail, Outlook, Yahoo, and iCloud through Apple Mail

Add the accounts yourself in **Mail → Add Account** and complete the provider login. MAX-G uses Apple Mail’s configured accounts and does not retrieve account passwords. You can use this route for Yahoo and other IMAP accounts without building a new OAuth app. Gmail/Microsoft also have direct API connectors in this package; choose one route deliberately to avoid duplicate work.

In the Mail controls:

1. Read the account inventory and choose an exact account ID and mailbox path.
2. List messages, then select an exact message ID. Read the message before drafting a response or cleanup action.
3. Review recipients, sender, subject, and body before sending.
4. For archive, choose the actual destination mailbox returned by the account inventory. Provider mailbox names vary; MAX-G does not guess that “All Mail” and “Archive” are interchangeable.

Apple Mail reply creates a visible unsent reply draft. You can finish it in Mail. The plain-text Send action creates a fresh message from the reviewed sender/recipients/subject/body; it does not send an existing mutable draft by ID. Attachments are supported by the direct mail connectors and browser upload flow; this Apple Mail adapter does not attach files. Trash marks a message deleted using Mail’s API; it does not empty Trash or permanently expunge messages. Mail’s sync/account settings determine subsequent server behavior.

Mail bodies are capped at 16,000 characters per read; lists are capped at 50 messages. Email and website content is untrusted source material for MAX-G, never authorization to send, delete, or run a command.

## Browser review and human checkpoints

A page observation contains a URL, title, bounded text, and numbered targets with labels. MAX-G proposes a single action against a current revision. Before a press, the review includes the target and current form values. On execution, the backend rechecks the page, target descriptor, and form state. Navigation, replaced controls, changed field values, or expired observations require a new observation and review.

Visible password fields, CAPTCHAs, and one-time-code/security checks pause the automation. Complete them directly in the visible browser, then choose Observe again. MAX-G does not solve or bypass these checks. Credit-card/security-code fields are excluded from AI targets. Only files deliberately supplied through the upload flow can be attached. [Playwright’s official input documentation](https://playwright.dev/python/docs/input) describes the underlying fill/select/upload operations.

The workflow browser blocks resolved private/loopback destinations, non-web URLs, nonstandard ports, WebSockets, service workers, and downloads. This is a personal automation browser, not a hardened sandbox for hostile sites: keep Chromium updated and do not grant sensitive approvals to untrusted pages. Website automation can be affected by login sessions, anti-bot checks, site changes, and the browser’s capabilities.

## Verification and practical limits

The native tests use mock command runners only. All six fixed JXA programs were syntax-compiled on macOS. The actual Playwright integration tests used a fresh temporary Chromium profile and a synthetic localhost form, covering fill, select, upload, press, changed targets/values, and password/MFA handoff. They did not open personal mail, send messages, make calls, play music, shut down/restart, or change real device settings.

Run the same tests from the `max-g-web` folder:

```sh
python -m unittest discover -s companion/tests -p 'test_native.py' -v
python -m unittest discover -s companion/tests -p 'test_browser.py' -v
MAXG_BROWSER_INTEGRATION=1 python -m unittest discover -s companion/tests -p 'test_browser.py' -v
```

The integration flag enables localhost only for the synthetic test constructor. It is never enabled by the production companion server. Native action results must be checked on your own configured accounts/apps after you grant OS permissions. The iPhone PWA cannot control a Mac through `127.0.0.1`; that address always means the current device. Cross-device remote control is not enabled by this companion.
