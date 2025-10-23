import type * as vscode from "vscode";
import { OllamaService } from "../ollamaService";
import { ModelService } from "../services/models/modelService";
import { CodeAnalysisService } from "../services/codeAnalysis/codeAnalysisService";
import { WebviewMessageHandler } from "./webviewMessageHandler";
import { getWebviewContent } from "../ui/webview/content";
import {
	EXTENSION_CONSTANTS,
	AnalysisMode,
	WebviewMessageType,
} from "../constants";
import type { WebviewToExtensionMessage } from "../models";

/**
 * Provider for the Ollama Code Explainer webview
 * This is a thin orchestrator that delegates to specialized services
 */
export class WebviewPanelProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = EXTENSION_CONSTANTS.VIEW_TYPE;

	private ollamaService: OllamaService;
	private modelService: ModelService;
	private codeAnalysisService: CodeAnalysisService;
	private messageHandler?: WebviewMessageHandler;

	constructor(private readonly _extensionUri: vscode.Uri) {
		this.ollamaService = new OllamaService();
		this.modelService = new ModelService(this.ollamaService);
		this.codeAnalysisService = new CodeAnalysisService(this.ollamaService);
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	): void {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri],
		};

		webviewView.webview.html = getWebviewContent(
			webviewView.webview,
			this._extensionUri,
		);

		// Initialize message handler
		this.messageHandler = new WebviewMessageHandler(
			webviewView.webview,
			this.modelService,
			this.codeAnalysisService,
		);

		// Handle messages from the webview
		webviewView.webview.onDidReceiveMessage(
			async (data: WebviewToExtensionMessage) => {
				if (this.messageHandler) {
					await this.messageHandler.handleMessage(data);
				}
			},
		); // Load models when the view is created
		if (this.messageHandler) {
			this.messageHandler.handleMessage({
				type: WebviewMessageType.LOAD_MODELS,
			});
		}
	}

	/**
	 * Public method to trigger code explanation from commands
	 */
	public async explainSelectedCode(
		mode: AnalysisMode = AnalysisMode.EXPLAIN,
	): Promise<void> {
		if (this.messageHandler) {
			await this.messageHandler.handleMessage({
				type: WebviewMessageType.EXPLAIN_CODE,
				mode,
			});
		}
	}
}
