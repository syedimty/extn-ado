const vscode = require('vscode');
const WorkitemTreeItem = require('./WorkitemTreeItem');
const useStore = require('../store/stateManager');

class WorkitemsProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        const state = useStore.getState();
        if (!element) {
            // Root level: return Epics
            return state.rootIds.map(id => this._buildTreeItem(id));
        }
        // Children: return childIds for this element
        const item = state.itemsById[element.id];
        if (!item || !item.childIds) return [];
        return item.childIds.map(cid => this._buildTreeItem(cid));
    }

    _buildTreeItem(id) {
        const state = useStore.getState();
        const item = state.itemsById[id];
        if (!item) return null;
        // Description and iconPath based on status
        let description = '';
        let iconPath = undefined;
        if (item.status.isLoading) {
            description = 'Loading...';
            iconPath = new vscode.ThemeIcon('sync~spin');
        } else if (item.status.isError) {
            description = 'Incomplete';
            iconPath = new vscode.ThemeIcon('warning');
        } else if (item.status.isComplete) {
            description = 'Complete';
            iconPath = new vscode.ThemeIcon('check');
        }
        // Use canonical type names
        return new WorkitemTreeItem(
            item.fields.Title || item.type,
            item.childIds.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
            item.type,
            item.id,
            [],
            description,
            iconPath
        );
    }
}

module.exports = WorkitemsProvider;