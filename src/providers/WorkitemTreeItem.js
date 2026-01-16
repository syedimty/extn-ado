const vscode = require('vscode');

class WorkitemTreeItem extends vscode.TreeItem {
    constructor(label, collapsibleState, type, id, children = []) {
        
        super(label, children.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
        this.type = type;
        this.children = children;
        this.contextValue = type;
        this.id = id;
        this.resourceUri = vscode.Uri.parse(`workitems:/${type}/${id}`);

        this.description = 'Incomplete';

        // Set icon and command based on type
        if (type === 'epic') {
            this.iconPath = new vscode.ThemeIcon('project');
            this.command = { command: 'workitems-manager.editEpic', title: 'Edit Epic', arguments: [this.id] };
        } else if (type === 'feature') {
            this.iconPath = new vscode.ThemeIcon('package');
            this.command = { command: 'workitems-manager.editFeature', title: 'Edit Feature', arguments: [this.id] };
        } else if (type === 'story') {
            this.iconPath = new vscode.ThemeIcon('book');
            this.command = { command: 'workitems-manager.editStory', title: 'Edit Story', arguments: [this.id] };
        } else if (type === 'solution-intent') {
            this.iconPath = new vscode.ThemeIcon('database');
            this.command = { command: 'workitems-manager.editSolutionIntent', title: 'Edit Solution Intent', arguments: [this.id] };
        }

    }
}

module.exports = WorkitemTreeItem;
