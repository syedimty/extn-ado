// This module provides mock data for work items.

const vscode = require('vscode');
const WorkitemTreeItem = require('../providers/WorkitemTreeItem');

const workitems = [
    new WorkitemTreeItem('Epic 1', undefined, 'epic', '1', [
        new WorkitemTreeItem('Feature 1.1 $(error)', undefined, 'feature', '1.1', [
            new WorkitemTreeItem('Story 1.1.1', undefined, 'story', '1.1.1', [])
        ]),
        new WorkitemTreeItem('Solution Intent 1.2', undefined, 'solution-intent', '1.2', [])
    ]),
    new WorkitemTreeItem('Epic 2', vscode.TreeItemCollapsibleState.None, 'epic', '2', [])
];

module.exports = workitems;