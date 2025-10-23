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

	async explainCode(
		code: string,
		language: string,
		model: string,
	): Promise<string> {
		try {
			const prompt = `Explain the following ${language} code in detail:\n\n${code}`;

			let fullResponse = "";
			const stream = await this.ollama.generate({
				model: model,
				prompt: prompt,
				stream: true,
			});

			for await (const chunk of stream) {
				if (chunk.response) {
					fullResponse += chunk.response;
				}
			}

			return fullResponse;
		} catch (error) {
			console.error("Failed to explain code with Ollama:", error);
			throw error;
		}
	}

	async explainCodeStream(
		code: string,
		language: string,
		model: string,
		onChunk: (chunk: string) => void,
	): Promise<void> {
		try {
			const prompt = `Explain the following ${language} code in detail:\n\n${code}`;

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
