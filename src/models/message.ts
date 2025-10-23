import type { WebviewMessageType, AnalysisMode } from "../constants";

/**
 * Base message structure
 */
export interface BaseMessage {
	type: WebviewMessageType;
}

/**
 * Messages from webview to extension
 */
export interface LoadModelsMessage extends BaseMessage {
	type: WebviewMessageType.LOAD_MODELS;
}

export interface ModelSelectedMessage extends BaseMessage {
	type: WebviewMessageType.MODEL_SELECTED;
	model: string;
}

export interface ExplainCodeMessage extends BaseMessage {
	type: WebviewMessageType.EXPLAIN_CODE;
	mode?: AnalysisMode;
}

export type WebviewToExtensionMessage =
	| LoadModelsMessage
	| ModelSelectedMessage
	| ExplainCodeMessage;

/**
 * Messages from extension to webview
 */
export interface ModelsLoadedMessage extends BaseMessage {
	type: WebviewMessageType.MODELS_LOADED;
	models: string[];
}

export interface CodeContextMessage extends BaseMessage {
	type: WebviewMessageType.CODE_CONTEXT;
	code: string;
	language: string;
}

export interface ExplanationStartedMessage extends BaseMessage {
	type: WebviewMessageType.EXPLANATION_STARTED;
}

export interface ExplanationChunkMessage extends BaseMessage {
	type: WebviewMessageType.EXPLANATION_CHUNK;
	chunk: string;
}

export interface ExplanationCompleteMessage extends BaseMessage {
	type: WebviewMessageType.EXPLANATION_COMPLETE;
}

export interface ExplanationErrorMessage extends BaseMessage {
	type: WebviewMessageType.EXPLANATION_ERROR;
	error: string;
}

export type ExtensionToWebviewMessage =
	| ModelsLoadedMessage
	| CodeContextMessage
	| ExplanationStartedMessage
	| ExplanationChunkMessage
	| ExplanationCompleteMessage
	| ExplanationErrorMessage;
