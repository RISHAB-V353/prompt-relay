const form = document.getElementById("composer");
const promptInput = document.getElementById("prompt");
const sendButton = document.getElementById("send-button");
const sendLabel = document.getElementById("send-label");
const emptyState = document.getElementById("empty-state");
const lastSend = document.getElementById("last-send");
const promptPreview = document.getElementById("prompt-preview");
const sendTime = document.getElementById("send-time");
const resultDetails = document.getElementById("result-details");
const notice = document.getElementById("notice");
const noticeText = document.getElementById("notice-text");
const selectionCount = document.getElementById("selection-count");
const filePicker = document.getElementById("file-picker");
const attachButton = document.getElementById("attach-button");
const clearFilesButton = document.getElementById("clear-files");
const attachmentArea = document.getElementById("attachment-area");
const attachmentCount = document.getElementById("attachment-count");
const attachmentList = document.getElementById("attachment-list");
const fileHint = document.getElementById("file-hint");
const dropOverlay = document.getElementById("drop-overlay");
const names = ["ChatGPT", "Claude", "Gemini"];
const MAX_FILES = 8;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE = 20 * 1024 * 1024;
let selectedTargets = new Set(names);
let attachments = [];
let sending = false;
let dragDepth = 0;

function getTargetButton(name) {
  return document.querySelector(`[data-target="${name}"]`);
}

function setNotice(text, kind = "") {
  noticeText.textContent = text;
  notice.classList.remove("success", "warning", "error");
  if (kind) notice.classList.add(kind);
}

function setTargetStatus(name, state, label) {
  const target = getTargetButton(name);
  if (!target) return;
  target.classList.remove("ready", "sent", "error", "missing", "sending");
  if (state) target.classList.add(state);
  const status = target.querySelector(".target-status");
  if (status) status.textContent = label;
}

