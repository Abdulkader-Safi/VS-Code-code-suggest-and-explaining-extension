import * as vscode from "vscode";
import type { OllamaService } from "../../ollamaService";
import type { AnalysisMode } from "../../constants/messages";
import { ERROR_MESSAGES } from "../../constants";

/**
 * Service for analyzing code using Ollama
 */
export class CodeAnalysisService {
	private ollamaService: OllamaService;

	constructor(ollamaService: OllamaService) {
		this.ollamaService = ollamaService;
	}

	/**
	 * Get selected code from the active editor
	 */
	public getSelectedCode(): {
		text: string;
		languageId: string;
	} | null {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage(ERROR_MESSAGES.NO_CODE_SELECTED);
			return null;
		}

		const selection = editor.selection;
		const text = editor.document.getText(selection);

		if (!text) {
			vscode.window.showInformationMessage(ERROR_MESSAGES.NO_CODE_SELECTED);
			return null;
		}

		return {
			text,
			languageId: editor.document.languageId,
		};
	}

	/**
	 * Analyze code with streaming response
	 */
	public async analyzeCode(
		code: string,
		languageId: string,
		model: string,
		mode: AnalysisMode,
		onChunk: (chunk: string) => void,
	): Promise<void> {
		if (!model) {
			vscode.window.showErrorMessage(ERROR_MESSAGES.NO_MODEL_SELECTED);
			throw new Error(ERROR_MESSAGES.NO_MODEL_SELECTED);
		}

		try {
			await this.ollamaService.explainCodeStream(
				code,
				languageId,
				model,
				mode,
				onChunk,
			);
		} catch (error) {
			const errorMessage = `${ERROR_MESSAGES.EXPLANATION_FAILED}: ${error}`;
			vscode.window.showErrorMessage(errorMessage);
			throw error;
		}
	}
}
