// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

const WorkitemsProvider = require('./src/providers/WorkitemsProvider');
const registerAddCommands = require('./src/commands/addCommands');
const useStore = require('./src/store/stateManager');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	// --- Persistence: Load store from globalState ---
	const STORAGE_KEY = 'workitemsStore';
	const persisted = context.globalState.get(STORAGE_KEY);
	if (persisted && persisted.dataStructureVersion) {
		// Run versioning/migration logic
		const result = useStore.getState().checkAndMigrateVersion(persisted.dataStructureVersion);
		if (result === 'unchanged' || result === 'migrated') {
			// Restore data
			useStore.setState({
				...persisted,
			});
		}
		// If 'cleared' or 'initialized', store is already reset
	}

	const workitemsProvider = new WorkitemsProvider();
	vscode.window.registerTreeDataProvider('workitems', workitemsProvider);

	registerAddCommands(context, workitemsProvider);

	// --- Persistence: Save store to globalState on every mutation ---
	useStore.subscribe((state) => {
		// Only persist user data, not methods
		context.globalState.update(STORAGE_KEY, {
			itemsById: state.itemsById,
			parentById: state.parentById,
			rootIds: state.rootIds,
			dataStructureVersion: state.dataStructureVersion,
		});
	});

	const decorationEmitter = new vscode.EventEmitter();
	const workitemsDecorationProvider = {
		onDidChangeFileDecorations: decorationEmitter.event,
		provideFileDecoration: (uri) => {
			if (uri.scheme !== 'workitems') {
				return;
			}
			const parts = uri.path.split('/').filter(Boolean);
			const [type, id] = parts;
			const state = useStore.getState();
			const item = state.itemsById[id];
			if (!item || !item.status) return;
			if (item.status.isLoading) {
				return new vscode.FileDecoration(
					'',
					'Loading',
					new vscode.ThemeColor('charts.yellow')
				);
			}
			if (item.status.isError) {
				return new vscode.FileDecoration(
					'!',
					'Incomplete',
					new vscode.ThemeColor('problemsWarningIcon.foreground')
				);
			}
			if (item.status.isComplete) {
				return new vscode.FileDecoration(
					'',
					'Complete',
					new vscode.ThemeColor('charts.green')
				);
			}
		}
	};

	context.subscriptions.push(
		vscode.window.registerFileDecorationProvider(workitemsDecorationProvider)
	);

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
