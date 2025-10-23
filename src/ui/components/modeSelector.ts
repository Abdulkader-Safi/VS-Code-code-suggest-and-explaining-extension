/**
 * Mode selector component for choosing between explain and enhance modes
 */
export const getModeSelectorHTML = (): string => {
	return /*html*/ `
		<div class="section mode-selector">
			<label style="margin-bottom: 8px;">Analysis Mode</label>
			<div class="mode-options">
				<div class="mode-option">
					<input type="radio" id="modeExplain" name="mode" value="explain" checked>
					<label for="modeExplain">Explain Code</label>
				</div>
				<div class="mode-option">
					<input type="radio" id="modeEnhance" name="mode" value="enhance">
					<label for="modeEnhance">Suggest Enhancements</label>
				</div>
			</div>
		</div>
	`;
};
