import * as vscode from "vscode";
import { OllamaService } from "./ollamaService";

export class OllamaPanelProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = "ollamaExplainer";
	private _view?: vscode.WebviewView;
	private ollamaService: OllamaService;
	private currentModel = "";

	constructor(private readonly _extensionUri: vscode.Uri) {
		this.ollamaService = new OllamaService();
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri],
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		// Handle messages from the webview
		webviewView.webview.onDidReceiveMessage(async (data) => {
			switch (data.type) {
				case "loadModels":
					await this.loadModels();
					break;
				case "modelSelected":
					this.currentModel = data.model;
					break;
				case "explainCode":
					await this.explainSelectedCode(data.mode || "explain");
					break;
			}
		});

		// Load models when the view is created
		this.loadModels();
	}

	private async loadModels() {
		try {
			const models = await this.ollamaService.listModels();

			if (this._view) {
				this._view.webview.postMessage({
					type: "modelsLoaded",
					models: models,
				});

				if (models.length > 0 && !this.currentModel) {
					this.currentModel = models[0];
				}
			}
		} catch (error) {
			vscode.window.showErrorMessage(
				"Failed to load Ollama models. Make sure Ollama is running.",
			);
		}
	}

	public async explainSelectedCode(mode = "explain") {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage(
				"No code selected. Please select some code to explain.",
			);
			return;
		}

		const selection = editor.selection;
		const text = editor.document.getText(selection);

		if (!text) {
			vscode.window.showInformationMessage(
				"No code selected. Please select some code to explain.",
			);
			return;
		}

		if (!this.currentModel) {
			vscode.window.showErrorMessage(
				"No Ollama model selected. Please select a model first.",
			);
			return;
		}

		const languageId = editor.document.languageId;

		// Show loading state
		if (this._view) {
			this._view.webview.postMessage({
				type: "explanationStarted",
			});
		}

		try {
			// Send code context
			if (this._view) {
				this._view.webview.postMessage({
					type: "codeContext",
					code: text,
					language: languageId,
				});
			}

			// Stream the explanation
			await this.ollamaService.explainCodeStream(
				text,
				languageId,
				this.currentModel,
				mode,
				(chunk) => {
					if (this._view) {
						this._view.webview.postMessage({
							type: "explanationChunk",
							chunk: chunk,
						});
					}
				},
			);

			// Signal completion
			if (this._view) {
				this._view.webview.postMessage({
					type: "explanationComplete",
				});
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to explain code: ${error}`);
			if (this._view) {
				this._view.webview.postMessage({
					type: "explanationError",
					error: String(error),
				});
			}
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ollama Code Explainer</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/11.1.1/marked.min.js"></script>
    <style>
        body {
            padding: 10px;
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
        }

        .container {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .section {
            margin-bottom: 15px;
        }

        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }

        select {
            width: 100%;
            padding: 5px;
            background: var(--vscode-dropdown-background);
            color: var(--vscode-dropdown-foreground);
            border: 1px solid var(--vscode-dropdown-border);
            border-radius: 2px;
        }

        button {
            width: 100%;
            padding: 8px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
            font-size: 14px;
        }

        button:hover {
            background: var(--vscode-button-hoverBackground);
        }

        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .code-context {
            margin: 10px 0;
            padding: 10px;
            background: var(--vscode-textCodeBlock-background);
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
            overflow-x: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
        }

        .language-label {
            color: var(--vscode-descriptionForeground);
            font-size: 11px;
            margin-bottom: 5px;
        }

        .explanation {
            margin-top: 10px;
            padding: 10px;
            background: var(--vscode-editor-background);
            border-left: 3px solid var(--vscode-activityBarBadge-background);
            border-radius: 3px;
            white-space: pre-wrap;
            word-wrap: break-word;
            line-height: 1.5;
        }

        .loading {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            color: var(--vscode-descriptionForeground);
        }

        .spinner {
            border: 2px solid var(--vscode-progressBar-background);
            border-top: 2px solid var(--vscode-button-background);
            border-radius: 50%;
            width: 16px;
            height: 16px;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .error {
            color: var(--vscode-errorForeground);
            padding: 10px;
            background: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            border-radius: 3px;
        }

        .empty-state {
            text-align: center;
            padding: 20px;
            color: var(--vscode-descriptionForeground);
        }

        .refresh-button {
            margin-top: 5px;
            padding: 4px 8px;
            font-size: 12px;
        }

        .mode-selector {
            margin-bottom: 10px;
        }

        .mode-options {
            display: flex;
            gap: 15px;
            margin-top: 5px;
        }

        .mode-option {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .mode-option input[type="radio"] {
            cursor: pointer;
        }

        .mode-option label {
            margin: 0;
            font-weight: normal;
            cursor: pointer;
        }

        .collapsible {
            margin: 10px 0;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 3px;
            overflow: hidden;
        }

        .collapsible-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px;
            background: var(--vscode-editor-background);
            cursor: pointer;
            user-select: none;
        }

        .collapsible-header:hover {
            background: var(--vscode-list-hoverBackground);
        }

        .collapsible-title {
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .collapsible-icon {
            transition: transform 0.2s;
            font-size: 12px;
        }

        .collapsible-icon.collapsed {
            transform: rotate(-90deg);
        }

        .collapsible-content {
            padding: 10px;
            background: var(--vscode-editor-background);
            max-height: 500px;
            overflow-y: auto;
        }

        .collapsible-content.collapsed {
            display: none;
        }

        .reset-button {
            margin-top: 10px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        .reset-button:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .button-group {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }

        .button-group button {
            flex: 1;
        }

        pre code {
            display: block;
            padding: 10px;
            border-radius: 3px;
            overflow-x: auto;
        }

        .hljs {
            background: var(--vscode-textCodeBlock-background) !important;
        }

        /* Markdown styling */
        .explanation h1, .explanation h2, .explanation h3, .explanation h4 {
            margin-top: 1em;
            margin-bottom: 0.5em;
            font-weight: bold;
        }

        .explanation h1 {
            font-size: 1.5em;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 0.3em;
        }

        .explanation h2 {
            font-size: 1.3em;
        }

        .explanation h3 {
            font-size: 1.1em;
        }

        .explanation ul, .explanation ol {
            margin: 0.5em 0;
            padding-left: 2em;
        }

        .explanation li {
            margin: 0.3em 0;
        }

        .explanation p {
            margin: 0.5em 0;
            line-height: 1.6;
        }

        .explanation strong {
            font-weight: bold;
            color: var(--vscode-editor-foreground);
        }

        .explanation em {
            font-style: italic;
        }

        .explanation code {
            background: var(--vscode-textCodeBlock-background);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
            font-size: 0.9em;
        }

        .explanation pre {
            margin: 1em 0;
        }

        .explanation pre code {
            display: block;
            padding: 10px;
            overflow-x: auto;
        }

        .explanation blockquote {
            border-left: 3px solid var(--vscode-activityBarBadge-background);
            margin: 1em 0;
            padding-left: 1em;
            color: var(--vscode-descriptionForeground);
        }

        .explanation hr {
            border: none;
            border-top: 1px solid var(--vscode-panel-border);
            margin: 1.5em 0;
        }

        .explanation table {
            border-collapse: collapse;
            margin: 1em 0;
            width: 100%;
        }

        .explanation table th,
        .explanation table td {
            border: 1px solid var(--vscode-panel-border);
            padding: 0.5em;
        }

        .explanation table th {
            background: var(--vscode-editor-background);
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="section">
            <label for="modelSelect">Ollama Model</label>
            <select id="modelSelect">
                <option value="">Loading models...</option>
            </select>
            <button class="refresh-button" id="refreshModels">Refresh Models</button>
        </div>

        <div class="section mode-selector">
            <label>Analysis Mode</label>
            <div class="mode-options">
                <div class="mode-option">
                    <input type="radio" id="modeExplain" name="mode" value="explain" checked>
                    <label for="modeExplain">Explain Code</label>
                </div>
                <div class="mode-option">
                    <input type="radio" id="modeEnhance" name="mode" value="enhance">
                    <label for="modeEnhance">Suggest Enhancements</label>
                </div>
            </div>
        </div>

        <div class="section">
            <button id="explainButton">Analyze Selected Code</button>
        </div>

        <div id="content"></div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const modelSelect = document.getElementById('modelSelect');
        const explainButton = document.getElementById('explainButton');
        const refreshModels = document.getElementById('refreshModels');
        const content = document.getElementById('content');
        const modeRadios = document.querySelectorAll('input[name="mode"]');

        let isLoading = false;
        let currentExplanation = '';
        let currentMode = 'explain';

        // Request models on load
        vscode.postMessage({ type: 'loadModels' });

        modelSelect.addEventListener('change', (e) => {
            vscode.postMessage({
                type: 'modelSelected',
                model: e.target.value
            });
        });

        modeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                currentMode = e.target.value;
            });
        });

        explainButton.addEventListener('click', () => {
            vscode.postMessage({
                type: 'explainCode',
                mode: currentMode
            });
        });

        refreshModels.addEventListener('click', () => {
            modelSelect.innerHTML = '<option value="">Loading models...</option>';
            modelSelect.disabled = true;
            vscode.postMessage({ type: 'loadModels' });
        });

        window.addEventListener('message', event => {
            const message = event.data;

            switch (message.type) {
                case 'modelsLoaded':
                    modelSelect.innerHTML = '';
                    modelSelect.disabled = false;

                    if (message.models.length === 0) {
                        modelSelect.innerHTML = '<option value="">No models found</option>';
                        content.innerHTML = '<div class="empty-state">No Ollama models found. Make sure Ollama is running and you have models installed.</div>';
                    } else {
                        message.models.forEach(model => {
                            const option = document.createElement('option');
                            option.value = model;
                            option.textContent = model;
                            modelSelect.appendChild(option);
                        });
                        // Auto-select first model
                        if (modelSelect.value) {
                            vscode.postMessage({
                                type: 'modelSelected',
                                model: modelSelect.value
                            });
                        }
                    }
                    break;

                case 'codeContext':
                    content.innerHTML = \`
                        <div class="collapsible">
                            <div class="collapsible-header" onclick="toggleCollapsible('code-section')">
                                <div class="collapsible-title">
                                    <span class="collapsible-icon" id="code-section-icon">▼</span>
                                    <span>Selected Code (\${message.language})</span>
                                </div>
                            </div>
                            <div class="collapsible-content" id="code-section-content">
                                <pre><code class="language-\${message.language}">\${escapeHtml(message.code)}</code></pre>
                            </div>
                        </div>
                    \`;
                    // Apply syntax highlighting
                    document.querySelectorAll('pre code').forEach((block) => {
                        hljs.highlightElement(block);
                    });
                    break;

                case 'explanationStarted':
                    isLoading = true;
                    explainButton.disabled = true;
                    currentExplanation = '';
                    content.innerHTML += '<div class="loading"><div class="spinner"></div><span>Analyzing code...</span></div>';
                    break;

                case 'explanationChunk':
                    currentExplanation += message.chunk;
                    updateExplanation();
                    break;

                case 'explanationComplete':
                    isLoading = false;
                    explainButton.disabled = false;
                    updateExplanation();
                    addResetButton();
                    break;

                case 'explanationError':
                    isLoading = false;
                    explainButton.disabled = false;
                    content.innerHTML += \`<div class="error">Error: \${escapeHtml(message.error)}</div>\`;
                    break;
            }
        });

        function updateExplanation() {
            const loadingDiv = document.querySelector('.loading');
            if (loadingDiv) {
                loadingDiv.remove();
            }

            let existingCollapsible = document.getElementById('explanation-collapsible');

            if (!existingCollapsible && currentExplanation) {
                existingCollapsible = document.createElement('div');
                existingCollapsible.id = 'explanation-collapsible';
                existingCollapsible.className = 'collapsible';
                existingCollapsible.innerHTML = \`
                    <div class="collapsible-header" onclick="toggleCollapsible('explanation-section')">
                        <div class="collapsible-title">
                            <span class="collapsible-icon" id="explanation-section-icon">▼</span>
                            <span>Analysis Result</span>
                        </div>
                    </div>
                    <div class="collapsible-content" id="explanation-section-content">
                        <div class="explanation" id="explanation-text"></div>
                    </div>
                \`;
                content.appendChild(existingCollapsible);
            }

            const explanationText = document.getElementById('explanation-text');
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
                highlight: function(code, lang) {
                    if (lang && hljs.getLanguage(lang)) {
                        try {
                            return hljs.highlight(code, { language: lang }).value;
                        } catch (err) {
                            console.error('Highlight error:', err);
                        }
                    }
                    return hljs.highlightAuto(code).value;
                }
            });

            // Parse markdown to HTML
            const html = marked.parse(text);
            return html;
        }

        function toggleCollapsible(sectionId) {
            const content = document.getElementById(sectionId + '-content');
            const icon = document.getElementById(sectionId + '-icon');

            if (content && icon) {
                content.classList.toggle('collapsed');
                icon.classList.toggle('collapsed');
            }
        }

        function addResetButton() {
            // Remove existing reset button if any
            const existingReset = document.getElementById('reset-button');
            if (existingReset) {
                existingReset.remove();
            }

            const resetButton = document.createElement('button');
            resetButton.id = 'reset-button';
            resetButton.className = 'reset-button';
            resetButton.textContent = 'Reset & Analyze New Code';
            resetButton.onclick = () => {
                content.innerHTML = '';
                currentExplanation = '';
                explainButton.disabled = false;
            };
            content.appendChild(resetButton);
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>`;
	}
}
