const { createStore } = require('zustand/vanilla');
const { immer } = require('zustand/middleware/immer');

// Define the initial state
const initialState = {
  epics: [],
  userStories: [],
  solutionIntents: [],
  features: [],
};

// Create the zustand vanilla store (no React dependency)
const store = createStore(
  immer((set) => ({
    ...initialState,

    // Actions
    addEpic: (epic) =>
      set((state) => {
        state.epics.push(epic);
      }),

    addUserStory: (userStory) =>
      set((state) => {
        state.userStories.push(userStory);
      }),

    addSolutionIntent: (solutionIntent) =>
      set((state) => {
        state.solutionIntents.push(solutionIntent);
      }),

    addFeature: (feature) =>
      set((state) => {
        state.features.push(feature);
      }),

    resetState: () => set(() => initialState),
  }))
);

module.exports = store;