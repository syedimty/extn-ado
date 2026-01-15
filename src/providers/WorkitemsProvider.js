const vscode = require('vscode');
const WorkitemTreeItem = require('./WorkitemTreeItem');
const workitemsData = require('../data/workitemsData');

class WorkitemsProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.workitems = workitemsData; // Initialize with data from workitemsData.js
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        if (!element) {
            return this.workitems;
        }
        return element.children;
    }

    addWorkitem(label, type, id) {
        const newItem = new WorkitemTreeItem(label, vscode.TreeItemCollapsibleState.None, type, id);
        this.workitems.push(newItem);
        this.refresh();
    }

    deleteWorkitem(id) {
        this.workitems = this.workitems.filter(item => item.id !== id);
        this.refresh();
    }
}

module.exports = WorkitemsProvider;