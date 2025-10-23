import * as vscode from "vscode";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Generate the complete HTML content for the webview by loading external files
 */
export const getWebviewContent = (
	webview: vscode.Webview,
	extensionUri: vscode.Uri,
): string => {
	// Get URIs for resources
	const stylesUri = webview.asWebviewUri(
		vscode.Uri.joinPath(extensionUri, "media", "styles.css"),
	);
	const scriptUri = webview.asWebviewUri(
		vscode.Uri.joinPath(extensionUri, "media", "main.js"),
	);

	// Read the HTML template
	const htmlPath = path.join(extensionUri.fsPath, "media", "index.html");
	let html = fs.readFileSync(htmlPath, "utf8");

	// Replace placeholders with actual URIs
	html = html.replace(/\{\{stylesUri\}\}/g, stylesUri.toString());
	html = html.replace(/\{\{scriptUri\}\}/g, scriptUri.toString());
	html = html.replace(/\{\{cspSource\}\}/g, webview.cspSource);

	return html;
};
