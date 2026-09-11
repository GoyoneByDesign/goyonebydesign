# MAX-G account connectors

MAX-G now includes working OAuth adapters for Gmail, Google Drive, Outlook/Hotmail, OneDrive, and Dropbox. They run in the Mac companion, while MAX-G's language model continues to run locally in the browser. No paid AI API is involved. Account services still require internet access and enforce their own account, storage, and API limits.

The code is implemented; your accounts are **not connected yet**. Register your own OAuth clients, enter the client IDs in **Connectors**, and sign in through the provider's consent page. OAuth tokens and the companion's client configuration are stored in this Mac's Keychain. They are not sent to GitHub Pages, the search Worker, or the language model.

## Start the companion

Follow [CONNECTORS.md](CONNECTORS.md) for installation and pairing. Keep the Mac companion running at its default address, `http://127.0.0.1:8766`. Its callback URLs are:

| Provider | OAuth callback URL |
|---|---|
| Google | `http://127.0.0.1:8766/oauth/callback/google` |
| Microsoft | `http://127.0.0.1:8766/oauth/callback/microsoft` |
| Dropbox | `http://127.0.0.1:8766/oauth/callback/dropbox` |

If you change the companion port, use the exact callback URL shown in its connection status when configuring the provider. These callbacks terminate on your Mac. Do not use the public GitHub Pages domain as the desktop OAuth callback.

## Gmail and Google Drive

