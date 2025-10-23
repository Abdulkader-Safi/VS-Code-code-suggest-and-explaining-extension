import { WebviewMessageType } from "../constants";
import type {
	ModelsLoadedMessage,
	CodeContextMessage,
	ExplanationStartedMessage,
	ExplanationChunkMessage,
	ExplanationCompleteMessage,
	ExplanationErrorMessage,
} from "../models";

/**
 * Utility functions for building messages to send to webview
 */
export function modelsLoaded(models: string[]): ModelsLoadedMessage {
	return {
		type: WebviewMessageType.MODELS_LOADED,
		models,
	};
}

export function codeContext(
	code: string,
	language: string,
): CodeContextMessage {
	return {
		type: WebviewMessageType.CODE_CONTEXT,
		code,
		language,
	};
}

export function explanationStarted(): ExplanationStartedMessage {
	return {
		type: WebviewMessageType.EXPLANATION_STARTED,
	};
}

export function explanationChunk(chunk: string): ExplanationChunkMessage {
	return {
		type: WebviewMessageType.EXPLANATION_CHUNK,
		chunk,
	};
}

export function explanationComplete(): ExplanationCompleteMessage {
	return {
		type: WebviewMessageType.EXPLANATION_COMPLETE,
	};
}

export function explanationError(error: string): ExplanationErrorMessage {
	return {
		type: WebviewMessageType.EXPLANATION_ERROR,
		error,
	};
}
