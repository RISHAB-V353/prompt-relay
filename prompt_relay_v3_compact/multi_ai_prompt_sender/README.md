# Prompt Relay v0.3.1 — Firefox extension prototype

Prompt Relay is a local Firefox WebExtension designed for a tiled desktop: it opens a dedicated composer in the bottom-right quadrant, lets you choose ChatGPT, Claude, and Gemini independently, and submits your prompt to the selected sites through your existing signed-in browser tabs.

## What's new in v0.3.1

- Replaced the arcade/neon look with a glassmorphism-inspired, Apple-like interface: translucent layers, soft blur, spacious rounded cards, refined typography, and system light/dark appearance.
- Choose any combination of ChatGPT, Claude, and Gemini. Your selection is saved between openings.
- Add multiple attachments from the file picker, drag files into the composer, or paste an image/file from the clipboard where Firefox exposes it.
- Image attachments show thumbnails; other files show an extension badge. Remove a single file or clear all attachments before sending.
- Attachments are relayed to each selected site's hidden file input where available, and the extension attempts to wait for an enabled Send button before submitting.
- Individual per-site status messages help identify missing tabs or failed uploads/submissions.
- No API keys are used.

### v0.3.1 layout refinements

- Removed the redundant Prompt Relay title and local-extension badge to reclaim vertical space.
- The prompt input starts compact when empty and grows as you type, with a 130 px maximum before scrolling.
- Kept selectable AI destinations, delivery status, file previews, drag-and-drop, clipboard image support, and the original v0.3 glass styling.

## Load or update in Firefox

1. Extract the ZIP to a folder.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and choose this folder's `manifest.json`.
4. Keep ChatGPT (`chatgpt.com`), Claude (`claude.ai`), and Gemini (`gemini.google.com`) open and signed in. After first load/reload, refresh the AI tabs once.
5. Click the extension button. The composer attempts to position itself in the bottom-right quarter of the screen.

When upgrading from v0.2.0, load the v0.3.0 `manifest.json` as the temporary add-on, or remove the old temporary add-on first if Firefox reports a duplicate extension ID. A temporary extension must be loaded again after restarting Firefox unless installed through a suitable signed/distribution path.

## Attachment limits

- Up to 8 files per prompt.
- Maximum 10 MB per file and 20 MB combined.
- The picker accepts files in general; however, each AI website may accept different types and sizes and may change its web interface. The extension uses the page's file input when available, then attempts to attach the files and send. Always verify the attachment chip and final prompt in the target tab, especially the first time you use a particular file type.
- If a site's upload control or DOM has changed, the per-site selectors in `content.js` may need an update. Upload status cannot be guaranteed from the extension alone because the websites do not expose a stable public automation interface.

## Privacy and operation

- Files are read locally by the composer and transferred through Firefox extension messages to the selected tabs. They are not sent to a custom server by this extension.
- When you submit, each selected AI service receives the files and prompt through your signed-in website session, so the site's normal data practices apply.
- Only matching AI tabs already open are targeted. If multiple tabs for one AI are open, the most recently accessed matching tab is selected.

## Project files

- `manifest.json`: extension metadata and site permissions
- `background.js`: open/focus composer, find matching AI tabs, and relay messages/attachments
- `content.js`: fills message composer, attaches files through the page's file input, and clicks Send
- `composer.html`, `composer.css`, `composer.js`: dedicated glass-style prompt window, target selection, file previews, and sending UI
