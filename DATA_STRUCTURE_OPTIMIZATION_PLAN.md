# Data Structure Optimization Plan

## Summary of Requirements and Resolutions
- Single source of truth: zustand store only (except persistence).
- IDs are globally unique, alphanumeric (UUID v4 recommended).
- All required fields for each type are initialized to empty strings on creation.
- `status` field is system-only, used for UI logic, not exported.
- Tree view decorations are based only on `status`.
- Edit screens require non-empty Title to save.
- Major version change clears all data; minor change recalculates `isComplete` only.
- Parent-child relationships are not strictly enforced, but UI prevents invalid links.
- Only hierarchy matters; child order is not important.

## Goal
Document the current data structures and access patterns, then identify optimization opportunities and migration steps.

## Plan
1) Inventory current data sources and shapes
2) Map current access patterns and mutations
3) Identify bottlenecks and inconsistencies
4) Propose optimized structure options
5) Evaluate tradeoffs and migration steps

## Current State (Recorded)

### Data Sources
- `src/data/workitemsData.js`: In-memory array of `WorkitemTreeItem` objects representing the tree.
- `src/store/stateManager.js`: Zustand vanilla store with separate arrays for `epics`, `userStories`, `solutionIntents`, and `features`.

### Work Item Shape
Defined by `WorkitemTreeItem` in `src/providers/WorkitemTreeItem.js`:
- `label` (string)
- `type` (epic | feature | story | solution-intent)
- `id` (alphanumeric, generated, globally unique)
- `children` (array of `WorkitemTreeItem`)
- `contextValue` (string)
- `description` (string, currently “Incomplete”)
- `iconPath`, `command`
- `resourceUri` (used for file decorations)

### Work Item Types (Current)
- Epic
- Feature
- Story
- Solution Intent

Note: Store and display type names exactly as above (case and spacing preserved).

### Current Assumption (Concrete)
- Epic is always the parent node.

### Fixed Hierarchy (Current)
- Feature should always be child of Epic.
- Solution Intent should always be child of Epic.
- Story should always be child of Feature.

### Per-Type Fields (Current Draft)
Each type can have its own fields; not all types share the same set.

#### Epic
- Title -> text
- Description -> html

#### Feature
- Title -> text
- Description -> html

#### Solution Intent
- Title -> text
- Initiative Background -> html
- Solution Back or High Level Requirement -> html

#### Story
- Title -> text
- Acceptance Criteria -> html
- Description -> html

## Improvement Proposal: Type-Agnostic, Normalized Structure

### Goals
- Avoid adding new top-level arrays per type (type-agnostic storage).
- $O(1)$ lookup by `id` for any type.
- Easy subtree deletion (delete parent + all descendants).
- Easy parent lookup from any child.
- Single source of truth: data lives only in the zustand store (except persistence).

### Proposed State Shape (Normalized)
```text
itemsById: { [id]: { id, type, fields, childIds[] } }
parentById: { [id]: parentId | null }
rootIds: [id]  // top-level epics
typeIndex: { [type]: Set<id> }  // optional for fast type filtering
```

Note: Order is not important; child lists do not need stable ordering.

### How It Solves Requirements
- **Type-agnostic**: all items stored in `itemsById`; no `epics[]`, `features[]`, etc.
- **Fast lookup**: `itemsById[id]` is constant time.
- **Fast update by id**: update any item in constant time via `itemsById[id]`.
- **Delete parent + children**: DFS/BFS from parent using `childIds`, remove entries from `itemsById`, `parentById`, and `typeIndex`.
- **Find parent from child**: `parentById[childId]` is constant time; traverse parent→parent→parent to reach the ultimate parent.

### Per-Type Fields (Flexible)
Store fields inside `fields`, which can vary by type:
```text
itemsById[id] = {
	id,
	type: 'epic' | 'feature' | 'story' | 'solution-intent' | ...,
	status: { isLoading: boolean, isComplete: boolean, isError: boolean },
	fields: { ...typeSpecificFields },
	childIds: []
}
```

Note: `status` values are system-generated only and should be ignored in export output. Export should exclude all system-defined fields (e.g., `status`).

### Migration Notes (Later)
- Convert existing tree (`workitemsData`) into normalized maps.
- Update commands to read/write `itemsById` and `childIds`.
- Generate tree view by walking `rootIds` and `childIds`.

### Persistence + Versioning (Decision)
- Persist extension data by default (survive restarts).
- Introduce a hardcoded `dataStructureVersion` in code.
- Versioning rules:
	- **Minor**: adding new properties (non-breaking).
	- **Major**: renaming or deleting properties (breaking).
- On **minor** version change: migrate existing data.
- On **major** version change: clear all stored data and re-initialize with defaults.

### Tree Provider
`src/providers/WorkitemsProvider.js`:
- Holds `this.workitems` initialized from `workitemsData`.
- `getChildren()` returns root or children based on node.
- `refresh()` fires change event.

### Commands (Access + Mutation)
`src/commands/addCommands.js`:
- `addEpic`: Adds to `workitemsData` and store, refreshes tree, then clears spinner.
- `addFeature` / `addSolutionIntent` / `addUserStory`: Currently add to zustand only (no tree insertion).
- `addFeatureOrSolutionIntent`, `generateFeatures`, `generateStories`: mutate `workitemsData` tree directly.
- `deleteItem`, `editEpic`, `editFeature`, `editStory`, `editSolutionIntent`: mutate `workitemsData`.

### View Decorations
`extension.js`:
- File decoration provider shows a warning badge for Epic 2 (via `resourceUri`).

## Observations (Potential Issues)
- Two sources of truth: `workitemsData` (tree) and zustand arrays (flat). They diverge easily.
- Some commands only update the store, others only update the tree.
- IDs are mixed types (number/string) and not guaranteed unique across levels.
- Children relationships are nested in tree but not linked in the store arrays.

## Next Step (Discussion Topics)
- Choose a single source of truth (tree or normalized store).
- If normalized: use a single `itemsById` map + `rootIds` + `childrenById`.
- Define consistent ID strategy (e.g., UUID).
- Sync and migrate commands to a unified data layer.
