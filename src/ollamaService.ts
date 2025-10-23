import { Ollama } from "ollama";

export class OllamaService {
	private ollama: Ollama;

	constructor() {
		this.ollama = new Ollama({ host: "http://localhost:11434" });
	}

	async listModels(): Promise<string[]> {
		try {
			const response = await this.ollama.list();
			return response.models.map((model) => model.name);
		} catch (error) {
			console.error("Failed to list Ollama models:", error);
			return [];
		}
	}

	async explainCodeStream(
		code: string,
		language: string,
		model: string,
		mode: string,
		onChunk: (chunk: string) => void,
	): Promise<void> {
		try {
			let prompt: string;

			if (mode === "enhance") {
				prompt = `Analyze the following ${language} code and suggest improvements, enhancements, and potential fixes. Focus on:
- Code quality and best practices
- Performance optimizations
- Potential bugs or edge cases
- Security concerns
- Readability improvements

Do NOT write the actual code. Only describe what could be improved and why.

Code:
${code}`;
			} else {
				prompt = `Explain the following ${language} code in detail:\n\n${code}`;
			}

			const stream = await this.ollama.generate({
				model: model,
				prompt: prompt,
				stream: true,
			});

			for await (const chunk of stream) {
				if (chunk.response) {
					onChunk(chunk.response);
				}
			}
		} catch (error) {
			console.error("Failed to explain code with Ollama:", error);
			throw error;
		}
	}
}
