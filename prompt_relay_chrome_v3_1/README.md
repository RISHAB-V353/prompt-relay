# Prompt Relay v0.3.1 — Chromium build

Prompt Relay opens a separate compact composer window, lets you select ChatGPT, Claude, and Gemini independently, and submits prompts and attachments through your existing signed-in browser tabs. This package targets Chromium browsers such as Google Chrome, Brave, and Microsoft Edge.

## Features

- Select any combination of ChatGPT, Claude, and Gemini; selection is saved locally.
- Prompt input starts compact and expands as you type.
- Attach multiple files using the file picker, drag-and-drop, or clipboard paste where supported.
- Image previews, individual removal, and a clear-all option.
- Per-site delivery result display.
- No API keys or Prompt Relay server.

## Install in Chrome (developer/test mode)

1. Extract the ZIP to a folder. Make sure `manifest.json` is at the top level of the extracted folder.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the extracted folder containing `manifest.json`.
5. Open and sign in to `chatgpt.com`, `claude.ai`, and/or `gemini.google.com`.
6. After loading or reloading the extension, refresh the AI tabs once.
7. Click the Prompt Relay toolbar icon to open the composer.

## Brave and Edge

Use the same extracted folder and load it through each browser's extensions page in developer mode. Most Chromium extension APIs are compatible across Chrome, Brave, and Edge, but test the full prompt and attachment flow separately in each browser.

## Attachments and limitations

- Up to 8 files per prompt.
- Maximum 10 MB per file and 20 MB combined.
- Each AI website has its own file type and size limits, and its page interface can change. Confirm that each attachment appears in the destination tab and verify delivery, especially when testing a new file type.
- The extension targets the most recently accessed open tab for each selected AI site.
- It submits through the websites' interfaces; this is not an official API integration. Changes to a website's DOM may require updates to `content.js`.

## Privacy

The composer reads selected files locally and transfers them via extension messaging to the selected AI website tabs. This extension does not transmit prompts or files to a custom Prompt Relay server. When submitted, the selected AI provider receives the prompt and files through the user's signed-in website session; that provider's own data handling terms apply. Target sites are declared in the manifest host permissions.

## Package contents

- `manifest.json`: Chromium Manifest V3 metadata and service worker declaration.
- `background.js`: opens/focuses the composer, finds matching tabs, and relays messages.
- `content.js`: interacts with the AI website's composer and file input.
- `composer.html`, `composer.css`, `composer.js`: prompt composer UI and behavior.
