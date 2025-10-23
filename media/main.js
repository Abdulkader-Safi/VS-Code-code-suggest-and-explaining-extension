const vscode = acquireVsCodeApi();
const modelSelect = document.getElementById("modelSelect");
const explainButton = document.getElementById("explainButton");
const refreshModels = document.getElementById("refreshModels");
const content = document.getElementById("content");
const modeRadios = document.querySelectorAll('input[name="mode"]');

let isLoading = false;
let currentExplanation = "";
let currentMode = "explain";

// Request models on load
vscode.postMessage({ type: "loadModels" });

modelSelect.addEventListener("change", (e) => {
  vscode.postMessage({
    type: "modelSelected",
    model: e.target.value,
  });
});

for (const radio of modeRadios) {
  radio.addEventListener("change", (e) => {
    currentMode = e.target.value;
  });
}

explainButton.addEventListener("click", () => {
  vscode.postMessage({
    type: "explainCode",
    mode: currentMode,
  });
});

refreshModels.addEventListener("click", () => {
  modelSelect.innerHTML = '<option value="">Loading models...</option>';
  modelSelect.disabled = true;
  vscode.postMessage({ type: "loadModels" });
});

window.addEventListener("message", (event) => {
  const message = event.data;

  switch (message.type) {
    case "modelsLoaded":
      modelSelect.innerHTML = "";
      modelSelect.disabled = false;

      if (message.models.length === 0) {
        modelSelect.innerHTML = '<option value="">No models found</option>';
        content.innerHTML =
          '<div class="empty-state">No Ollama models found. Make sure Ollama is running and you have models installed.</div>';
      } else {
        for (const model of message.models) {
          const option = document.createElement("option");
          option.value = model;
          option.textContent = model;
          modelSelect.appendChild(option);
        }
        // Auto-select first model
        if (modelSelect.value) {
          vscode.postMessage({
            type: "modelSelected",
            model: modelSelect.value,
          });
        }
      }
      break;

    case "codeContext":
      content.innerHTML = `
				<div class="collapsible">
					<div class="collapsible-header" onclick="toggleCollapsible('code-section')">
						<div class="collapsible-title">
							<span class="collapsible-icon" id="code-section-icon">▼</span>
							<span>Selected Code (${message.language})</span>
						</div>
					</div>
					<div class="collapsible-content" id="code-section-content">
						<pre><code class="language-${message.language}">${escapeHtml(
        message.code
      )}</code></pre>
					</div>
				</div>
			`;
      // Apply syntax highlighting
      for (const block of document.querySelectorAll("pre code")) {
        hljs.highlightElement(block);
      }
      break;

    case "explanationStarted":
      isLoading = true;
      explainButton.disabled = true;
      currentExplanation = "";
      content.innerHTML +=
        '<div class="loading"><div class="spinner"></div><span>Analyzing code...</span></div>';
      break;

    case "explanationChunk":
      currentExplanation += message.chunk;
      updateExplanation();
      break;

    case "explanationComplete":
      isLoading = false;
      explainButton.disabled = false;
      updateExplanation();
      addResetButton();
      break;

    case "explanationError":
      isLoading = false;
      explainButton.disabled = false;
      content.innerHTML += `<div class="error">Error: ${escapeHtml(
        message.error
      )}</div>`;
      break;
  }
});

function updateExplanation() {
  const loadingDiv = document.querySelector(".loading");
  if (loadingDiv) {
    loadingDiv.remove();
  }

  let existingCollapsible = document.getElementById("explanation-collapsible");

  if (!existingCollapsible && currentExplanation) {
    existingCollapsible = document.createElement("div");
    existingCollapsible.id = "explanation-collapsible";
    existingCollapsible.className = "collapsible";
    existingCollapsible.innerHTML = `
			<div class="collapsible-header" onclick="toggleCollapsible('explanation-section')">
				<div class="collapsible-title">
					<span class="collapsible-icon" id="explanation-section-icon">▼</span>
					<span>Analysis Result</span>
				</div>
			</div>
			<div class="collapsible-content" id="explanation-section-content">
				<div class="explanation" id="explanation-text"></div>
			</div>
		`;
    content.appendChild(existingCollapsible);
  }

  const explanationText = document.getElementById("explanation-text");
  if (explanationText) {
    // Parse markdown and highlight code blocks
    const htmlContent = parseMarkdownWithCodeHighlight(currentExplanation);
    explanationText.innerHTML = htmlContent;
  }
}

function parseMarkdownWithCodeHighlight(text) {
  // Configure marked.js for proper markdown rendering
  marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: (code, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value;
        } catch (err) {
          console.error("Highlight error:", err);
        }
      }
      return hljs.highlightAuto(code).value;
    },
  });

  // Parse markdown to HTML
  const html = marked.parse(text);
  return html;
}

function toggleCollapsible(sectionId) {
  const content = document.getElementById(`${sectionId}-content`);
  const icon = document.getElementById(`${sectionId}-icon`);

  if (content && icon) {
    content.classList.toggle("collapsed");
    icon.classList.toggle("collapsed");
  }
}

function addResetButton() {
  // Remove existing reset button if any
  const existingReset = document.getElementById("reset-button");
  if (existingReset) {
    existingReset.remove();
  }

  const resetButton = document.createElement("button");
  resetButton.id = "reset-button";
  resetButton.className = "reset-button";
  resetButton.textContent = "Reset & Analyze New Code";
  resetButton.onclick = () => {
    content.innerHTML = "";
    currentExplanation = "";
    explainButton.disabled = false;
  };
  content.appendChild(resetButton);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
