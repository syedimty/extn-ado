const vscode = require('vscode');
const useStore = require('../store/stateManager');

function registerAddCommands(context, workitemsProvider) {
    // Add Epic
    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.addEpic', async () => {
            // Create Epic with default fields
            const epicId = useStore.getState().createItem({
                type: 'epic',
                fields: { Title: 'New Epic', Description: '' }
            });
            workitemsProvider.refresh();
        })
    );

    // Add Feature
    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.addFeature', async (item) => {
            // Only allow Feature under Epic
            const parent = useStore.getState().getItem(item.id);
            if (!parent || parent.type !== 'epic') {
                vscode.window.showErrorMessage('Features can only be added under Epics.');
                return;
            }
            const title = await vscode.window.showInputBox({ prompt: `Enter Feature Title for ${item.label}` });
            if (!title) {
                vscode.window.showErrorMessage('Feature Title cannot be empty.');
                return;
            }
            useStore.getState().createItem({
                type: 'feature',
                parentId: item.id,
                fields: { Title: title, Description: '' }
            });
            workitemsProvider.refresh();
        })
    );

    // Add Story
    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.addUserStory', async (item) => {
            // Only allow Story under Feature
            const parent = useStore.getState().getItem(item.id);
            if (!parent || parent.type !== 'feature') {
                vscode.window.showErrorMessage('Stories can only be added under Features.');
                return;
            }
            const title = await vscode.window.showInputBox({ prompt: `Enter User Story Title for ${item.label}` });
            if (!title) {
                vscode.window.showErrorMessage('Story Title cannot be empty.');
                return;
            }
            useStore.getState().createItem({
                type: 'story',
                parentId: item.id,
                fields: { Title: title, AcceptanceCriteria: '', Description: '' }
            });
            workitemsProvider.refresh();
        })
    );


    // Delete Item
    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.deleteItem', async (item) => {
            const confirm = await vscode.window.showWarningMessage(
                `Are you sure you want to delete ${item.type}: ${item.label}?`,
                { modal: true },
                'Delete'
            );
            if (confirm !== 'Delete') return;
            useStore.getState().deleteItem(item.id);
            workitemsProvider.refresh();
        })
    );

    // Add Feature or Solution Intent (Epic Inline Option)
    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.addFeatureOrSolutionIntent', async (item) => {
            const parent = useStore.getState().getItem(item.id);
            if (!parent || parent.type !== 'epic') {
                vscode.window.showErrorMessage('You can only add Features or Solution Intents under Epics.');
                return;
            }
            const choice = await vscode.window.showQuickPick([
                { label: 'Feature', description: 'Add a Feature under this Epic' },
                { label: 'Solution Intent', description: 'Add a Solution Intent under this Epic' }
            ], {
                placeHolder: 'Select the type of item to add'
            });
            if (!choice) return;
            let fields = {};
            let type = '';
            if (choice.label === 'Feature') {
                type = 'feature';
                fields = { Title: 'New Feature', Description: '' };
            } else {
                type = 'solution-intent';
                fields = { Title: 'New Solution Intent', InitiativeBackground: '', SolutionBackOrHighLevelRequirement: '' };
            }
            useStore.getState().createItem({
                type,
                parentId: item.id,
                fields
            });
            workitemsProvider.refresh();
        })
    );

    // Generate Features (Epic Inline Option)
    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.generateFeatures', async (item) => {
            const parent = useStore.getState().getItem(item.id);
            if (!parent || parent.type !== 'epic') {
                vscode.window.showErrorMessage('You can only generate Features under Epics.');
                return;
            }
            for (let i = 0; i < 5; i++) {
                const randomNum = Math.floor(Math.random() * 10000);
                useStore.getState().createItem({
                    type: 'feature',
                    parentId: item.id,
                    fields: { Title: `FEATURE-${randomNum}`, Description: '' }
                });
            }
            workitemsProvider.refresh();
        })
    );

    // Add Story (Feature Inline Option)
    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.addStory', async (item) => {
            const parent = useStore.getState().getItem(item.id);
            if (!parent || parent.type !== 'feature') {
                vscode.window.showErrorMessage('You can only add Stories under Features.');
                return;
            }
            useStore.getState().createItem({
                type: 'story',
                parentId: item.id,
                fields: { Title: 'New Story', AcceptanceCriteria: '', Description: '' }
            });
            workitemsProvider.refresh();
        })
    );

    // Generate Stories (Feature Inline Option)
    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.generateStories', async (item) => {
            const parent = useStore.getState().getItem(item.id);
            if (!parent || parent.type !== 'feature') {
                vscode.window.showErrorMessage('You can only generate Stories under Features.');
                return;
            }
            for (let i = 0; i < 5; i++) {
                const randomNum = Math.floor(Math.random() * 10000);
                useStore.getState().createItem({
                    type: 'story',
                    parentId: item.id,
                    fields: { Title: `STORY-${randomNum}`, AcceptanceCriteria: '', Description: '' }
                });
            }
            workitemsProvider.refresh();
        })
    );

    // Edit Epic
    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.editEpic', async (id) => {
            const item = useStore.getState().getItem(id);
            if (!item || item.type !== 'epic') {
                vscode.window.showErrorMessage('Epic not found.');
                return;
            }
            const panel = vscode.window.createWebviewPanel(
                'editEpic',
                'Edit Epic',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );
            panel.webview.html = getEditWebviewContent('Epic', item.fields);
            panel.webview.onDidReceiveMessage(
                (message) => {
                    if (message.command === 'save') {
                        const { Title, Description } = message.fields;
                        if (!Title || Title.trim() === '') {
                            vscode.window.showErrorMessage('Title is required.');
                            return;
                        }
                        useStore.getState().updateItemFields(id, { Title, Description });
                        // Recalculate isComplete
                        useStore.getState().updateItemStatus(id, { isComplete: Title.trim() !== '' && Description.trim() !== '' });
                        workitemsProvider.refresh();
                        panel.dispose();
                    }
                },
                undefined,
                context.subscriptions
            );
        })
    );

    // Edit Feature
    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.editFeature', async (id) => {
            const item = useStore.getState().getItem(id);
            if (!item || item.type !== 'feature') {
                vscode.window.showErrorMessage('Feature not found.');
                return;
            }
            const panel = vscode.window.createWebviewPanel(
                'editFeature',
                'Edit Feature',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );
            panel.webview.html = getEditWebviewContent('Feature', item.fields);
            panel.webview.onDidReceiveMessage(
                (message) => {
                    if (message.command === 'save') {
                        const { Title, Description } = message.fields;
                        if (!Title || Title.trim() === '') {
                            vscode.window.showErrorMessage('Title is required.');
                            return;
                        }
                        useStore.getState().updateItemFields(id, { Title, Description });
                        useStore.getState().updateItemStatus(id, { isComplete: Title.trim() !== '' && Description.trim() !== '' });
                        workitemsProvider.refresh();
                        panel.dispose();
                    }
                },
                undefined,
                context.subscriptions
            );
        })
    );

    // Edit Story
    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.editStory', async (id) => {
            const item = useStore.getState().getItem(id);
            if (!item || item.type !== 'story') {
                vscode.window.showErrorMessage('Story not found.');
                return;
            }
            const panel = vscode.window.createWebviewPanel(
                'editStory',
                'Edit Story',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );
            panel.webview.html = getEditWebviewContent('Story', item.fields);
            panel.webview.onDidReceiveMessage(
                (message) => {
                    if (message.command === 'save') {
                        const { Title, AcceptanceCriteria, Description } = message.fields;
                        if (!Title || Title.trim() === '') {
                            vscode.window.showErrorMessage('Title is required.');
                            return;
                        }
                        useStore.getState().updateItemFields(id, { Title, AcceptanceCriteria, Description });
                        useStore.getState().updateItemStatus(id, { isComplete: Title.trim() !== '' && Description.trim() !== '' });
                        workitemsProvider.refresh();
                        panel.dispose();
                    }
                },
                undefined,
                context.subscriptions
            );
        })
    );

    // Edit Solution Intent
    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.editSolutionIntent', async (id) => {
            const item = useStore.getState().getItem(id);
            if (!item || item.type !== 'solution-intent') {
                vscode.window.showErrorMessage('Solution Intent not found.');
                return;
            }
            const panel = vscode.window.createWebviewPanel(
                'editSolutionIntent',
                'Edit Solution Intent',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );
            panel.webview.html = getEditWebviewContent('Solution Intent', item.fields);
            panel.webview.onDidReceiveMessage(
                (message) => {
                    if (message.command === 'save') {
                        const { Title, InitiativeBackground, SolutionBackOrHighLevelRequirement } = message.fields;
                        if (!Title || Title.trim() === '') {
                            vscode.window.showErrorMessage('Title is required.');
                            return;
                        }
                        useStore.getState().updateItemFields(id, { Title, InitiativeBackground, SolutionBackOrHighLevelRequirement });
                        useStore.getState().updateItemStatus(id, { isComplete: Title.trim() !== '' });
                        workitemsProvider.refresh();
                        panel.dispose();
                    }
                },
                undefined,
                context.subscriptions
            );
        })
    );

    // Helper: Generate webview HTML for editing
    function getEditWebviewContent(type, fields) {
        // Use Quill rich text editor for HTML fields
        let htmlFields = '';
        let quillInit = '';
        if (type === 'Epic' || type === 'Feature') {
            htmlFields = `
                <label for="description">Description</label>
                <div id="description" style="height:120px;"></div>
            `;
            quillInit = `
                var quillDescription = new Quill('#description', { theme: 'snow' });
                quillDescription.root.innerHTML = ${JSON.stringify(fields.Description || '')};
            `;
        } else if (type === 'Story') {
            htmlFields = `
                <label for="acceptance">Acceptance Criteria</label>
                <div id="acceptance" style="height:100px;"></div>
                <label for="description">Description</label>
                <div id="description" style="height:100px;"></div>
            `;
            quillInit = `
                var quillAcceptance = new Quill('#acceptance', { theme: 'snow' });
                quillAcceptance.root.innerHTML = ${JSON.stringify(fields.AcceptanceCriteria || '')};
                var quillDescription = new Quill('#description', { theme: 'snow' });
                quillDescription.root.innerHTML = ${JSON.stringify(fields.Description || '')};
            `;
        } else if (type === 'Solution Intent') {
            htmlFields = `
                <label for="initiative">Initiative Background</label>
                <div id="initiative" style="height:100px;"></div>
                <label for="solution">Solution Back or High Level Requirement</label>
                <div id="solution" style="height:100px;"></div>
            `;
            quillInit = `
                var quillInitiative = new Quill('#initiative', { theme: 'snow' });
                quillInitiative.root.innerHTML = ${JSON.stringify(fields.InitiativeBackground || '')};
                var quillSolution = new Quill('#solution', { theme: 'snow' });
                quillSolution.root.innerHTML = ${JSON.stringify(fields.SolutionBackOrHighLevelRequirement || '')};
            `;
        }
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Edit ${type}</title>
            <link href="https://cdn.jsdelivr.net/npm/quill@1.3.7/dist/quill.snow.css" rel="stylesheet">
            <style>
                body { padding: 20px; font-family: var(--vscode-font-family); color: var(--vscode-foreground); }
                label { display: block; margin: 12px 0 6px; }
                input { width: 100%; padding: 8px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); box-sizing: border-box; }
                .ql-container { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); }
                button { margin-top: 12px; padding: 8px 16px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; cursor: pointer; }
                button:hover { background: var(--vscode-button-hoverBackground); }
            </style>
        </head>
        <body>
            <h2>Edit ${type}</h2>
            <label for="title">Title</label>
            <input id="title" type="text" value="${fields.Title ? fields.Title.replace(/"/g, '&quot;') : ''}" />
            ${htmlFields}
            <button id="save">Save</button>
            <script src="https://cdn.jsdelivr.net/npm/quill@1.3.7/dist/quill.min.js"></script>
            <script>
                const vscode = acquireVsCodeApi();
                ${quillInit}
                document.getElementById('save').addEventListener('click', () => {
                    const Title = document.getElementById('title').value;
                    let fields = { Title };
                    if (window.quillDescription) fields.Description = quillDescription.root.innerHTML;
                    if (window.quillAcceptance) fields.AcceptanceCriteria = quillAcceptance.root.innerHTML;
                    if (window.quillInitiative) fields.InitiativeBackground = quillInitiative.root.innerHTML;
                    if (window.quillSolution) fields.SolutionBackOrHighLevelRequirement = quillSolution.root.innerHTML;
                    vscode.postMessage({ command: 'save', fields });
                });
            </script>
        </body>
        </html>`;
    }
}
module.exports = registerAddCommands;
