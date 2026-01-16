const vscode = require('vscode');
const WorkitemTreeItem = require('../providers/WorkitemTreeItem');
const workitemsData = require('../data/workitemsData');
// Import zustand store
const useStore = require('../store/stateManager');

function registerAddCommands(context, workitemsProvider) {
    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.addEpic', async () => {
            const title = 'New Epic';
            const epicId = Math.floor(Math.random() * 10000);

            const newEpic = new WorkitemTreeItem(
                title,
                vscode.TreeItemCollapsibleState.Collapsed,
                'epic',
                epicId,
                []
            );
            newEpic.iconPath = new vscode.ThemeIcon('sync~spin');

            workitemsData.push(newEpic);
            useStore.getState().addEpic({ title, id: epicId });
            workitemsProvider.refresh();

            setTimeout(() => {
                newEpic.iconPath = new vscode.ThemeIcon('project');
                workitemsProvider.refresh();
            }, 2000);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.addFeature', async (item) => {
            const title = await vscode.window.showInputBox({ prompt: `Enter Feature Title for ${item.label}` });
            if (!title) return;

            const newFeature = { title, id: Math.floor(Math.random() * 10000), parentId: item.id };
            useStore.getState().addFeature(newFeature);
            workitemsProvider.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.addSolutionIntent', async (item) => {
            const title = await vscode.window.showInputBox({ prompt: `Enter Solution Intent Title for ${item.label}` });
            if (!title) return;

            const newSolutionIntent = { title, id: Math.floor(Math.random() * 10000), parentId: item.id };
            useStore.getState().addSolutionIntent(newSolutionIntent);
            workitemsProvider.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.addUserStory', async (item) => {
            const title = await vscode.window.showInputBox({ prompt: `Enter User Story Title for ${item.label}` });
            if (!title) return;

            const newUserStory = { title, id: Math.floor(Math.random() * 10000), parentId: item.id };
            useStore.getState().addUserStory(newUserStory);
            workitemsProvider.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.deleteItem', async (item) => {
            // Confirm deletion
            const confirm = await vscode.window.showWarningMessage(
                `Are you sure you want to delete ${item.type}: ${item.label}?`,
                { modal: true },
                'Delete'
            );

            if (confirm !== 'Delete') return;

            // Find and remove the item from its parent
            function deleteItemFromParent(parent, target) {
                const index = parent.children.indexOf(target);
                if (index !== -1) {
                    parent.children.splice(index, 1);
                    return true;
                }
                for (const child of parent.children) {
                    if (deleteItemFromParent(child, target)) {
                        return true;
                    }
                }
                return false;
            }

            // Serialize the item safely to avoid circular references
            console.log('Deleting item:', item);

            if (item.type === 'epic') {
                const index = workitemsData.indexOf(item);
                if (index !== -1) {
                    workitemsData.splice(index, 1);
                }
            } else {
                for (const epic of workitemsData) {
                    if (deleteItemFromParent(epic, item)) {
                        break;
                    }
                }
            }

            // Refresh the tree view
            workitemsProvider.refresh();

            vscode.window.showInformationMessage(`${item.type} "${item.label}" deleted successfully!`);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.editEpic', async (id) => {
            const item = workitemsData.find(workitem => workitem.id === id);
            if (!item) {
                vscode.window.showErrorMessage(`Epic with ID ${id} not found.`);
                return;
            }

            const panel = vscode.window.createWebviewPanel(
                'editEpic',
                'Edit Epic',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );

            const currentTitle = item.fields?.Title || item.label || '';
            const currentDescription = item.fields?.Description || '';

            panel.webview.html = getEpicWebviewContent(currentTitle, currentDescription);

            panel.webview.onDidReceiveMessage(
                (message) => {
                    if (message.command === 'save') {
                        const newTitle = message.title?.trim();
                        const newDescription = message.description || '';

                        if (!newTitle) {
                            vscode.window.showErrorMessage('Title is required.');
                            return;
                        }

                        item.label = newTitle;
                        item.fields = {
                            Title: newTitle,
                            Description: newDescription
                        };

                        workitemsProvider.refresh();
                        panel.dispose();
                    }
                },
                undefined,
                context.subscriptions
            );
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.editFeature', async (id) => {
            const item = findWorkitemById(id, workitemsData);
            if (!item) {
                vscode.window.showErrorMessage(`Feature with ID ${id} not found.`);
                return;
            }

            const newTitle = await vscode.window.showInputBox({
                prompt: `Edit title for Feature: ${item.label}`,
                value: item.label,
            });

            if (!newTitle) return;

            item.label = newTitle;
            workitemsProvider.refresh();

            vscode.window.showInformationMessage(`Feature title updated to: ${newTitle}`);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.editStory', async (id) => {
            const item = findWorkitemById(id, workitemsData);
            if (!item) {
                vscode.window.showErrorMessage(`Story with ID ${id} not found.`);
                return;
            }

            const newTitle = await vscode.window.showInputBox({
                prompt: `Edit title for Story: ${item.label}`,
                value: item.label,
            });

            if (!newTitle) return;

            item.label = newTitle;
            workitemsProvider.refresh();

            vscode.window.showInformationMessage(`Story title updated to: ${newTitle}`);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.showDetails', async (item) => {
            vscode.window.showInformationMessage(`Details for ${item.type}: ${item.label}`);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.generateStories', async (item) => {
            if (!item || item.type !== 'feature') {
                vscode.window.showErrorMessage('Please select a feature to generate stories.');
                return;
            }

            for (let i = 0; i < 5; i++) {
                const randomId = Math.floor(Math.random() * 10000);
                const title = `STORY-${randomId}`;
                const uniqueId = `${item.id}-${randomId}-${Date.now()}`; // Ensure unique ID
                const newStory = new WorkitemTreeItem(title, vscode.TreeItemCollapsibleState.None, 'story', uniqueId, []);
                item.children.push(newStory);
            }

            item.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed; // Update collapsible state
            workitemsProvider.refresh();
            vscode.window.showInformationMessage('5 random stories generated successfully.');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.addFeatureOrSolutionIntent', async (item) => {
            const choice = await vscode.window.showQuickPick([
                { label: 'Feature', description: 'Add a Feature under this Epic' },
                { label: 'Solution Intent', description: 'Add a Solution Intent under this Epic' }
            ], {
                placeHolder: 'Select the type of item to add'
            });

            if (!choice) return;

            const title = await vscode.window.showInputBox({ prompt: `Enter ${choice.label} Title for ${item.label}` });
            if (!title) return;

            const newItem = new WorkitemTreeItem(
                title,
                choice.label === 'Feature' ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
                choice.label.toLowerCase().replace(' ', '-'),
                []
            );

            item.children.push(newItem);
            item.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            workitemsProvider.refresh();
        })
    );

    function findWorkitemById(id, items) {
        for (const item of items) {
            if (item.id === id) {
                return item;
            }
            if (item.children && item.children.length > 0) {
                const found = findWorkitemById(id, item.children);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    }

    function getEpicWebviewContent(title, description) {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Edit Epic</title>
            <style>
                body {
                    padding: 20px;
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                }
                label {
                    display: block;
                    margin: 12px 0 6px;
                }
                input, textarea {
                    width: 100%;
                    padding: 8px;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    box-sizing: border-box;
                }
                textarea {
                    min-height: 140px;
                }
                button {
                    margin-top: 12px;
                    padding: 8px 16px;
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
            <h2>Edit Epic</h2>
            <label for="title">Title</label>
            <input id="title" type="text" value="${title.replace(/"/g, '&quot;')}" />

            <label for="description">Description</label>
            <textarea id="description">${description}</textarea>

            <button id="save">Save</button>

            <script>
                const vscode = acquireVsCodeApi();
                document.getElementById('save').addEventListener('click', () => {
                    const title = document.getElementById('title').value;
                    const description = document.getElementById('description').value;
                    vscode.postMessage({ command: 'save', title, description });
                });
            </script>
        </body>
        </html>`;
    }

    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.editSolutionIntent', async (id) => {
            const item = findWorkitemById(id, workitemsData);
            if (!item) {
                vscode.window.showErrorMessage(`Solution Intent with ID ${id} not found.`);
                return;
            }

            const newTitle = await vscode.window.showInputBox({
                prompt: `Edit title for Solution Intent: ${item.label}`,
                value: item.label,
            });

            if (!newTitle) return;

            item.label = newTitle;
            workitemsProvider.refresh();

            vscode.window.showInformationMessage(`Solution Intent title updated to: ${newTitle}`);
        })
    );
}

module.exports = registerAddCommands;