1. Open [Google Cloud Console](https://console.cloud.google.com/), create a project, and enable **Gmail API** and **Google Drive API**.
2. Open **Google Auth Platform**. Configure the app's branding, audience, and contact details. For a personal development project, add your Google account as a test user.
3. Under **Clients**, create an OAuth client with application type **Desktop app**, named MAX-G. A Desktop client supports loopback redirects; do not select Web application, iOS, or Chrome extension for this Python companion.
4. Copy its client ID to MAX-G's Google connector configuration. If Google's downloaded desktop client credentials include a client secret, copy that into the optional Google desktop client-secret field. MAX-G stores it locally in Keychain.
5. Select the features you want and click **Connect**. Sign in in your normal browser, review Google's permission page, and return to MAX-G after the callback reports success.

The adapter implements authorization-code PKCE with a one-time state, uses a ten-minute sign-in window, refreshes expiring tokens, and removes revoked credentials. A new authorization replaces the previous account; MAX-G supports one connected account per provider in this version. Google's installed-app flow does not support incremental authorization, so reconnect with the complete set of desired features when changing permissions. [Google desktop OAuth documentation](https://developers.google.com/identity/protocols/oauth2/native-app)

| MAX-G permission | Google scope | What it enables |
|---|---|---|
| `mail.read` | `gmail.readonly` | Search/list and read messages |
| `mail.write` | `gmail.modify` | Save drafts, archive messages, move messages to Trash |
| `mail.send` | `gmail.send` | Send a reviewed message |
| `drive.read` | `drive.readonly` | Browse and download files the account can access |
| `drive.write` | `drive.file` | Upload new files; access is limited to files created or opened through this app |

Google scopes in the table are prefixed with `https://www.googleapis.com/auth/`. `gmail.modify` itself is broad enough to send mail at Google's API level; MAX-G additionally requires its separate `mail.send` feature and action review before sending. Gmail reading/modification and broad Drive reading are restricted scopes. A public multi-user release can require Google's verification and other obligations; a developer registration is not a guarantee of unrestricted public distribution. [Gmail scope reference](https://developers.google.com/workspace/gmail/api/auth/scopes), [Drive scope reference](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)

An external Google project in Testing can issue refresh tokens that expire after seven days for these scopes. Reconnect when prompted; do not treat a testing connection as permanent. Publishing status and organizational policies affect this behavior. [Google token expiration documentation](https://developers.google.com/identity/protocols/oauth2#expiration)

With Drive's limited write scope, uploading into an existing folder may fail if that folder was not granted to MAX-G. Uploading a new file at the drive root is supported. The connector does not request full-drive deletion rights and has no delete-file action.

## Outlook, Hotmail, and OneDrive

1. Open the [Microsoft Entra admin center](https://entra.microsoft.com/), go to **Identity → Applications → App registrations**, and choose **New registration**.
2. Name it MAX-G. For Hotmail/Outlook.com as well as work or school users, select **Accounts in any organizational directory and personal Microsoft accounts**. Organization administrators may restrict app registrations or user consent.
3. Configure a **Mobile and desktop applications / public client** redirect for `http://127.0.0.1:8766/oauth/callback/microsoft`. Microsoft currently requires editing the app manifest when adding an HTTP redirect with the literal `127.0.0.1` address. In the current Microsoft Graph manifest this is the `publicClient.redirectUris` list; older portal manifests label the equivalent collection `replyUrlsWithType` with type `InstalledClient`. Preserve your other manifest fields.
4. Configure the app as a public client. Do not create a server client secret or select a SPA redirect. MAX-G uses the authorization-code flow with PKCE and no Microsoft client secret.
5. Under **API permissions → Microsoft Graph → Delegated permissions**, add the scopes corresponding to the features you want from the table below. Add `offline_access` for refresh tokens.
6. Copy **Application (client) ID** from Overview into MAX-G's Microsoft connector configuration. Select the desired features and connect through Microsoft's consent page.

These settings use Microsoft's `common` authority, so personal and organizational accounts can sign in when the app's supported-account setting permits them. [Microsoft authorization-code flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow), [Microsoft redirect URI rules](https://learn.microsoft.com/en-us/entra/identity-platform/reply-url)

| MAX-G permission | Microsoft delegated scope |
|---|---|
| `mail.read` | `Mail.Read` |
| `mail.write` | `Mail.ReadWrite` |
| `mail.send` | `Mail.Send` |
| `drive.read` | `Files.Read` |
| `drive.write` | `Files.ReadWrite` |

These mail permissions are available for personal Microsoft accounts; organizational policies can require administrator approval. `Mail.ReadWrite` does not itself grant sending. The adapter accesses the signed-in user's mailbox and OneDrive; it does not use application-wide tenant permissions. [Microsoft Graph permission reference](https://learn.microsoft.com/en-us/graph/permissions-reference)

MAX-G can list/read mail, create a draft or threaded reply draft, send a reviewed message, archive, and move mail to Deleted Items. An accepted send is reported as accepted, not confirmed delivery. [Microsoft Outlook API overview](https://learn.microsoft.com/en-us/graph/api/resources/mail-api-overview?view=graph-rest-1.0), [message move API](https://learn.microsoft.com/en-us/graph/api/message-move?view=graph-rest-1.0)

## Dropbox

1. Open the [Dropbox App Console](https://www.dropbox.com/developers/apps) and create a **Scoped access** app.
2. Choose **App folder** to restrict MAX-G to its dedicated Dropbox folder. Choose **Full Dropbox** only if you want to browse your existing Dropbox files. These are Dropbox's content boundaries; MAX-G's own Limited/Full device setting does not override them.
3. Add `http://127.0.0.1:8766/oauth/callback/dropbox` to the app's OAuth redirect URIs, exactly as shown. Enable public clients/PKCE where the console exposes that setting. The code uses authorization-code PKCE; it does not use an implicit token flow.
4. Under **Permissions**, enable `files.metadata.read` and `files.content.read` for reading. Enable `files.content.write` for uploads. Submit/apply the permission changes.
5. Copy the **App key** into MAX-G's Dropbox client-ID field. No app secret or manually generated bearer token is needed. Select the features and connect.

An App folder app sees its app folder as the root, so leave the folder field empty to list that root. Paths such as `/Projects` are relative to the permitted Dropbox root. Development apps initially support the creator and a limited test audience; a broader public rollout requires Dropbox's production process. [Dropbox getting started](https://www.dropbox.com/developers/reference/getting-started), [Dropbox access levels](https://www.dropbox.com/developers/reference/developer-guide)

MAX-G requests short-lived access tokens and a refresh token with `token_access_type=offline`. Refresh tokens stay in Keychain; “offline access” here means background token renewal, not that Dropbox files work without an internet connection. [Dropbox OAuth guide](https://developers.dropbox.com/oauth-guide)

## Yahoo Mail and other mail accounts

Use the companion's **Apple Mail** connector for Yahoo Mail, iCloud Mail, and other accounts already configured in the Mac's Mail app. Add the account through macOS Internet Accounts or Mail's Add Account flow, then allow the companion's macOS Automation request for Mail. That route uses Mail's existing authenticated account; MAX-G does not collect Yahoo passwords or pretend that a Gmail token works for Yahoo. Native Mail capabilities and limits are described in [CONNECTORS.md](CONNECTORS.md).

## What is implemented, and what to check after connecting

1. Start with read access, list a few emails or files, and open one item.
2. Create a draft addressed to yourself. Check the exact recipients, subject, text, and attachments in MAX-G's review panel.
3. Send only when you choose **Confirm** for that concrete message. Reply generates a draft first; mail cleanup moves individual messages to Archive or Trash and never permanently deletes them.
4. Upload a small test file and download it again. Transfers are bounded to **8 MB** each. Email attachments are bounded to **2 MB total**, up to six attachments. These are deliberate companion limits, not provider quotas.
5. Disconnect and verify MAX-G no longer lists the provider as connected. Google and Dropbox remote revocation is attempted. Microsoft local disconnect removes the token; remove MAX-G in Microsoft's connected-app permissions to revoke the account grant as well.

The **2 MB email limit is separate from the 8 MB cloud-file limit**. Outlook's direct attachment API accepts attachments under 3 MB; larger attachments require an upload-session workflow. MAX-G uses a 2 MB total cap for both email providers to leave room for base64/MIME encoding, and rejects an oversized encoded Outlook request before sending it. Very long message bodies may require reducing the attachments further. For larger files, upload to your cloud storage or attach them in the provider's own app. [Microsoft direct attachment limits](https://learn.microsoft.com/en-us/graph/api/message-post-attachments?view=graph-rest-1.0), [Microsoft large-attachment upload sessions](https://learn.microsoft.com/en-us/graph/outlook-large-attachments)

Mail is normalized to plain text for MAX-G; scripts, remote images, and tracking pixels are not rendered. Existing rich-text drafts are converted to a reviewed text snapshot before sending; inline or linked attachments that cannot be preserved are rejected with instructions to send from the provider app. Snapshot sending leaves the original draft intact and says so. No send or upload is automatically retried after an ambiguous failure.

OneDrive downloads use Graph's preauthenticated content redirect without forwarding the OAuth bearer token to the download host. MAX-G accepts a narrow Microsoft download-host list and one HTTPS hop; unfamiliar enterprise hosts are rejected with an instruction to download in OneDrive. [Microsoft download API](https://learn.microsoft.com/en-us/graph/api/driveitem-get-content?view=graph-rest-1.0)

Gmail sends use real RFC-compliant MIME messages and base64url encoding, including attachments. Google Docs, Sheets, and Slides can be exported to DOCX, XLSX, and PPTX within the transfer limit. Microsoft and Dropbox uploads fail on filename conflicts instead of silently overwriting existing content; Google creates a new file. [Gmail sending API](https://developers.google.com/workspace/gmail/api/guides/sending), [Google Drive upload API](https://developers.google.com/workspace/drive/api/guides/manage-uploads)

## Validation boundary

Automated tests cover OAuth PKCE/state expiry/replay, partial consent, refresh-token rotation/revocation, Keychain argument hygiene, recipient/header validation, actual provider request formats, bounded transfers, safe redirects, and immutable draft snapshots. They use mocked provider responses and Keychain calls. No live account was signed in, read, modified, or sent from during development. Your first authenticated provider checks therefore remain part of setup.

The direct API adapters do not implement calendars, contacts, shared tenant mailboxes, team-space administration, large multipart upload sessions, or incoming mail attachment downloads in this version. Native app/browser workflows remain available for services beyond this connector set. iPhone Safari cannot run the Mac companion on the phone; device control and these desktop OAuth callbacks operate on the Mac where the companion runs.
