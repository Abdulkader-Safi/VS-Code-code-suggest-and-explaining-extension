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
					await this.explainSelectedCode();
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

	public async explainSelectedCode() {
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

        <div class="section">
            <button id="explainButton">Explain Selected Code</button>
        </div>

        <div id="content"></div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const modelSelect = document.getElementById('modelSelect');
        const explainButton = document.getElementById('explainButton');
        const refreshModels = document.getElementById('refreshModels');
        const content = document.getElementById('content');

        let isLoading = false;
        let currentExplanation = '';

        // Request models on load
        vscode.postMessage({ type: 'loadModels' });

        modelSelect.addEventListener('change', (e) => {
            vscode.postMessage({
                type: 'modelSelected',
                model: e.target.value
            });
        });

        explainButton.addEventListener('click', () => {
            vscode.postMessage({ type: 'explainCode' });
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
                        <div class="language-label">Language: \${message.language}</div>
                        <div class="code-context">\${escapeHtml(message.code)}</div>
                    \`;
                    break;

                case 'explanationStarted':
                    isLoading = true;
                    explainButton.disabled = true;
                    currentExplanation = '';
                    content.innerHTML += '<div class="loading"><div class="spinner"></div><span>Generating explanation...</span></div>';
                    break;

                case 'explanationChunk':
                    currentExplanation += message.chunk;
                    updateExplanation();
                    break;

                case 'explanationComplete':
                    isLoading = false;
                    explainButton.disabled = false;
                    updateExplanation();
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

            const existingExplanation = document.querySelector('.explanation');
            if (existingExplanation) {
                existingExplanation.textContent = currentExplanation;
            } else {
                const explanationDiv = document.createElement('div');
                explanationDiv.className = 'explanation';
                explanationDiv.textContent = currentExplanation;
                content.appendChild(explanationDiv);
            }
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
