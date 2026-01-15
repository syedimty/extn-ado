// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

const WorkitemsProvider = require('./src/providers/WorkitemsProvider');
const registerAddCommands = require('./src/commands/addCommands');
// const workitemsData = require('./src/data/workitemsData');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    const workitemsProvider = new WorkitemsProvider();
    vscode.window.registerTreeDataProvider('workitems', workitemsProvider);

    registerAddCommands(context, workitemsProvider);

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "workitems-manager" is now active!');

	// Register commands
	context.subscriptions.push(
		vscode.commands.registerCommand('workitems-manager.helloWorld', function () {
			vscode.window.showInformationMessage('Hello World from workitems-manager!');
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('workitems-manager.deleteWorkitem', () => {
			vscode.window.showInformationMessage('Delete Workitem clicked!');
			// TODO: Implement delete workitem logic
		})
	);
}

/**
 * Generate HTML content for the webview
 * @param {string} currentText - The current item text
 * @param {string} itemType - The type of item (Epic, Feature, Story)
 * @returns {string} HTML content
 */
function getWebviewContent(currentText, itemType = 'Epic') {
	return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Edit ${itemType}</title>
		<style>
			body {
				padding: 20px;
				font-family: var(--vscode-font-family);
				color: var(--vscode-foreground);
			}
			h2 {
				margin-top: 0;
			}
			input {
				width: 100%;
				padding: 8px;
				margin: 10px 0;
				background: var(--vscode-input-background);
				color: var(--vscode-input-foreground);
				border: 1px solid var(--vscode-input-border);
				box-sizing: border-box;
			}
			input:focus {
				outline: 1px solid var(--vscode-focusBorder);
			}
			button {
				padding: 8px 16px;
				margin-top: 10px;
				background: var(--vscode-button-background);
				color: var(--vscode-button-foreground);
				border: none;
				cursor: pointer;
			}
			button:hover {
				background: var(--vscode-button-hoverBackground);
			}
		</style>
	</head>
	<body>
		<h2>Edit ${itemType}</h2>
		<label for="itemText">${itemType} Title:</label>
		<input type="text" id="itemText" value="${currentText}" />
		<br/>
		<button onclick="saveItem()">Save</button>
		
		<script>
			const vscode = acquireVsCodeApi();
			
			function saveItem() {
				const text = document.getElementById('itemText').value;
				vscode.postMessage({
					command: 'save',
					text: text
				});
			}
			
			// Allow Enter key to save
			document.getElementById('itemText').addEventListener('keypress', (e) => {
				if (e.key === 'Enter') {
					saveItem();
				}
			});
		</script>
	</body>
	</html>`;
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
};
