/**
 * Model selector component
 */
export const getModelSelectorHTML = (): string => {
	return /*html*/ `
		<div class="section">
			<label for="modelSelect">Ollama Model</label>
			<select id="modelSelect">
				<option value="">Loading models...</option>
			</select>
			<button class="refresh-button" id="refreshModels">Refresh Models</button>
		</div>
	`;
};
