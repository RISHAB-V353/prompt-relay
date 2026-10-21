# Prompt Relay

**One prompt. Your choice of AI.**

Prompt Relay is a compact browser extension that lets you send a prompt to any combination of **ChatGPT, Claude, and Gemini** from one composer. It is designed for people who keep their AI tabs open side by side and want to avoid copying and pasting the same prompt into each one.

It uses your existing logged-in browser sessions and does not require AI API keys.

## Features

- **Choose your destinations:** turn ChatGPT, Claude, and Gemini on or off independently for each prompt.
- **One compact composer:** write once and submit to the selected AI tabs.
- **File attachments:** attach multiple files, drag and drop files, and paste images where clipboard support is available.
- **Attachment previews:** preview images and remove individual files before sending.
- **Per-site status:** check the submission status reported for each selected website.
- **Designed for tiled workspaces:** a separate compact window keeps the prompt composer available beside your AI tabs.
- **No API keys:** Prompt Relay interacts with the AI websites through your existing browser sessions.

## Downloads

Open the repository's **Releases** section and download the ZIP for your browser:

| Browser | Download | Package |
| --- | --- | --- |
| Mozilla Firefox | `prompt-relay-firefox-v0.3.1.zip` | Firefox build |
| Google Chrome | `prompt-relay-chromium-v0.3.1.zip` | Chromium build |
| Brave | `prompt-relay-chromium-v0.3.1.zip` | Chromium build |
| Microsoft Edge | `prompt-relay-chromium-v0.3.1.zip` | Chromium build |

The Firefox and Chromium builds have different manifests. Use the appropriate ZIP for your browser. The Chromium build is intended for Chrome, Brave, and Edge, but it should be tested in each browser because browser settings and website interfaces can differ.

## Installation

### Google Chrome

1. Download `prompt-relay-chromium-v0.3.1.zip` from the release assets.
2. Extract the ZIP to a permanent folder. Do not move or delete this folder after installation.
3. In Chrome, open `chrome://extensions`.
4. Turn on **Developer mode**.
5. Click **Load unpacked**.
6. Select the extracted folder that contains `manifest.json` directly.
7. Optional: click the Extensions puzzle-piece icon and pin Prompt Relay for easy access.
8. Open ChatGPT, Claude, and/or Gemini and sign in. Refresh any AI tabs that were already open before you installed or reloaded the extension.
9. Click the Prompt Relay toolbar icon to open the composer.

### Brave

1. Download and extract `prompt-relay-chromium-v0.3.1.zip` to a permanent folder.
2. Open `brave://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the extracted folder containing `manifest.json` directly.
5. Open and sign in to the AI websites you want to use, then refresh any tabs that were already open.
6. Open Prompt Relay from the toolbar.

### Microsoft Edge

1. Download and extract `prompt-relay-chromium-v0.3.1.zip` to a permanent folder.
2. Open `edge://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the extracted folder containing `manifest.json` directly.
5. Open and sign in to the AI websites you want to use, then refresh any tabs that were already open.
6. Open Prompt Relay from the toolbar.

### Mozilla Firefox

> **Note:** The supplied Firefox ZIP is loaded as a temporary add-on. Firefox removes temporary add-ons when the browser restarts, so you must load it again after restarting Firefox. A persistent public installation requires a properly signed Firefox add-on.

1. Download `prompt-relay-firefox-v0.3.1.zip` from the release assets.
2. Extract the ZIP. Open the extracted folder, then open the inner `multi_ai_prompt_sender` folder.
3. Confirm that `manifest.json` is inside that inner folder.
4. In Firefox, open `about:debugging#/runtime/this-firefox`.
5. Click **Load Temporary Add-on…**.
6. Select the `manifest.json` file inside `multi_ai_prompt_sender`.
7. Open ChatGPT, Claude, and/or Gemini and sign in. Refresh any AI tabs that were already open before you installed or reloaded the extension.
8. Click the Prompt Relay toolbar icon to open the composer.

## Using Prompt Relay

1. Keep the AI website tabs you want to use open and signed in.
2. Open the Prompt Relay composer from the browser toolbar.
3. Toggle ChatGPT, Claude, and/or Gemini on or off.
4. Type your prompt. Add attachments if needed.
5. Submit the prompt.
6. Check the status for each selected AI and confirm that the prompt and attachments appear in the destination tab.

## Attachments and limits

Prompt Relay currently allows up to **8 files per prompt**, with a **10 MB limit per file** and a **20 MB combined limit**. These are Prompt Relay limits, not the AI providers' limits.

Each provider may accept different file formats and sizes. Uploads can also fail when an AI website changes its interface or when an account does not support a particular file type. Always confirm that each attachment appears on the destination website before assuming it was accepted.

## Compatibility and known limitations

- Prompt Relay interacts with the websites' user interfaces; it does not use a stable public automation API.
- Supported website domains are `chatgpt.com`, `claude.ai`, and `gemini.google.com`.
- The relevant AI tab must be open and signed in. Refresh tabs after installing or reloading the extension.
- Website redesigns, upload-flow changes, account restrictions, or browser privacy features may require future fixes.
- A status from the extension indicates the submission attempt it can observe; it cannot guarantee that the AI has finished processing the request.
- Firefox temporary add-ons must be loaded again after restarting Firefox.

## Privacy

Prompt Relay has no Prompt Relay server in this project. The extension uses the prompt and files you select and relays them to the AI websites you choose through your browser session. Those providers receive the submitted content and process it under their own privacy policies, terms, and account settings.

Do not send confidential, personal, or sensitive files unless you are comfortable sharing them with the selected AI provider. Review each provider's policies before use.

## Troubleshooting

**The extension does not appear in the toolbar**

- Check the browser's extensions page and confirm that Prompt Relay is enabled.
- Pin the extension from the toolbar's Extensions menu if needed.
- In Firefox, remember that a temporary add-on has to be loaded again after a browser restart.

**Prompts are not sent**

- Make sure the chosen AI tab is open and signed in.
- Refresh the AI tab after installing or reloading Prompt Relay.
- Confirm the correct AI is enabled in the composer.
- Check the status shown for each selected AI. A website interface update may have changed the input or Send button.

**An attachment does not appear**

- Check the file's type and size against the destination AI's limits.
- Try sending to one AI at a time to identify which site failed.
- Verify the attachment is visible on the destination website before assuming the upload succeeded.

**The browser cannot load the extension**

- For Chrome, Brave, and Edge, choose the extracted folder that contains `manifest.json` directly.
- For Firefox, choose the `manifest.json` inside the inner `multi_ai_prompt_sender` folder.
- Keep the extracted Chromium folder in the same location after installation.

## Repository structure

```text
prompt-relay/
├── README.md
├── firefox/              # Firefox extension source
├── chromium/             # Chrome, Brave, and Edge extension source
├── docs/                 # Release and publishing notes
└── release-assets/       # ZIP packages for releases, if included in this checkout
```

## Version

This README describes **Prompt Relay v0.3.1**.

## License

No license is currently included. Unless a license is added, do not assume that the code is licensed for reuse, modification, or redistribution.
