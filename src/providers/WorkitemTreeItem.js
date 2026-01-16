const vscode = require('vscode');

class WorkitemTreeItem extends vscode.TreeItem {
    constructor(label, collapsibleState, type, id, children = [], description = '', iconPath = undefined) {
        super(label, collapsibleState);
        this.type = type;
        this.children = children;
        this.contextValue = type;
        this.id = id;
        this.resourceUri = vscode.Uri.parse(`workitems:/${type}/${id}`);
        this.description = description;
        if (iconPath) {
            this.iconPath = iconPath;
        } else {
            // Default icon by type
            if (type === 'epic') {
                this.iconPath = new vscode.ThemeIcon('project');
            } else if (type === 'feature') {
                this.iconPath = new vscode.ThemeIcon('package');
            } else if (type === 'story') {
                this.iconPath = new vscode.ThemeIcon('book');
            } else if (type === 'solution-intent') {
                this.iconPath = new vscode.ThemeIcon('database');
            }
        }
        // Set edit command by type
        if (type === 'epic') {
            this.command = { command: 'workitems-manager.editEpic', title: 'Edit Epic', arguments: [this.id] };
        } else if (type === 'feature') {
            this.command = { command: 'workitems-manager.editFeature', title: 'Edit Feature', arguments: [this.id] };
        } else if (type === 'story') {
            this.command = { command: 'workitems-manager.editStory', title: 'Edit Story', arguments: [this.id] };
        } else if (type === 'solution-intent') {
            this.command = { command: 'workitems-manager.editSolutionIntent', title: 'Edit Solution Intent', arguments: [this.id] };
        }
    }
}

module.exports = WorkitemTreeItem;
