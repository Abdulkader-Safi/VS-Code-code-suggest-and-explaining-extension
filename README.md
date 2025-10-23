# VS Code Code Suggest and Explaining Extension

A powerful Visual Studio Code extension that leverages Ollama AI models to analyze, explain, and provide enhancement suggestions for your code directly within your IDE.

## Features

### Code Analysis

- **Explain Code**: Get detailed explanations of selected code snippets in natural language
- **Enhancement Suggestions**: Receive AI-powered recommendations to improve code quality, performance, and best practices

### Interactive Webview Panel

- Dedicated sidebar panel with an intuitive interface
- Real-time streaming responses for faster feedback
- Collapsible sections for better organization
- Markdown rendering with syntax highlighting
- Support for multiple Ollama models

### Language Support

- Works with any programming language supported by VS Code
- Automatically detects the language of selected code
- Context-aware explanations based on language syntax

## Prerequisites

Before using this extension, you need to have:

1. **Ollama** installed on your system
   - Download from [ollama.ai](https://ollama.ai)
   - Ensure Ollama service is running

2. **At least one Ollama model** downloaded
   - Example: `ollama pull codellama`
   - Recommended models for code analysis:
     - `codellama` - Meta's code-specialized LLM
     - `deepseek-coder` - Excellent for code understanding
     - `phind-codellama` - Fine-tuned for coding tasks
     - `mistral` - General-purpose with good code capabilities

## Installation

### From VSIX (Local Installation)

1. Download the `.vsix` file
2. Open VS Code
3. Go to Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`)
4. Click the `...` menu at the top of the Extensions view
5. Select "Install from VSIX..."
6. Choose the downloaded `.vsix` file

### From Source

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press `F5` to open a new VS Code window with the extension loaded

## Usage

### Opening the Extension

1. Click on the Ollama icon in the Activity Bar (left sidebar)
2. The "Code Explainer" panel will open

### Analyzing Code

1. **Select Code**: Highlight the code you want to analyze in any file
2. **Choose Model**: Select an Ollama model from the dropdown in the panel
3. **Select Mode**:
   - **Explain Code**: Get a detailed explanation of what the code does
   - **Suggest Enhancements**: Receive recommendations for improvements
4. **Analyze**: Click the "Analyze Selected Code" button
5. **View Results**: The analysis will stream in real-time in the panel

### Alternative Method

You can also use the Command Palette:

- Press `Ctrl+Shift+P` / `Cmd+Shift+P`
- Type "Explain Code with Ollama"
- Press Enter (make sure code is selected first)

## Features in Detail

### Real-time Streaming

The extension uses streaming responses from Ollama, providing instant feedback as the AI generates the analysis. No more waiting for the entire response to complete!

### Markdown Support

All responses are rendered as markdown with:

- Syntax-highlighted code blocks
- Formatted headers and lists
- Tables and blockquotes
- Inline code formatting

### Collapsible Sections

- **Selected Code**: View the code being analyzed with syntax highlighting
- **Analysis Result**: Expandable/collapsible sections keep your workspace organized

### Model Management

- Dynamically loads all available Ollama models
- Refresh models without restarting VS Code
- Remembers your last selected model

## Troubleshooting

### "Failed to load Ollama models"

- Ensure Ollama is installed and running
- Check if Ollama service is accessible at `http://localhost:11434`
- Verify you have at least one model installed: `ollama list`

### "No Ollama model selected"

- Click the "Refresh Models" button in the panel
- Ensure at least one model is installed via `ollama pull <model-name>`

### No Response When Analyzing

- Make sure you have selected code in the active editor
- Verify the selected model is available and running
- Check VS Code's Output panel (View � Output � Ollama Code Explainer) for errors

## Configuration

Currently, the extension works with default Ollama settings. Future versions will include:

- Custom Ollama API endpoint configuration
- Temperature and other model parameter controls
- Custom prompt templates
- History of previous analyses

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Run tests
npm test
```

## Requirements

- VS Code version `^1.105.0` or higher
- Ollama service running locally
- Node.js for development

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

### Ideas for Contributions

- Add support for custom prompts
- Implement analysis history/cache
- Add more analysis modes (debug, optimize, document)
- Support for remote Ollama instances
- Integration with other AI providers

## Known Issues

- Large code selections may take longer to analyze
- Requires Ollama to be running locally (no cloud support yet)

## Release Notes

### 0.0.1 (Initial Release)

- Initial release of VS Code Code Suggest and Explaining Extension
- Code explanation with Ollama integration
- Enhancement suggestions mode
- Real-time streaming responses
- Markdown rendering with syntax highlighting
- Multi-model support
- Interactive webview panel

## Support

If you encounter any issues or have feature requests, please file an issue on the GitHub repository.

---

**Enjoy enhanced code understanding with AI-powered analysis!**

[My Website](https://abdulkadersafi.com)