function updateSelectionUI() {
  for (const name of names) {
    const target = getTargetButton(name);
    if (!target) continue;
    const selected = selectedTargets.has(name);
    target.classList.toggle("selected", selected);
    target.setAttribute("aria-pressed", String(selected));
  }
  const count = selectedTargets.size;
  selectionCount.textContent = `${count} selected`;
  sendLabel.textContent = count === 0 ? "Select an AI" : `Send to ${count}`;
  updateSendButton();
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileBadge(file) {
  if (file.type.startsWith("image/")) return "IMG";
  const ext = file.name.includes(".") ? file.name.split(".").pop().toUpperCase().slice(0, 5) : "FILE";
  return ext || "FILE";
}

function renderAttachments() {
  attachmentList.replaceChildren();
  attachmentArea.classList.toggle("hidden", attachments.length === 0);
  attachmentCount.textContent = `${attachments.length} attachment${attachments.length === 1 ? "" : "s"} · ${formatBytes(attachments.reduce((sum, item) => sum + item.file.size, 0))}`;
  fileHint.textContent = attachments.length ? `${attachments.length}/${MAX_FILES} files` : "Images, PDFs, documents";

  for (const item of attachments) {
    const chip = document.createElement("div");
    chip.className = "attachment-chip";
    const preview = document.createElement("div");
    preview.className = "file-preview";
    if (item.previewUrl) {
      const img = document.createElement("img");
      img.src = item.previewUrl;
      img.alt = "";
      preview.appendChild(img);
    } else {
      preview.textContent = fileBadge(item.file);
    }

    const details = document.createElement("div");
    details.className = "file-details";
    const name = document.createElement("div");
    name.className = "file-name";
    name.title = item.file.name;
    name.textContent = item.file.name;
    const size = document.createElement("div");
    size.className = "file-size";
    size.textContent = formatBytes(item.file.size);
    details.append(name, size);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-file";
    remove.setAttribute("aria-label", `Remove ${item.file.name}`);
    remove.title = "Remove attachment";
    remove.textContent = "×";
    remove.addEventListener("click", () => removeAttachment(item.id));
    chip.append(preview, details, remove);
    attachmentList.appendChild(chip);
  }
  updateSendButton();
}

function resizePrompt() {
  // Keep the empty composer compact, then grow naturally as the user types.
  promptInput.style.height = "auto";
  const minHeight = promptInput.value.length ? 38 : 34;
  const nextHeight = Math.min(Math.max(promptInput.scrollHeight, minHeight), 130);
  promptInput.style.height = `${nextHeight}px`;
  promptInput.style.overflowY = promptInput.scrollHeight > 130 ? "auto" : "hidden";
}

function updateSendButton() {
  sendButton.disabled = sending || selectedTargets.size === 0 || (!promptInput.value.trim() && attachments.length === 0);
  if (!sending) sendLabel.textContent = selectedTargets.size === 0 ? "Select an AI" : `Send to ${selectedTargets.size}`;
}

function removeAttachment(id) {
  const item = attachments.find((entry) => entry.id === id);
  if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
  attachments = attachments.filter((entry) => entry.id !== id);
  renderAttachments();
  setNotice(attachments.length ? `${attachments.length} file${attachments.length === 1 ? "" : "s"} attached.` : "Attachments removed.");
}

function clearAttachments() {
  for (const item of attachments) if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  attachments = [];
  filePicker.value = "";
  renderAttachments();
}

function addFiles(fileList) {
  const incoming = [...fileList];
  if (!incoming.length) return;
  const accepted = [];
  const errors = [];
  let totalSize = attachments.reduce((sum, item) => sum + item.file.size, 0);
  let count = attachments.length;

  for (const file of incoming) {
    if (count >= MAX_FILES) {
      errors.push(`Up to ${MAX_FILES} files can be attached.`);
      break;
    }
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name} is over the 10 MB per-file limit.`);
      continue;
    }
    if (totalSize + file.size > MAX_TOTAL_SIZE) {
      errors.push("Attachments have a combined 20 MB limit.");
      continue;
    }
    // Avoid accidentally attaching the exact same name/size/last-modified file twice.
    const duplicate = attachments.some((item) => item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified);
    if (duplicate) continue;
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    accepted.push({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, file, previewUrl });
    totalSize += file.size;
    count++;
  }

  attachments.push(...accepted);
  renderAttachments();
  if (errors.length) setNotice(errors.join(" "), "warning");
  else if (accepted.length) setNotice(`${accepted.length} file${accepted.length === 1 ? "" : "s"} added. File support depends on each AI website.`, "success");
  else setNotice("Those files are already attached.");
}

async function loadSelection() {
  try {
    const saved = await chrome.storage.local.get("selectedTargets");
    if (Array.isArray(saved.selectedTargets)) {
      selectedTargets = new Set(saved.selectedTargets.filter((name) => names.includes(name)));
    }
  } catch {
    selectedTargets = new Set(names);
  }
  updateSelectionUI();
}

async function persistSelection() {
  try {
    await chrome.storage.local.set({ selectedTargets: [...selectedTargets] });
  } catch (error) {
    console.warn("Couldn't save AI selection:", error);
  }
}

document.querySelectorAll(".target[data-target]").forEach((target) => {
  target.addEventListener("click", async () => {
    if (sending) return;
    const name = target.dataset.target;
    if (!names.includes(name)) return;
    if (selectedTargets.has(name)) selectedTargets.delete(name);
    else selectedTargets.add(name);
    updateSelectionUI();
    await persistSelection();
    setNotice(selectedTargets.size ? `${selectedTargets.size} AI${selectedTargets.size === 1 ? "" : "s"} selected.` : "Choose at least one AI to send a prompt.", selectedTargets.size ? "success" : "warning");
  });
});

async function refreshTargets() {
  try {
    const targets = await chrome.runtime.sendMessage({ type: "GET_TARGETS" });
    for (const name of names) {
      setTargetStatus(name, targets?.[name] ? "ready" : "missing", targets?.[name] ? "Tab available" : "No open tab");
    }
  } catch {
    for (const name of names) setTargetStatus(name, "missing", "Refresh AI tab");
  }
}

function showResults(prompt, results, selectedNames, fileCount) {
  emptyState.classList.add("hidden");
  lastSend.classList.remove("hidden");
  const summary = prompt.trim() || (fileCount ? `Sent ${fileCount} attachment${fileCount === 1 ? "" : "s"}` : "Attachment delivery");
  promptPreview.textContent = summary.length > 400 ? `${summary.slice(0, 400)}…` : summary;
  sendTime.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  resultDetails.replaceChildren();

  for (const name of names) {
    const result = results.find((item) => item.name === name);
    const isSelected = selectedNames.includes(name);
    const line = document.createElement("div");
    line.className = `result-line ${!isSelected ? "skipped" : result?.ok ? "ok" : "bad"}`;
    const title = document.createElement("strong");
    title.textContent = !isSelected ? name : `${result?.ok ? "✓" : "!"} ${name}`;
    const detail = document.createElement("span");
    detail.textContent = !isSelected
      ? "Not selected"
      : result?.ok
        ? (fileCount ? `Prompt + ${fileCount} file${fileCount === 1 ? "" : "s"} submitted` : "Prompt submitted")
        : (result?.status === "missing" ? "Tab not open" : (result?.detail || "Not sent"));
    line.append(title, detail);
    resultDetails.appendChild(line);

    if (isSelected) {
      setTargetStatus(name, result?.ok ? "sent" : result?.status === "missing" ? "missing" : "error", result?.ok ? "Sent successfully" : result?.status === "missing" ? "No open tab" : "Needs attention");
    }
  }
}

async function positionWindow() {
  try {
    const current = await chrome.windows.getCurrent();
    await chrome.runtime.sendMessage({
      type: "POSITION_COMPOSER",
      windowId: current.id,
      availLeft: Number.isFinite(screen.availLeft) ? screen.availLeft : 0,
      availTop: Number.isFinite(screen.availTop) ? screen.availTop : 0,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight
    });
  } catch {
    // The composer still works if the desktop does not allow automatic positioning.
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Couldn't read ${file.name}.`));
    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      if (comma < 0) reject(new Error(`Couldn't encode ${file.name}.`));
      else resolve(result.slice(comma + 1));
    };
    reader.readAsDataURL(file);
  });
}

