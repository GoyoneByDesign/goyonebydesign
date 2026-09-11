# Helping MAX-G improve on your tasks

MAX-G can keep your feedback, use lessons you have reviewed, and run repeatable local checks. This makes it easier to discover recurring mistakes and improve the answers you care about. It does not make the model infallible or establish that MAX-G outperforms ChatGPT, Gemini, Claude, or another assistant.

The language model still runs on your device. Feedback and reference notes do **not** train or change its weights. They are small local records that MAX-G can retrieve as context for a later response. Changing the actual model requires explicitly selecting and loading a different supported model; MAX-G does not secretly download a larger one or send inference to a cloud service.

## A useful improvement cycle

1. Ask a focused question or give a concrete task. Include what a good result should look like: the audience, format, language, relevant facts, and any constraints.
2. Review the answer before using it. Under the reply, choose **Helpful** or **Needs work**. Open **Add a correction** to write an optional correction, then select **Save feedback**. A useful correction states what to do differently, rather than only saying “wrong.”
3. Open **Learning → Recent feedback** and choose **Stage correction as a disabled lesson**. Under **Reviewed reference lessons**, read the lesson and choose **Review & enable lesson**. A useful lesson is short and specific: “When I ask for a client email, put the proposed subject before the body,” or “For temperatures, distinguish Celsius from Fahrenheit.” Avoid saving a fallible answer as a universal fact.
4. Keep the useful lesson enabled and repeat a similar task. If the lesson causes unrelated answers to get worse, disable or delete it.
5. Use **Learning → Measured model checks** to compare model behavior on fixed exercises. These isolated checks do not use your lessons. Re-ask your own real task separately to evaluate the lesson's effect.

A positive rating is a local feedback record, not proof that an answer is true. A correction you approve is still subject to the model's small context and its ability to follow instructions. Source-backed factual notes need their own verification.

## Lessons and reference notes

Manage reviewed lessons in **Learning → Reviewed reference lessons**. You can also write a **New reference lesson to review** and choose **Save as disabled lesson**. Read it, then choose **Review & enable lesson**. Use **Disable lesson** to stop using it without deleting the saved copy, or **Delete lesson** to remove it. Clearing the original feedback does not delete a lesson you already staged from it.

Manage general reference notes and public study notes separately in **Memory**. Check the listed source URLs before enabling a study note with **Use this note**. Delete a note when it is no longer useful.

Use **Settings → Memory & data → Use relevant notes and reviewed lessons** to control whether saved context is included in replies. Retrieval selects a small amount of relevant context; it does not load the entire database into every prompt. Keep lessons short and put the important qualification in the same sentence as the advice. A saved lesson may not be selected for an unrelated question, and a long conversation can exceed the available context.

Separate response preferences from facts. “Use a professional tone for client emails” is a preference. “This product costs $20” is a time-sensitive factual claim that should be checked again when used. Do not turn a temporary price, weather forecast, provider policy, or incomplete web excerpt into a permanent rule.

## Repeatable local checks

Open **Learning → Measured model checks**, confirm the displayed current model, then select **Run check**. If that model is not loaded, first choose it in **Settings → General**, save the setting, and use the main **Load local AI** or **Reload model** button. The check runner does not switch models or download one automatically. Use **Stop check** to stop a running suite.

There are eight fixed exercises: integer arithmetic, percentage calculation, metric conversion, exact JSON extraction, a precise output instruction, acknowledging unavailable live weather data, extracting from untrusted text, and one basic Spanish translation. The runner uses isolated prompts without conversation history, reviewed lessons, response preferences, web access, or connector tools. It measures the selected model on these exact criteria, not the effectiveness of your saved lessons or the whole assistant's tool routing.

Run records show the model, check-suite version, time, duration, completed coverage, and each returned answer against its criterion. Open an individual criterion to inspect it. A stopped or failed run retains only fully completed cases; it is not a complete eight-case result. **Clear check history** removes the stored runs.

For a fair comparison:

- Keep the prompts and expected outcomes the same between runs.
- For these isolated checks, compare the selected model while keeping the MAX-G version and criteria the same. Test lessons and response preferences separately by re-asking your own real task.
- Distinguish the first download/load from generation speed. A cached run has a different startup cost.
- Note when the Mac is under other load or a run was stopped. A slow or interrupted result is not a completed quality evaluation.
- Retest the real task that originally failed. A few fixed checks cannot cover all future questions.

These are practical regression checks, not a comprehensive intelligence, safety, or capability benchmark. Passing them does not prove broad superiority over other assistants. A fresh browser profile starts without check history; its run history records the checks you actually choose to execute there.

## Hourly public-document study

In **Learning → Hourly reference learning**, enable **Learn one topic each hour** for bounded reference study, or choose **Run one study now**. MAX-G rotates through public documentation about Google AI, OpenAI, Anthropic, Ollama, Python, and Playwright. It summarizes the search excerpts returned for the current topic. It does not gain access to another assistant's private training data, private conversations, accounts, or internal memory.

New study notes are staged **disabled** for review in **Memory**. Read the note, open its sources, and then turn on **Use this note** if it is accurate and useful. A search excerpt can be stale, incomplete, or out of context; a generated summary can also be wrong. Enabling a note is your decision to make it available as reference data, not a guarantee that its contents are correct.

