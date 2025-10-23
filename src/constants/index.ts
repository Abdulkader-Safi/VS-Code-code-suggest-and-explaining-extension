export * from "./messages";

/**
 * Extension constants
 */
export const EXTENSION_CONSTANTS = {
	VIEW_TYPE: "ollamaExplainer",
	COMMAND_ID: "ollama-code-explainer.explainCode",
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
	NO_MODELS: "Failed to load Ollama models. Make sure Ollama is running.",
	NO_CODE_SELECTED: "No code selected. Please select some code to explain.",
	NO_MODEL_SELECTED: "No Ollama model selected. Please select a model first.",
	EXPLANATION_FAILED: "Failed to explain code",
	NO_MODELS_FOUND:
		"No Ollama models found. Make sure Ollama is running and you have models installed.",
} as const;
