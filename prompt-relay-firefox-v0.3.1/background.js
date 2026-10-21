const AI_SITES = {
  ChatGPT: { host: "chatgpt.com", url: "https://chatgpt.com/" },
  Claude: { host: "claude.ai", url: "https://claude.ai/new" },
  Gemini: { host: "gemini.google.com", url: "https://gemini.google.com/app" }
};

const MAX_FILES = 8;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE = 20 * 1024 * 1024;

async function getMatchingTabs() {
  const tabs = await browser.tabs.query({});
  const result = {};
  for (const [name, site] of Object.entries(AI_SITES)) {
    const matches = tabs
      .filter((tab) => {
        if (!tab.url) return false;
        try { return new URL(tab.url).hostname === site.host; } catch { return false; }
      })
      .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
    result[name] = matches[0] || null;
  }
  return result;
}

async function openComposer() {
  const saved = await browser.storage.local.get("composerWindowId");
  if (saved.composerWindowId !== undefined) {
    try {
      await browser.windows.update(saved.composerWindowId, { focused: true });
      return;
    } catch {
      await browser.storage.local.remove("composerWindowId");
    }
  }

  const created = await browser.windows.create({
    url: browser.runtime.getURL("composer.html"),
    type: "popup",
    width: 800,
    height: 560,
    focused: true
  });
  await browser.storage.local.set({ composerWindowId: created.id });
}

browser.action.onClicked.addListener(() => {
  openComposer().catch((error) => console.error("Could not open composer:", error));
});

browser.windows.onRemoved.addListener((windowId) => {
  browser.storage.local.get("composerWindowId").then((saved) => {
    if (saved.composerWindowId === windowId) return browser.storage.local.remove("composerWindowId");
  }).catch(() => {});
});

function validateAttachments(attachments) {
  if (!Array.isArray(attachments)) return { ok: false, error: "Attachment data was invalid." };
  if (attachments.length > MAX_FILES) return { ok: false, error: `Attach no more than ${MAX_FILES} files at once.` };
  let total = 0;
  for (const file of attachments) {
    if (!file || typeof file.name !== "string" || typeof file.data !== "string") {
      return { ok: false, error: "One of the attachments was incomplete." };
    }
    const size = Number(file.size);
    if (!Number.isFinite(size) || size < 0 || size > MAX_FILE_SIZE) {
      return { ok: false, error: `${file.name} exceeds the 10 MB per-file limit.` };
    }
    // Base64 payloads are checked against the declared size as a basic corruption guard.
    if (file.data.length > Math.ceil(MAX_FILE_SIZE * 4 / 3) + 16) {
      return { ok: false, error: `${file.name} is too large to transfer.` };
    }
    total += size;
  }
  if (total > MAX_TOTAL_SIZE) return { ok: false, error: "Attachments have a combined 20 MB limit." };
  return { ok: true };
}

browser.runtime.onMessage.addListener(async (message) => {
  if (!message || typeof message.type !== "string") return undefined;

  if (message.type === "POSITION_COMPOSER") {
    const width = Math.max(420, Math.floor(message.availWidth / 2));
    const height = Math.max(360, Math.floor(message.availHeight / 2));
    const left = Number(message.availLeft || 0) + (message.availWidth - width);
    const top = Number(message.availTop || 0) + (message.availHeight - height);
    try {
      await browser.windows.update(message.windowId, {
        left: Math.max(0, Math.floor(left)),
        top: Math.max(0, Math.floor(top)),
        width,
        height
      });
    } catch (error) {
      console.warn("Could not auto-position composer:", error);
    }
    return { ok: true };
  }

  if (message.type === "GET_TARGETS") {
    const matching = await getMatchingTabs();
    return Object.fromEntries(Object.entries(matching).map(([name, tab]) => [name, Boolean(tab)]));
  }

  if (message.type === "SEND_TO_SELECTED" || message.type === "SEND_TO_ALL") {
    const prompt = typeof message.prompt === "string" ? message.prompt.trim() : "";
    const attachments = Array.isArray(message.attachments) ? message.attachments : [];
    if (!prompt && attachments.length === 0) return { results: [], error: "Write a prompt or attach a file first." };

    const validAttachments = validateAttachments(attachments);
    if (!validAttachments.ok) return { results: [], error: validAttachments.error };

    const selectedNames = message.type === "SEND_TO_ALL"
      ? Object.keys(AI_SITES)
      : [...new Set(Array.isArray(message.targets) ? message.targets.filter((name) => Object.prototype.hasOwnProperty.call(AI_SITES, name)) : [])];

    if (selectedNames.length === 0) return { results: [], error: "Select at least one AI." };

    const matching = await getMatchingTabs();
    const results = await Promise.all(selectedNames.map(async (name) => {
      const tab = matching[name];
      if (!tab) return { name, ok: false, status: "missing", detail: "Open this AI website in Firefox." };

      try {
        let response;
        const payload = { type: "SEND_PROMPT", prompt, attachments };
        try {
          response = await browser.tabs.sendMessage(tab.id, payload);
        } catch {
          // Tabs opened before extension loading may need one on-demand injection.
          await browser.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
          response = await browser.tabs.sendMessage(tab.id, payload);
        }

        if (response?.ok) return { name, ok: true, status: "sent", detail: response.detail || "Prompt submitted." };
        return {
          name,
          ok: false,
          status: response?.status || "error",
          detail: response?.error || "Couldn't submit to this site. Refresh the tab and try again."
        };
      } catch (error) {
        return { name, ok: false, status: "error", detail: error?.message || "Couldn't reach this tab. Refresh it and try again." };
      }
    }));

    return { results };
  }

  return undefined;
});
