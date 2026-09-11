# Shopping, food orders, and calls with MAX-G

MAX-G can help prepare a cart in its visible workflow browser, review a food order or shopping list with you, and submit a final website action after you approve the exact order. It uses the local Mac companion and your own signed-in merchant account. It does not have a universal ordering API, and a merchant must support the browser workflow for an order to complete.

## Start a shopping session

1. Start the companion using the steps in [NATIVE-SETUP.md](NATIVE-SETUP.md), then open its paired MAX-G window.
2. Open **Connectors → Shopping & food**. Choose a store or delivery service, or enter the public URL of a restaurant or retailer.
3. Write your shopping list or food order. Include quantities, sizes, substitutions, and any dietary requirements you want the merchant to follow. Select delivery, pickup, or shipping, the currency, and an optional maximum total budget.
4. Select **Open shopping website**. If the merchant requires sign-in, a CAPTCHA, a security code, or payment details, complete that step yourself in the visible browser. Select **Observe shopping page** afterward.
5. Use **Prepare cart with MAX-G** to propose browser steps. Review each proposed website press before approving it. You can also select an observed control and prepare the cart one step at a time.

The store shortcuts include Amazon, eBay, Costco, Walmart, Giant Food, The GIANT Company, CVS, DoorDash, Uber Eats, and Grubhub. These are links to their websites, not merchant partnerships or guaranteed working integrations. Availability, delivery areas, memberships, merchant prices, and website changes still apply. **Giant Food** and **The GIANT Company** are separate choices; check the website and location before preparing an order.

## Review the final order

At checkout, check the merchant's visible order summary. Use **Final order review** to provide the exact total and currency, items and quantities, delivery or pickup details, and a non-secret payment summary such as “Visa ending 1234.” Review taxes, shipping or delivery charges, tips, substitutions, recurring subscriptions, and the address or pickup location on the merchant's page. Never put full card numbers, security codes, passwords, or one-time codes in the chat or review fields.

Check the merchant’s actual billing currency yourself. A bare **$** or **¥** is ambiguous: MAX-G interprets it using the selected shopping currency and displays a currency-assumption warning. That is not independent currency verification, and MAX-G does not perform a foreign-exchange conversion. If the merchant currency is unclear, finish checkout yourself. Explicit codes or markers such as USD, CAD, CA$, or CN¥ provide clearer evidence.

The final approval is tied to the current page and form state. MAX-G blocks submission when the observed total is absent, ambiguous, inconsistent with your review, above your budget, or part of a truncated checkout observation. A changed cart, changed form, navigation, or expired observation needs a fresh observation and review. The price parser recognizes supported English total labels and conventional currency amounts; unsupported decimal/comma formats or other localized checkout text require manual checkout. Do not change the review amount just to make an unfamiliar format pass. A generic cart-preparation approval is insufficient for an identified final purchase control or an ambiguous checkout control.

After approving the final action, verify the merchant's confirmation page or order history. A submitted browser click is **not** proof that the merchant accepted an order or charged the intended amount. If the browser times out or the result is unclear, check the merchant before retrying; a repeated checkout can create a second order. MAX-G keeps an attempted purchase from being repeated within the same shopping session, including after observing or reopening the page. To begin another transaction, first check the merchant's order history, then deliberately select **I checked prior orders and want a new transaction** before opening a new shopping session. The checkbox is never selected automatically. The attempt lock lasts for the running companion process; restarting or resetting MAX-G cannot determine whether a merchant already accepted an order. Always check the merchant’s order history after an uncertain outcome, including after a restart.

You can cancel a pending MAX-G approval before execution. Canceling MAX-G after a merchant has accepted an order does not cancel that order; use the merchant's cancellation process. MAX-G does not autonomously solve CAPTCHAs, bypass sign-in/security steps, enter credit-card fields, or place an order in the background. Auction bids, offers, and recurring purchase or subscription commitments are handed to you for completion directly at the merchant. A supported one-time Buy It Now checkout can use the reviewed order flow.

## Make calls from the Mac

Type an exact command such as **Call +12025550123**, or use **Connectors → Mac & devices → Review call handoff**. Check the exact destination in MAX-G's review. After approval, a phone number opens the Mac's configured `tel:` handler; an email address opens a FaceTime Audio handoff. Complete any confirmation shown by macOS. MAX-G reports that the request was handed to the calling app, not that the call connected. Apple's [phone-link documentation](https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/PhoneLinks/PhoneLinks.html) and [FaceTime-link documentation](https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/FacetimeLinks/FacetimeLinks.html) explain those handoffs.

For ordinary cellular calls relayed through your iPhone:

1. Use an iPhone with an active carrier plan, signed in to the same Apple Account as the Mac.
2. On iPhone, open **Settings → Apps → Phone → Calls on Other Devices**, enable **Allow Calls on Other Devices**, and enable the Mac.
3. On the Mac, open **FaceTime → Settings** and enable **Calls from iPhone**. Sign in to FaceTime with the same Apple Account and enable your phone number.
4. Keep the devices on the same network, with the iPhone on and nearby. Supported carrier Wi-Fi Calling setups can provide additional options.

The dedicated Mac Phone app requires macOS Tahoe 26 or later; an older supported Intel Mac can use the available FaceTime/Continuity route. Follow [Apple's current Mac/iPhone call setup guide](https://support.apple.com/102405) for your installed macOS version. Carrier charges and availability still apply; [Apple's iPhone continuity guide](https://support.apple.com/guide/iphone/iphf90f372f0/ios) explains the network and carrier requirements.

FaceTime Audio needs connectivity and a reachable FaceTime recipient. Availability varies by country, region, and carrier, as described in [Apple's FaceTime troubleshooting guide](https://support.apple.com/102558). This MAX-G version does not answer incoming calls, listen to or speak into calls, negotiate with a restaurant by phone, or verify a call's outcome. A request to order by phone can start the reviewed handoff; you handle the conversation.

## Local operation and verification

WebLLM reasoning remains on the device. Shopping pages, account sign-in, calls, and the merchant's payment processing need their respective services and an internet connection. The browser keeps its session in the companion's separate local profile. The GitHub Pages PWA alone cannot drive the Mac or use the Mac's calling app remotely from an iPhone.

The shopping checks use synthetic merchant pages and isolated browser profiles, with account and native-device adapters replaced by fixtures. They do not place real orders, sign in to personal accounts, or make real calls. Real merchants can add controls, use unsupported payment frames, or require manual interaction; MAX-G must stop and report those limits instead of claiming the order is complete.
