import type * as vscode from "vscode";
import type { WebviewToExtensionMessage } from "../models";
import { WebviewMessageType, AnalysisMode } from "../constants";
import type { ModelService } from "../services/models/modelService";
import type { CodeAnalysisService } from "../services/codeAnalysis/codeAnalysisService";
import {
	codeContext,
	explanationChunk,
	explanationComplete,
	explanationError,
	explanationStarted,
	modelsLoaded,
} from "../utils";

/**
 * Handles messages from the webview
 */
export class WebviewMessageHandler {
	constructor(
		private webview: vscode.Webview,
		private modelService: ModelService,
		private codeAnalysisService: CodeAnalysisService,
	) {}

	/**
	 * Handle a message from the webview
	 */
	public async handleMessage(
		message: WebviewToExtensionMessage,
	): Promise<void> {
		switch (message.type) {
			case WebviewMessageType.LOAD_MODELS:
				await this.handleLoadModels();
				break;

			case WebviewMessageType.MODEL_SELECTED:
				this.handleModelSelected(message.model);
				break;

			case WebviewMessageType.EXPLAIN_CODE:
				await this.handleExplainCode(message.mode || AnalysisMode.EXPLAIN);
				break;
		}
	}

	/**
	 * Load models and send to webview
	 */
	private async handleLoadModels(): Promise<void> {
		const models = await this.modelService.loadModels();
		this.webview.postMessage(modelsLoaded(models));
	}

	/**
	 * Handle model selection
	 */
	private handleModelSelected(model: string): void {
		this.modelService.setCurrentModel(model);
	}

	/**
	 * Handle code explanation request
	 */
	private async handleExplainCode(mode: AnalysisMode): Promise<void> {
		const selectedCode = this.codeAnalysisService.getSelectedCode();
		if (!selectedCode) {
			return;
		}

		const { text, languageId } = selectedCode;
		const currentModel = this.modelService.getCurrentModel();

		// Show loading state
		this.webview.postMessage(explanationStarted());

		try {
			// Send code context
			this.webview.postMessage(codeContext(text, languageId));

			// Stream the explanation
			await this.codeAnalysisService.analyzeCode(
				text,
				languageId,
				currentModel,
				mode,
				(chunk) => {
					this.webview.postMessage(explanationChunk(chunk));
				},
			);

			// Signal completion
			this.webview.postMessage(explanationComplete());
		} catch (error) {
			this.webview.postMessage(explanationError(String(error)));
		}
	}
}
