# MAX-G browser tasks

The installed MAX-G Mac app has a **Browser task** button at the top of the conversation. The animated companion stays visible while messages scroll. Replies default to 22 pixels; your custom display settings remain available in Settings → Display & animation.

## Start a task

1. Choose **Browser task**.
2. Enter the full website address and a short, specific goal with the details to enter.
3. Choose **Open & start**. MAX-G opens its separate automation browser and shows a recent page preview, readable text and task activity in the side panel.
4. Review prepared actions when prompted. MAX-G proposes up to five steps per run. **Continue** reads the current page and continues the goal; **Stop task** stops further work.

You can also type **Open https://example.com** to open a page immediately, or **Fill the contact form at https://example.com/contact with Name: Michael and Message: Please contact me about your services.** Replace the example with the actual website and your intended details. If you omit the address, MAX-G opens the panel and asks for it. Opening a URL needs no AI model; planning form steps loads the selected local model when needed.

**Show browser** brings the real browser window forward. **Refresh view** reads changes you made there. **Page controls & attachments** lets you choose an observed field, fill a value, select an option, review a click, or choose a file for an upload. The preview hides form values; the real browser retains what you entered. Password, CAPTCHA and verification pages pause for you and do not produce an image preview.

The panel uses your existing Mac companion access settings and action reviews. It does not reuse your personal Safari or Chrome profile. It never reports a successful signup, application, purchase or upload unless the action result and page evidence support that conclusion. A model's “finished” report is labeled for you to check. Site changes and ambiguous model proposals can pause a task; refine the goal or use the page controls. Goals are limited to 1,200 UTF-8 bytes so the complete request fits the small local planner; work through longer applications in sections.

The website shares the panel UI. Actual Mac browser control requires the installed companion on the same Mac and its pairing. A phone or tablet cannot remotely control this Mac through the public website. No new cloud model or paid account is needed.

## Quick weather

Ask **Weather in Tokyo**, **Weather in 10001, US**, or **Weather tomorrow in London, UK**. MAX-G uses location and forecast tools directly, without loading an AI model. Save your place and country in **Places & directions → Save location** to make **weather** sufficient. Alternatively, explicitly request your device location and allow its location prompt.

Recent resolved locations are reused and up to six valid forecasts remain in memory for one minute. Weather appears before voice preparation finishes. Clearing location permissions or resetting MAX-G clears this weather cache. If no location is known, MAX-G asks for one instead of guessing.

In a public endpoint test on September 13, 2026, Tokyo's location and current forecast arrived in 1.04 seconds. Network conditions and provider availability still affect response time. The location lookup has a 4.8-second total deadline; the forecast request has a 6-second deadline. Failures produce a clear message instead of fabricated weather.