Automatic study requires all of the following:

- The MAX-G PWA is open, visible, and idle.
- A local model is already loaded.
- A Mac companion with built-in search is paired and running, or a working search-proxy URL is configured in **Settings → Connection**.
- Internet permission is **Allow** and the connection can reach the search service.
- No foreground answer, voice session, queued message, or unfinished composer input is occupying the app.

The PWA does not wake a sleeping Mac or keep running indefinitely after its window closes. iOS and browsers can suspend background apps. Missed intervals are skipped rather than replayed in a burst. Start a normal conversation to take priority over study, or use **Stop** to cancel the active operation.

**Clear learned study notes** removes the study notes and disables the hourly toggle. It does not delete cloud-account files or another AI service's data.

## Choosing a model on your Intel Mac

Start with **Settings → General → Local model → Llama 3.2 · 1B · fast**. Use focused questions and small source-file changes. MAX-G configures a 4,096-token context and conservatively bounds prompt content, so it cannot consider an entire large repository, long document, or unlimited chat history in one reply.

If the complete question cannot fit, MAX-G asks you to split it into shorter questions before sending it to the model. This check accounts for text encoding, so a multilingual question can reach the budget before the character limit. Earlier history and supplied context can still be shortened; the reply discloses that when the engine reports context trimming. For a fuller review, use a shorter question and a focused source excerpt instead of assuming every stored item was read.

The **1B · GPU compatibility** option uses a different numeric format for WebGPU adapters without `shader-f16`; it still uses WebGPU. It is not a CPU inference fallback. If no usable WebGPU adapter is available, the browser edition cannot run its language model. Available system RAM alone does not guarantee that the browser can allocate sufficient GPU memory.

The selectable **3B · more memory** model may do better on some tasks, but this must be checked on your examples. It can load more slowly, use more memory, and generate more slowly on an Intel Mac. Select it yourself, save the setting, then load it. If it is not already cached, the first load downloads that model. Compare the same checks and real tasks before deciding whether the quality gain is worth the cost.

MAX-G lists approximate model memory figures of 879 MB for the fast 1B model, 1,129 MB for the 1B compatibility model, and 2,264 MB for the 3B model, with additional context/runtime/browser overhead. Those figures are estimates, not a promise that a device will load a model successfully. Use **Unload GPU model** to release the model while retaining its cached downloads.

WebLLM uses WebGPU for browser inference and supports a worker to keep computation separate from the interface. Initial model loading requires downloads and can take time; streaming displays tokens as they become available, rather than making reasoning instantaneous. Temperature remains `0.0`, which reduces sampling randomness but does not establish correctness. [WebLLM overview](https://webllm.mlc.ai/docs/), [WebLLM model loading and streaming](https://webllm.mlc.ai/docs/user/basic_usage.html)

## Storage, privacy, and reset

The improvement records are bounded:

| Local record | Maximum retained |
|---|---:|
| Feedback records | 100 |
| Reviewed-learning lessons | 40 |
| Local-check runs | 8 |
| General reference notes, including staged study notes | 60 |
| Study receipts | 24 |

Feedback and run history retain the newest records within their caps. A full manual-lesson collection asks you to delete a lesson before adding another. Study rotates an old study note when reference memory is full; it does not displace a collection filled entirely with your personal notes. Keeping more records does not increase the model's context window or train its weights. Browser storage can also be cleared or evicted; choose **Learning → Export improvement data**, or export a complete personal backup in Settings, before changing browsers, profiles, or devices.

Feedback keeps a bounded question excerpt of up to 1,600 characters, an answer excerpt of up to 4,000 characters, and the correction you choose to save. Treat an exported backup as personal data, especially when it includes work or email content. These records remain on the browser's origin and are not automatically uploaded to an AI company. They are separate from the optional chat-history setting: choosing to save feedback is itself a decision to keep that feedback locally.

Hourly public study sends the current public query through your paired Mac companion to Bing, or through your configured Worker to DuckDuckGo. It does not send saved feedback, lessons, private email, selected file contents, or the whole conversation along with that query. Anything you deliberately put into a public research query is sent as part of that query, so keep private account content out of it. Connected email and cloud files are not automatically absorbed into reference memory.

Web excerpts, files, and notes remain untrusted content. They cannot authorize a connector, change permissions, execute code, or trigger a reset. Email sending, app/device actions, and other external effects continue to use their existing permissions and concrete action review.

Use **Clear saved feedback**, **Delete lesson**, and **Clear check history** when you no longer want those records. **Settings → Memory & data → Reset personal data**, using the exact reset code `1435254`, clears the new improvement records along with the other personal MAX-G data. Typing or saying the exact reset command follows the same personal-reset path. It does not erase the model's pretrained knowledge; downloaded base weights remain until you separately choose **Delete downloaded model cache**.

Clearing learned data is different from deleting online accounts or files. If the Mac companion is paired, the existing reset flow also clears its local authorizations and owned browser state; it does not delete your Gmail, Microsoft, or Dropbox account. See [CONNECTORS.md](CONNECTORS.md) for the device and account boundaries.
