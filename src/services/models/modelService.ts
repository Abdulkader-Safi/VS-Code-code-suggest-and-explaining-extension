import * as vscode from "vscode";
import type { OllamaService } from "../../ollamaService";
import { ERROR_MESSAGES } from "../../constants";

/**
 * Service for managing Ollama models
 */
export class ModelService {
	private ollamaService: OllamaService;
	private currentModel = "";

	constructor(ollamaService: OllamaService) {
		this.ollamaService = ollamaService;
	}

	/**
	 * Get the currently selected model
	 */
	public getCurrentModel(): string {
		return this.currentModel;
	}

	/**
	 * Set the current model
	 */
	public setCurrentModel(model: string): void {
		this.currentModel = model;
	}

	/**
	 * Load available models from Ollama
	 */
	public async loadModels(): Promise<string[]> {
		try {
			const models = await this.ollamaService.listModels();

			// Auto-select first model if none selected
			if (models.length > 0 && !this.currentModel) {
				this.currentModel = models[0];
			}

			return models;
		} catch (error) {
			vscode.window.showErrorMessage(ERROR_MESSAGES.NO_MODELS);
			throw error;
		}
	}
}
