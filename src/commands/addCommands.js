const vscode = require('vscode');
const WorkitemTreeItem = require('../providers/WorkitemTreeItem');
const workitemsData = require('../data/workitemsData');

function registerAddCommands(context, workitemsProvider) {
    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.addEpic', async () => {
            const title = await vscode.window.showInputBox({ prompt: 'Enter Epic Title', placeHolder: 'EPIC Title' });
            if (!title) return;

            const newEpic = new WorkitemTreeItem(title, vscode.TreeItemCollapsibleState.Collapsed, 'epic', []);
            workitemsData.push(newEpic);
            workitemsProvider.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.addFeature', async (item) => {
            const title = await vscode.window.showInputBox({ prompt: `Enter Feature Title for ${item.label}` });
            if (!title) return;

            const newFeature = new WorkitemTreeItem(title, vscode.TreeItemCollapsibleState.Collapsed, 'feature', []);
            item.children.push(newFeature);
            item.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed; // Update collapsible state for epic
            workitemsProvider.refresh();
        })
    );
    //this will 5 feature with random id as title like EPIC-RANDOMNUMBER
    context.subscriptions.push(vscode.commands.registerCommand('workitems-manager.generateFeatures', async (item) => {
        for (let i = 0; i < 5; i++) {
            const randomId = Math.floor(Math.random() * 10000);
            const title = `FEATURE-${randomId}`;
            const uniqueId = `${item.id}-${randomId}-${Date.now()}`; // Ensure unique ID for features
            const newFeature = new WorkitemTreeItem(title, vscode.TreeItemCollapsibleState.Collapsed, 'feature', uniqueId, []);
            item.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed; // Update collapsible state for epic
            item.children.push(newFeature);
        }
        workitemsProvider.refresh();
    }));

    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.addStory', async (item) => {
            const title = await vscode.window.showInputBox({ prompt: `Enter Story Title for ${item.label}` });
            if (!title) return;

            const newStory = new WorkitemTreeItem(title, vscode.TreeItemCollapsibleState.None, 'story', []);
            item.children.push(newStory);
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
            console.log('Deleting item:', JSON.stringify(item.toJSON()));

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
        vscode.commands.registerCommand('workitems-manager.editEpic', async (item) => {
            const newTitle = await vscode.window.showInputBox({
                prompt: `Edit title for Epic: ${item.label}`,
                value: item.label,
            });

            if (!newTitle) return;

            item.label = newTitle;
            workitemsProvider.refresh();

            vscode.window.showInformationMessage(`Epic title updated to: ${newTitle}`);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('workitems-manager.editFeature', async (item) => {
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
        vscode.commands.registerCommand('workitems-manager.editStory', async (item) => {
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
}

module.exports = registerAddCommands;
