const vscode = require('vscode');

class WorkitemTreeItem extends vscode.TreeItem {
    constructor(label, collapsibleState, type, id, children = []) {
        
        super(label, children.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
        this.type = type;
        this.children = children;
        this.contextValue = type;
        this.id = id;

        // Set icon and command based on type
        if (type === 'epic') {
            this.iconPath = new vscode.ThemeIcon('project');
            this.command = { command: 'workitems-manager.editEpic', title: 'Edit Epic', arguments: [this] };
        } else if (type === 'feature') {
            this.iconPath = new vscode.ThemeIcon('package');
            this.command = { command: 'workitems-manager.editFeature', title: 'Edit Feature', arguments: [this] };
        } else if (type === 'story') {
            this.iconPath = new vscode.ThemeIcon('note');
            this.command = { command: 'workitems-manager.editStory', title: 'Edit Story', arguments: [this] };
        }

    }
}

module.exports = WorkitemTreeItem;
