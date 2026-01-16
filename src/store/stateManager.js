const { createStore } = require('zustand/vanilla');
const { immer } = require('zustand/middleware/immer');
const { v4: uuidv4 } = require('uuid');

// Initial state for normalized, type-agnostic store
const DATA_STRUCTURE_VERSION = {
  major: 1,
  minor: 0,
};
const initialState = {
  itemsById: {},
  parentById: {},
  rootIds: [],
  dataStructureVersion: `${DATA_STRUCTURE_VERSION.major}.${DATA_STRUCTURE_VERSION.minor}`,
};

// Helper: check if item is complete (all required fields non-empty)
function isItemComplete(item) {
  if (!item || !item.fields) return false;
  return Object.values(item.fields).every(v => typeof v === 'string' ? v.trim() !== '' : true);
}

// Helper: get default fields for each type
function getDefaultFields(type) {
  switch (type) {
    case 'epic':
      return { Title: '', Description: '' };
    case 'feature':
      return { Title: '', Description: '' };
    case 'solution-intent':
      return { Title: '', InitiativeBackground: '', SolutionBackOrHighLevelRequirement: '' };
    case 'story':
      return { Title: '', AcceptanceCriteria: '', Description: '' };
    default:
      return { Title: '' };
  }
}

// Helper: get default status
function getDefaultStatus() {
  return { isLoading: false, isComplete: false, isError: false };
}

const store = createStore(
  immer((set, get) => ({
    ...initialState,

    // Versioning and migration logic
    checkAndMigrateVersion: (persistedVersion) => {
      const currentVersion = `${DATA_STRUCTURE_VERSION.major}.${DATA_STRUCTURE_VERSION.minor}`;
      if (!persistedVersion) {
        // No persisted version, treat as fresh
        set(() => ({ ...initialState }));
        return 'initialized';
      }
      const [persistedMajor, persistedMinor] = persistedVersion.split('.').map(Number);
      if (persistedMajor !== DATA_STRUCTURE_VERSION.major) {
        // Major version change: clear all data
        set(() => ({ ...initialState }));
        return 'cleared';
      } else if (persistedMinor !== DATA_STRUCTURE_VERSION.minor) {
        // Minor version change: recalculate isComplete for all items
        set((state) => {
          Object.values(state.itemsById).forEach(item => {
            item.status.isComplete = isItemComplete(item);
          });
          state.dataStructureVersion = currentVersion;
        });
        return 'migrated';
      }
      // No change needed
      return 'unchanged';
    },

    // Create item
    createItem: ({ type, parentId = null, fields = {} }) => {
      const id = uuidv4();
      const defaultFields = getDefaultFields(type);
      const itemFields = { ...defaultFields, ...fields };
      const status = getDefaultStatus();
      const item = { id, type, fields: itemFields, status, childIds: [] };

      set((state) => {
        state.itemsById[id] = item;
        state.parentById[id] = parentId;
        if (parentId) {
          state.itemsById[parentId].childIds.push(id);
        } else if (type === 'epic') {
          state.rootIds.push(id);
        }
      });
      return id;
    },

    // Read item
    getItem: (id) => {
      return get().itemsById[id] || null;
    },

    // Update item fields
    updateItemFields: (id, fields) => {
      set((state) => {
        if (state.itemsById[id]) {
          Object.assign(state.itemsById[id].fields, fields);
        }
      });
    },

    // Update item status
    updateItemStatus: (id, status) => {
      set((state) => {
        if (state.itemsById[id]) {
          Object.assign(state.itemsById[id].status, status);
        }
      });
    },

    // Delete item (and descendants)
    deleteItem: (id) => {
      set((state) => {
        function deleteRecursive(itemId) {
          const item = state.itemsById[itemId];
          if (!item) return;
          // Delete children first
          item.childIds.forEach(deleteRecursive);
          // Remove from parent
          const parentId = state.parentById[itemId];
          if (parentId && state.itemsById[parentId]) {
            state.itemsById[parentId].childIds = state.itemsById[parentId].childIds.filter(cid => cid !== itemId);
          }
          // Remove from rootIds if Epic
          if (item.type === 'epic') {
            state.rootIds = state.rootIds.filter(rid => rid !== itemId);
          }
          // Delete item and parent link
          delete state.itemsById[itemId];
          delete state.parentById[itemId];
        }
        deleteRecursive(id);
      });
    },

    // Reset state (for major version change)
    resetState: () => set(() => ({ ...initialState })),

    // Export logic (exclude all system fields)
    exportData: () => {
      const { itemsById, parentById, rootIds } = get();
      // Only export id, type, fields, childIds (no status or system fields)
      const exportedItems = {};
      Object.entries(itemsById).forEach(([id, item]) => {
        exportedItems[id] = {
          id: item.id,
          type: item.type,
          fields: { ...item.fields },
          childIds: [...item.childIds],
        };
      });
      return {
        itemsById: exportedItems,
        parentById: { ...parentById },
        rootIds: [...rootIds],
      };
    },
  }))
);

module.exports = store;