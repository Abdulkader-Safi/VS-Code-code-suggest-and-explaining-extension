// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { OllamaPanelProvider } from "./ollamaPanelProvider";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log("Ollama Code Explainer extension is now active!");

	// Register the webview panel provider
	const provider = new OllamaPanelProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			OllamaPanelProvider.viewType,
			provider,
		),
	);

	// Register the command to explain code
	const explainCodeCommand = vscode.commands.registerCommand(
		"ollamaExplainer.explainCode",
		() => {
			provider.explainSelectedCode();
		},
	);

	context.subscriptions.push(explainCodeCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
