import { DEFAULT_SETTINGS } from "./constants";
import { database } from "./data";
import { buildInitialTeams } from "./helpers";
import { getMongoDatabase } from "../mongodb";

const COLLECTION_NAME = "appState";
const APP_STATE_ID = "primary";

function cloneRecords(records) {
  return records.map((record) => ({ ...record }));
}

export function createSeedTaskTrackState() {
  const users = cloneRecords(database.users);
  const projects = cloneRecords(database.projects);

  return {
    users,
    teams: buildInitialTeams(users, projects),
    projects,
    tasks: cloneRecords(database.tasks),
    sessions: cloneRecords(database.sessions),
    notifications: cloneRecords(database.notifications),
    settings: { ...DEFAULT_SETTINGS },
  };
}

function normalizeTaskTrackState(state = {}) {
  const seedState = createSeedTaskTrackState();

  return {
    users: Array.isArray(state.users) ? state.users : seedState.users,
    teams: Array.isArray(state.teams) && state.teams.length ? state.teams : seedState.teams,
    projects: Array.isArray(state.projects) ? state.projects : seedState.projects,
    tasks: Array.isArray(state.tasks) ? state.tasks : seedState.tasks,
    sessions: Array.isArray(state.sessions) ? state.sessions : seedState.sessions,
    notifications: Array.isArray(state.notifications) ? state.notifications : seedState.notifications,
    settings: {
      ...DEFAULT_SETTINGS,
      ...(state.settings ?? {}),
    },
  };
}

export async function getTaskTrackState() {
  if (!process.env.MONGODB_URI) {
    return createSeedTaskTrackState();
  }

  try {
    const databaseClient = await getMongoDatabase();
    const collection = databaseClient.collection(COLLECTION_NAME);
    const existingState = await collection.findOne({ _id: APP_STATE_ID });

    if (!existingState) {
      const seedState = createSeedTaskTrackState();

      await collection.insertOne({
        _id: APP_STATE_ID,
        ...seedState,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return seedState;
    }

    return normalizeTaskTrackState(existingState);
  } catch (error) {
    console.error("TaskTrack MongoDB load failed:", error);
    return createSeedTaskTrackState();
  }
}

export async function saveTaskTrackState(nextState) {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  const normalizedState = normalizeTaskTrackState(nextState);
  const databaseClient = await getMongoDatabase();
  const collection = databaseClient.collection(COLLECTION_NAME);

  await collection.updateOne(
    { _id: APP_STATE_ID },
    {
      $set: {
        ...normalizedState,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  return normalizedState;
}
