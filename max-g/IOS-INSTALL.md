# Install MAX-G on iPhone and iPad

MAX-G is available as a free **Home Screen web app** from GoyoneByDesign:

- Installation page: <https://www.goyonebydesign.com/max-g/install.html>
- App: <https://www.goyonebydesign.com/max-g/>

## Install on each iPhone or iPad

1. Open **Safari** on the device and visit the MAX-G app address above.
2. On **iPhone**, tap Safari’s **Page Menu**, then **Share**. Some toolbar layouts show **Share** directly—the square with an arrow pointing up. On **iPad**, tap **Share**, then **View More** or **More** if needed.
3. Scroll through the Share options and choose **Add to Home Screen**. On iPhone, if this action is missing, scroll to **Edit Actions** and add **Add to Home Screen**. If offered, turn on **Open as Web App**.
4. Keep the name **MAX-G** and tap **Add**.
5. Open the blue MAX-G icon on your Home Screen.

These labels follow Apple’s current [iPhone instructions](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios), [iPad instructions](https://support.apple.com/guide/ipad/open-as-web-app-ipad8f1f7a29/ipados) and [Safari 26 web-app guidance](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/). Older versions of iOS may omit the **Open as Web App** switch. MAX-G’s manifest and Apple web-app metadata request an app window on supported versions. Apple controls the final installation UI; the website cannot silently add an app.

If you opened the link inside another app, use **Copy link** on the installation page, then paste it into Safari. The native share button, where available, shares only the public MAX-G address.

This is the website-installed iOS edition. It requires neither an unsigned IPA nor an Apple configuration profile. It is not an App Store/TestFlight binary.

## First use

- Use MAX-G’s sound controls to enable/test audio. Check media volume and Bluetooth output. iOS can require a tap before sound starts.
- Allow microphone and location access when you choose those features. Each device controls its own permissions.
- If verified local browser dictation is unavailable, dictate with the microphone on the iPhone keyboard into the text box.
- Choose **Settings → This device** to inspect local AI, sound, recording, files, location and online capabilities.
- Download a compatible local model or voice only when you want to use it. Installation itself does not imply these downloads are complete.

## Try your installed app

Open the blue MAX-G Home Screen icon. Type each message into its message box and tap the upward-arrow **Send** button; **Enter** also sends when using a hardware keyboard.

1. **`2 + 2`** — MAX-G should answer **4**. This checks sending without downloading a model.
2. **`weather for 20171`** — while online, check that MAX-G identifies **Herndon, Virginia** and shows the forecast. This explicit ZIP-code test does not require GPS permission.
3. **`I need advice`** — then describe what you need help with. For general AI conversation, check **Settings → This device**, use **Load local AI** on a compatible device, and keep MAX-G open until the initial model download completes. Use Wi-Fi for that first download; a Home Screen installation does not install the model itself.
4. **Hear MAX-G** — tap this sound control and enable **Speak replies**. If silent, check media volume and Bluetooth routing, then open **More controls → Sound help**. A voice may need its own download. Test microphone input only when ready to grant that permission, or use keyboard dictation.
5. **Settings → Install & updates** — check for an app update while online. Apply an offered update when your current work is saved.

If local AI is unavailable, the device check explains the missing capability. Installation and basic built-in tools can still work; do not treat successful installation as proof that every device can run a local conversational model. Current Safari supports WebGPU on iOS/iPadOS 26 and later, but model compatibility and available memory still matter.

## Shared releases and personal data

The iPhone/iPad app and the website use the **same HTML, JavaScript, styles and release assets**. Improvements do not need a separate iOS code fork or another Home Screen installation. Open MAX-G online to receive an available app update; apply it using the app’s update controls when you’re ready. Keep a working connection while the update downloads.

The installed Mac app packages the same web interface with its native integrations. Starting with 1.10.0, **Settings → Install & updates → Check for updates → Download update** downloads and verifies the shared interface. Quit MAX-G with **Command–Q**, then reopen it to activate the downloaded release. Its current conversation is never replaced mid-task. Native Python/Swift tool changes require a new Mac installer; the updater rejects a release requiring a newer companion.

Chats, memory, profile choices, permissions, API connection settings and downloaded models are stored per device/browser. **Shared software updates are not automatic personal-data synchronization.** Browser storage can be evicted or cleared; export important data using MAX-G’s existing data controls.

## Device differences

| Capability | iPhone/iPad web app |
| --- | --- |
| Text interface, animations and settings | Shared with the web release. |
| Weather, postal lookup, places and web research | Uses this device’s internet and the configured public tools; location access needs permission. |
| General local AI conversation | Requires compatible WebGPU support and enough available memory for the downloaded model. |
| Speaking voice | Uses supported local/browser voices; downloads and audio activation may be needed. |
| Microphone recording | Requires a supported browser and microphone permission. Recording support does not guarantee on-device dictation support. |
| Files and generated projects | Import through the device picker and export/download supported files. Arbitrary disk access is not granted. |
| Mac voice cloning, account automation and computer controls | Requires the Mac companion on that Mac. An iPhone’s `localhost` is the iPhone, not your Mac; remote pairing is not supplied by installing the PWA. |
| Offline use | Cached app interface and supported completed local downloads. Live weather, search and other online services remain online-only. |

## Maintainer checklist

Publish `install.html`, `install.css`, `install.js`, this guide, the shared manifest, icons and the full web release under `/max-g/`. Add the install page assets to the same release cache and local companion static-file allowlist. Keep `manifest.json` `id`, `start_url` and `scope` rooted at `./`, so installation launches MAX-G itself.

The install page loads only local assets and uses no third-party install service, tracking script or external QR generator. Its install button appears only after a real browser `beforeinstallprompt` event. Acceptance of that prompt is not reported as a completed install; completion is recognized from `appinstalled` or an installed display mode.

Verify on a physical iPhone/iPad after deployment: Add to Home Screen, launch from the icon, send a message with Enter, enable/test voice, use allowed location access, reopen after an update, and test an offline launch after a completed online visit. Automated browser checks cannot verify an Apple Home Screen installation or the actual microphone/speaker hardware.