async function encodeAttachments() {
  const encoded = [];
  for (const item of attachments) {
    encoded.push({
      name: item.file.name,
      type: item.file.type || "application/octet-stream",
      size: item.file.size,
      lastModified: item.file.lastModified,
      data: await fileToBase64(item.file)
    });
  }
  return encoded;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const prompt = promptInput.value.trim();
  if ((!prompt && attachments.length === 0) || sendButton.disabled) return;
  const selectedNames = names.filter((name) => selectedTargets.has(name));
  if (!selectedNames.length) {
    setNotice("Choose at least one AI before sending.", "warning");
    return;
  }

  sending = true;
  updateSendButton();
  sendLabel.textContent = "Sending…";
  setNotice(`Sending to ${selectedNames.length} AI${selectedNames.length === 1 ? "" : "s"}${attachments.length ? ` with ${attachments.length} attachment${attachments.length === 1 ? "" : "s"}` : ""}…`);
  for (const name of selectedNames) setTargetStatus(name, "sending", "Sending…");

  try {
    const encodedAttachments = await encodeAttachments();
    const response = await chrome.runtime.sendMessage({ type: "SEND_TO_SELECTED", prompt, targets: selectedNames, attachments: encodedAttachments });
    if (response?.error) {
      setNotice(response.error, "error");
      return;
    }
    const results = response?.results || [];
    const sentCount = results.filter((result) => result.ok).length;
    showResults(prompt, results, selectedNames, attachments.length);
    setNotice(sentCount === selectedNames.length
      ? `Delivered to ${sentCount} of ${selectedNames.length} selected AI${selectedNames.length === 1 ? "" : "s"}.`
      : sentCount > 0
        ? `Partial delivery: ${sentCount} of ${selectedNames.length} succeeded. Your prompt and files are kept so you can retry.`
        : "Nothing was delivered. Check the AI tabs and file support, then try again.", sentCount === selectedNames.length ? "success" : sentCount > 0 ? "warning" : "error");

    // Keep the prompt and attachments for partial failures so the user can retry.
    if (sentCount > 0 && sentCount === selectedNames.length) {
      promptInput.value = "";
      resizePrompt();
      clearAttachments();
    }
    promptInput.focus();
  } catch (error) {
    setNotice(error?.message || "The extension couldn't submit this prompt.", "error");
    await refreshTargets();
  } finally {
    sending = false;
    updateSendButton();
  }
});

attachButton.addEventListener("click", () => filePicker.click());
filePicker.addEventListener("change", () => {
  addFiles(filePicker.files || []);
  filePicker.value = "";
});
clearFilesButton.addEventListener("click", clearAttachments);
promptInput.addEventListener("input", () => {
  resizePrompt();
  updateSendButton();
});

promptInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    form.requestSubmit();
  }
});

promptInput.addEventListener("paste", (event) => {
  const files = [...(event.clipboardData?.items || [])]
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter(Boolean);
  if (files.length) {
    event.preventDefault();
    addFiles(files);
  }
});

form.addEventListener("dragenter", (event) => {
  if (![...(event.dataTransfer?.types || [])].includes("Files")) return;
  event.preventDefault();
  dragDepth++;
  form.classList.add("drag-over");
});
form.addEventListener("dragover", (event) => {
  if (![...(event.dataTransfer?.types || [])].includes("Files")) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
});
form.addEventListener("dragleave", (event) => {
  event.preventDefault();
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) form.classList.remove("drag-over");
});
form.addEventListener("drop", (event) => {
  event.preventDefault();
  dragDepth = 0;
  form.classList.remove("drag-over");
  addFiles(event.dataTransfer?.files || []);
});

window.addEventListener("load", async () => {
  updateSelectionUI();
  await Promise.all([loadSelection(), positionWindow(), refreshTargets()]);
  resizePrompt();
  updateSendButton();
  promptInput.focus();
});

window.addEventListener("beforeunload", () => {
  for (const item of attachments) if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
});
