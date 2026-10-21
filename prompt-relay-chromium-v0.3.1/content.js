(() => {
  if (window.__multiAiPromptSenderReady) return;
  window.__multiAiPromptSenderReady = true;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function visible(element) {
    if (!element || !element.isConnected) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" &&
      Number(style.opacity || 1) !== 0 && rect.width > 0 && rect.height > 0;
  }

  function getEditor() {
    const host = location.hostname;
    let preferred = [];

    if (host === "chatgpt.com") {
      preferred = [
        "#prompt-textarea",
        "textarea[data-testid='prompt-textarea']",
        "[contenteditable='true'][data-testid*='prompt']",
        "[contenteditable='true'][data-placeholder]"
      ];
    } else if (host === "claude.ai") {
      preferred = [
        ".ProseMirror[contenteditable='true']",
        "[contenteditable='true'][data-placeholder]",
        "[contenteditable='true'][role='textbox']"
      ];
    } else if (host === "gemini.google.com") {
      preferred = [
        "rich-textarea [contenteditable='true']",
        "rich-textarea textarea",
        "[contenteditable='true'][aria-label]"
      ];
    }

    for (const selector of preferred) {
      const found = [...document.querySelectorAll(selector)].filter(visible);
      if (found.length) {
        found.sort((a, b) => b.getBoundingClientRect().bottom - a.getBoundingClientRect().bottom);
        return found[0];
      }
    }

    const candidates = [...document.querySelectorAll("textarea, [contenteditable='true'], [role='textbox']")]
      .filter((element) => {
        if (!visible(element) || element.disabled || element.readOnly) return false;
        return element.getBoundingClientRect().bottom > window.innerHeight * 0.45;
      })
      .sort((a, b) => b.getBoundingClientRect().bottom - a.getBoundingClientRect().bottom);

    return candidates[0] || null;
  }

  function setEditorText(editor, text) {
    editor.focus();

    if (editor instanceof HTMLTextAreaElement || editor instanceof HTMLInputElement) {
      const prototype = editor instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
      if (setter) setter.call(editor, text);
      else editor.value = text;
      editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
      editor.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    try {
      document.execCommand("selectAll", false, null);
      document.execCommand("insertText", false, text);
    } catch {
      // Use a DOM fallback below for editors that do not support execCommand.
    }

    const currentText = (editor.innerText || editor.textContent || "").replace(/\u00a0/g, " ").trim();
    if (currentText !== text.trim()) {
      editor.replaceChildren();
      const lines = text.split("\n");
      lines.forEach((line, index) => {
        if (index) editor.appendChild(document.createElement("br"));
        editor.appendChild(document.createTextNode(line));
      });
      editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
    }
    editor.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function getSendButton(editor) {
    const host = location.hostname;
    let selectors = [];

    if (host === "chatgpt.com") {
      selectors = [
        "button[data-testid='send-button']",
        "button[aria-label*='Send prompt' i]",
        "button[aria-label*='Send message' i]"
      ];
    } else if (host === "claude.ai") {
      selectors = [
        "button[data-testid='send-button']",
        "button[aria-label*='Send message' i]",
        "button[aria-label='Send' i]"
      ];
    } else if (host === "gemini.google.com") {
      selectors = [
        "button[aria-label='Send message' i]",
        "button[aria-label*='Send' i]",
        "button.send-button"
      ];
    }

    for (const selector of selectors) {
      const buttons = [...document.querySelectorAll(selector)].filter((button) =>
        visible(button) && !button.disabled && button.getAttribute("aria-disabled") !== "true"
      );
      if (buttons.length) {
        buttons.sort((a, b) => b.getBoundingClientRect().bottom - a.getBoundingClientRect().bottom);
        return buttons[0];
      }
    }

    const container = editor?.closest("form") || editor?.closest("[data-testid*='composer']") || editor?.parentElement?.parentElement?.parentElement;
    if (container) {
      const buttons = [...container.querySelectorAll("button")].filter((button) => {
        if (!visible(button) || button.disabled || button.getAttribute("aria-disabled") === "true") return false;
        const label = `${button.getAttribute("aria-label") || ""} ${button.getAttribute("data-testid") || ""} ${button.innerText || ""}`;
        return /send|submit/i.test(label);
      });
      if (buttons.length) return buttons[buttons.length - 1];
    }
    return null;
  }

  function fileMatchesAccept(file, accept) {
    const rules = String(accept || "").split(",").map((part) => part.trim().toLowerCase()).filter(Boolean);
    if (!rules.length || rules.includes("*/*") || rules.includes("*")) return true;
    const type = String(file.type || "").toLowerCase();
    const name = String(file.name || "").toLowerCase();
    return rules.some((rule) => {
      if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
      if (rule.startsWith(".")) return name.endsWith(rule);
      if (rule.includes("/")) return type === rule;
      return false;
    });
  }

  function findFileInput(attachments) {
    const inputs = [...document.querySelectorAll("input[type='file']")].filter((input) => !input.disabled);
    if (!inputs.length) return { input: null, unsupported: [] };

    const candidates = inputs.map((input) => {
      const accept = input.getAttribute("accept") || "";
      const supported = attachments.filter((attachment) => fileMatchesAccept(attachment, accept));
      const score = (supported.length === attachments.length ? 1000 : 0) + supported.length * 30 + (input.multiple ? 10 : 0) + (accept ? 1 : 0);
      return { input, supported, score, accept };
    }).sort((a, b) => b.score - a.score);

    const best = candidates[0];
    if (best.supported.length === attachments.length) return { input: best.input, unsupported: [] };
    // A site can expose generic and type-specific pickers. Prefer a generic picker when present.
    const generic = candidates.find((candidate) => !candidate.accept);
    if (generic) return { input: generic.input, unsupported: [] };
    return {
      input: null,
      unsupported: attachments.filter((attachment) => !fileMatchesAccept(attachment, best.accept)).map((file) => file.name)
    };
  }

  function attachmentButtons() {
    const host = location.hostname;
    const selectors = host === "chatgpt.com"
      ? ["button[aria-label*='attach files' i]", "button[aria-label*='add files' i]", "button[aria-label*='attach files and more' i]"]
      : host === "claude.ai"
        ? ["button[aria-label*='add content' i]", "button[aria-label*='attach' i]", "button[aria-label*='upload' i]"]
        : ["button[aria-label*='add files' i]", "button[aria-label*='upload' i]", "button[aria-label*='attach' i]"];

    for (const selector of selectors) {
      const found = [...document.querySelectorAll(selector)].filter(visible);
      if (found.length) return found[found.length - 1];
    }
    return null;
  }

  async function revealFileInput(attachments) {
    let found = findFileInput(attachments);
    if (found.input || found.unsupported.length) return found;
    const button = attachmentButtons();
    if (button) {
      button.click();
      await sleep(350);
      // Some sites create their file input only after the attach menu opens.
      const menuItems = [...document.querySelectorAll("button,[role='menuitem']")].filter((element) => {
        if (!visible(element)) return false;
        const label = `${element.getAttribute("aria-label") || ""} ${element.innerText || ""}`;
        return /add files|upload file|attach file|from computer/i.test(label);
      });
      if (menuItems.length) {
        menuItems[menuItems.length - 1].click();
        await sleep(350);
      }
      found = findFileInput(attachments);
    }
    return found;
  }

  function decodeBase64(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let offset = 0; offset < binary.length; offset += 1) bytes[offset] = binary.charCodeAt(offset);
    return bytes;
  }

  async function attachFiles(attachments) {
    if (!Array.isArray(attachments) || attachments.length === 0) return { ok: true, count: 0 };

    const decoded = [];
    for (const attachment of attachments) {
      if (!attachment || typeof attachment.name !== "string" || typeof attachment.data !== "string") {
        return { ok: false, error: "One of the attachments was incomplete. Remove it and try again." };
      }
      try {
        const bytes = decodeBase64(attachment.data);
        decoded.push(new File([bytes], attachment.name, {
          type: attachment.type || "application/octet-stream",
          lastModified: Number(attachment.lastModified) || Date.now()
        }));
      } catch {
        return { ok: false, error: `Couldn't prepare ${attachment.name} for upload.` };
      }
    }

    const found = await revealFileInput(decoded);
    if (!found.input) {
      if (found.unsupported.length) {
        return { ok: false, error: `This page's uploader doesn't advertise support for: ${found.unsupported.join(", ")}. Nothing was sent.` };
      }
      return { ok: false, error: "Couldn't locate this site's file picker. Open the site's attachment menu once, refresh the tab, and retry." };
    }

    try {
      const transfer = new DataTransfer();
      for (const file of decoded) transfer.items.add(file);
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "files")?.set;
      if (setter) setter.call(found.input, transfer.files);
      else found.input.files = transfer.files;
      found.input.dispatchEvent(new Event("input", { bubbles: true }));
      found.input.dispatchEvent(new Event("change", { bubbles: true }));
      await sleep(1000);
      return { ok: true, count: decoded.length };
    } catch (error) {
      return { ok: false, error: `The file picker rejected the attachment: ${error?.message || "unknown error"}.` };
    }
  }

  async function waitForSendButton(editor, timeout) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const button = getSendButton(editor);
      if (button) return button;
      await sleep(350);
    }
    return null;
  }

  async function sendPrompt(prompt, attachments = []) {
    const safePrompt = String(prompt || "");
    const files = Array.isArray(attachments) ? attachments : [];
    if (!safePrompt.trim() && files.length === 0) return { ok: false, error: "Add a message or at least one attachment." };

    let editor = null;
    for (let attempt = 0; attempt < 12; attempt++) {
      editor = getEditor();
      if (editor) break;
      await sleep(250);
    }
    if (!editor) {
      return { ok: false, error: "Message box not found. Make sure the chat page is fully loaded, then refresh the tab." };
    }

    let fileCount = 0;
    if (files.length) {
      const attachmentResult = await attachFiles(files);
      if (!attachmentResult.ok) return { ok: false, status: "upload_error", error: attachmentResult.error };
      fileCount = attachmentResult.count;
    }

    // Upload interactions can cause the site to re-render its composer, so reacquire it.
    let activeEditor = getEditor() || editor;
    if (safePrompt.trim()) setEditorText(activeEditor, safePrompt);
    // Let the site's framework react to the file input and complete initial upload work.
    await sleep(files.length ? 850 : 250);
    activeEditor = getEditor() || activeEditor;
    const sendButton = await waitForSendButton(activeEditor, files.length ? 45000 : 5000);
    if (!sendButton) {
      return {
        ok: false,
        status: files.length ? "upload_pending" : "send_error",
        error: files.length
          ? "Files were selected, but the site never made its Send button available. Check the upload in that tab and retry."
          : "Couldn't find an enabled Send button. Check the page and try again."
      };
    }

    sendButton.click();
    return { ok: true, detail: files.length ? `Prompt and ${fileCount} attachment(s) submitted.` : "Prompt submitted." };
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.type !== "SEND_PROMPT") return false;
    sendPrompt(String(message.prompt || ""), Array.isArray(message.attachments) ? message.attachments : [])
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ ok: false, status: "error", error: error?.message || "Couldn't submit to this site." }));
    return true;
  });
})();
