# CRUD Plan for Type-Agnostic Store

## Summary of Requirements and Resolutions
- All CRUD actions operate only on the zustand store; legacy tree/array data is removed.
- IDs are always globally unique, alphanumeric (UUID v4 recommended).
- All required fields for each type are initialized to empty strings on creation; generated items get random titles if needed.
- The `status` field (`isLoading`, `isComplete`, `isError`) is always set and updated for system/UI logic only, never exported.
- Tree view decorations (spinner, warning, error) are based only on `status` values.
- Edit screens do not allow saving with empty Title.
- On major version change, all data is cleared and re-initialized; on minor change, only `isComplete` is recalculated.
- Parent-child relationships are not strictly enforced in code, but UI options prevent invalid relationships.
- Only hierarchy matters; child order is not important.

## Overview
This document outlines how to implement Create, Read, Update, and Delete operations for work items (Epic, Feature, Story, Solution Intent) using the new normalized, type-agnostic data structure.

## Data Model (Summary)
- `itemsById: { [id]: { id, type, fields, status, childIds[] } }`
- `parentById: { [id]: parentId | null }`
- `rootIds: [id]` (Epic IDs)
- `status: { isLoading, isComplete, isError }` (system-only; excluded from export)

## CRUD Operations

### Create
- Generate a unique alphanumeric `id` for each item.
- Insert the item into `itemsById` with its type, fields, status, and empty `childIds`.
- Set `parentById[id]` to the parent (or null for Epics).
- For Epics, add to `rootIds`. For others, add to parent’s `childIds`.

### Read
- Get item by id: `itemsById[id]`.
- Get children: `itemsById[parentId].childIds.map(id => itemsById[id])`.
- Get parent: `parentById[childId]` then `itemsById[parentId]`.
- Get root Epic from any child: traverse `parentById` chain until null.

### Update
- Update fields by id: merge into `itemsById[id].fields`.
- Update status by id: set `itemsById[id].status` (system-only).
- Rename/title change: update `fields["Title"]`.

### Delete
- Delete item by id: traverse descendants via `childIds`, remove all from `itemsById` and `parentById`.
- Remove item id from parent’s `childIds` or from `rootIds` if Epic.

## Validation
- No strict enforcement for parent-child mismatches, but UI should guide valid structure.

## Ordering
- Only hierarchy matters; order of children is not important.

## Persistence & Versioning
- Persist store to extension storage.
- Use `dataStructureVersion` to decide migrate vs clear:
  - Minor change: migrate.
  - Major change: clear and re-init.

## Export
- Exclude all system-defined fields (e.g., `status`).
- Export only user-defined fields and hierarchy.

## Epic CRUD Plan

### Create Epic
- User triggers "Add Epic" (no prompt for title).
- System generates a unique alphanumeric id.
- Epic is created with:
  - Title: "New Epic"
  - Description: (empty)
  - Status: isLoading: false, isComplete: false, isError: true (for warning)
  - Description field in tree: "Incomplete"
- Epic appears in tree with yellow warning indicator and "Incomplete" description.

### Edit Epic
- When user clicks any Epic, open a webview to edit Epic fields:
  - Title (text, required)
  - Description (html)
- On save:
  - Update Epic fields in store.
  - Remove warning indicator if all required fields are filled.
  - Update tree view.

### Delete Epic
- User can delete Epic from tree.
- All child Features, Stories, and Solution Intents are deleted recursively.

### Read Epic
- Tree view displays all Epics from rootIds.
- Each Epic shows its title, description, and status (warning if incomplete).

### Generate Features (Epic Inline Option)
- When triggered, automatically creates 5 Features under the selected Epic.
- Each Feature gets a random title (e.g., "FEATURE-1234").
- Each Feature's Description field is set to empty string "".
- All generated Features are children of the Epic.

### Add Feature or Solution Intent (Epic Inline Option)
- User triggers the command and is prompted to choose either "Feature" or "Solution Intent".
- System creates a new item of the selected type with all fields empty.
- Title is set to "New Feature" or "New Solution Intent" as appropriate.
- Item appears in the tree view under the selected Epic.
- User can click the item to open a webview and edit its fields.

### Add Story (Feature Inline Option)
- User triggers the command to add a Story under a Feature.
- System creates a new Story with all fields empty.
- Title is set to "New Story".
- Story appears in the tree view under the selected Feature.
- User can click the Story to open a webview and edit its fields.

### Generate Stories (Feature Inline Option)
- When triggered, automatically creates multiple Stories under the selected Feature.
- Each Story gets a default title (e.g., "STORY-1234") and all other fields empty.
- All generated Stories are children of the Feature.

## Migration & Implementation Plan

### 1. Remove Legacy Data Sources
- Delete or deprecate `workitemsData.js` and all direct mutations of tree arrays.
- Refactor all tree logic to use only the zustand store.

### 2. Refactor Zustand Store
- Update `stateManager.js` to use normalized, type-agnostic structure:
  - `itemsById`, `parentById`, `rootIds`, `status`, etc.
- Add UUID v4 generation for all new items.
- Ensure all required fields for each type are initialized to empty strings.

### 3. Refactor CRUD Commands
- Update all commands in `addCommands.js`:
  - CRUD actions should only interact with the zustand store.
  - Remove mutations of arrays/tree objects.
  - Generated items get random titles and empty fields.
  - Block saving if Title is empty.

### 4. Refactor Tree Provider
- Update `WorkitemsProvider.js`:
  - Build tree view by walking `rootIds` and `childIds` from the store.
  - Remove references to legacy arrays/tree objects.

### 5. Refactor Tree Item
- Update `WorkitemTreeItem.js`:
  - Construct tree items from store data.
  - Ensure `description` and `iconPath` reflect the `status` field (spinner, warning, error).
  - Use canonical type names.

### 6. Decorations and Status
- Refactor decoration logic in `extension.js`:
  - Decorations should be based only on `status` (`isLoading`, `isComplete`, `isError`).
  - Remove label/description-based decoration logic.

### 7. Versioning and Migration
- Implement versioning logic in the zustand store:
  - On major version change, clear all data and re-initialize.
  - On minor change, recalculate `isComplete` for all items.

### 8. Export Logic
- Implement export functionality:
  - Export only user-defined fields and hierarchy.
  - Exclude all system fields (`status`, etc.).

### 9. Parent-Child Relationships
- Ensure parent-child relationships are managed via `parentById` and `childIds` in the store.
- No strict enforcement in code, but UI should prevent invalid links.

### 10. Webview Implementation (VS Code Look & Feel)
- Create/refactor webview panels for editing each item type (Epic, Feature, Story, Solution Intent).
- Each webview should:
  - Use VS Code design tokens and styles for look and feel.
  - Display all required fields for the type.
  - Block saving if Title is empty.
  - On save, update the zustand store and recalculate status.
  - Show current values, allow editing, and reflect validation.
  - For HTML fields, use a proper rich text editor (e.g., TinyMCE, Quill, or similar) with HTML support.

### 11. Testing and Review
- Add tests or manual checks for:
  - Creating, editing, deleting all item types.
  - Status and decoration logic.
  - Versioning and migration.
  - Export output.
  - Webview usability and VS Code look and feel.
