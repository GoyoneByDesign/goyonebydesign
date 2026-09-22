# MAX-G Cloudflare AI — free connection

MAX-G 1.12.3 offers **Cloudflare AI** in **Settings → Connection → Conversation engine**. Its fixed model is Qwen 3.8 27B (`@cf/qwen/qwen3.8-27b`), hosted by Cloudflare. No ChatGPT, Gemini or Claude API is used for this mode. Ask Gemini remains a separate, optional action.

## Start a conversation

- **Installed Mac:** the owner’s provisioned access token is kept in macOS Keychain. Open MAX-G, select Cloudflare AI and send a message. No local model download is needed for cloud replies.
- **Website, iPhone or iPad:** select Cloudflare AI. In Connection, import your private MAX-G support `.key` file, or paste its single line and choose **Use for this session**. This is the MAX-G access token, not a Google or Cloudflare API key. The browser forgets it on reload or close. Never upload it to a public website or repository.
- **Check Cloudflare AI setup** checks configuration without spending an inference request. Send a question to verify actual model access.
- Try **“Explain why the sky is blue in three sentences.”** Then ask **“Explain it to a child.”** The second message should use the context of the current cloud conversation.

Cloudflare mode sends your new messages, recent cloud-session conversation and relevant public source excerpts to Cloudflare. Stored profile details, saved memories, restored old chats and attachments are excluded. Select **Local AI** to discuss files or use local memories. Cloudflare AI requires an internet connection; local AI requires a compatible device and installed model. Voice and weather remain separate features.

## Free plan and limits

The account’s Cloudflare dashboard was verified as **Workers Free ($0)** on September 21, 2026. This release does not upgrade billing, buy credits or configure an AI Gateway. Cloudflare provides **10,000 Neurons per day**, shared across account AI requests and resetting at **00:00 UTC**. The free plan stops requests at the limit. This allowance is not a fixed number of messages.

The Worker requires an owner-set `CLOUDFLARE_AI_FREE_TIER_CONFIRMED=true` flag. This is a setup attestation, not an ongoing billing monitor. If the account owner later changes the Cloudflare plan, revisit this configuration first. MAX-G will not change billing or retry through another provider automatically. Quota and connection failures give an explanation and the option to choose Local AI.

## Deployment configuration

The existing `max-g-search` Worker provides `/ai/health` and `/ai`, alongside its existing search, news and optional Gemini routes. It uses:

- Workers AI binding named `AI`.
- `CLOUDFLARE_AI_FREE_TIER_CONFIRMED=true`, after checking Workers Free.
- Existing encrypted `MAXG_SUPPORT_TOKEN` and `SEARCH_RATE_LIMIT` binding.
- Fixed Qwen 3.8 27B model, bounded context and answer length, temperature 0, streaming visible text, request cancellation and a deadline.

Existing Worker secrets are preserved during deployment. No credential belongs in GitHub Pages files. The browser uses a session token; the Mac proxy authenticates paired local requests and forwards its Keychain token only to MAX-G’s fixed HTTPS Worker. A public website address is not authentication.

Larger models and more context can improve answers, but they do not guarantee accuracy or parity with other assistants. Check consequential answers and original sources.

Sources: [Cloudflare Qwen 3.8 27B](https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/), [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/), [Workers bindings](https://developers.cloudflare.com/workers-ai/configuration/bindings/).
