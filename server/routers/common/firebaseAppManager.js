const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

const firebaseApps = {};

function resolveKeyPath(rawKeyPath) {
  const keyPath = String(rawKeyPath || '').trim();
  if (!keyPath) {
    throw new Error('Firebase key path is required.');
  }
  if (path.isAbsolute(keyPath)) return keyPath;
  return path.resolve(process.cwd(), keyPath);
}

function parseServiceAccountJson(rawServiceAccountJson) {
  const jsonText = String(rawServiceAccountJson || '').trim();
  if (!jsonText) {
    throw new Error('Firebase service account JSON is required.');
  }
  return JSON.parse(jsonText);
}

function loadServiceAccount(options = {}) {
  const { keyPath, serviceAccountJson } = options;
  if (serviceAccountJson != null && String(serviceAccountJson).trim()) {
    return parseServiceAccountJson(serviceAccountJson);
  }
  const resolvedPath = resolveKeyPath(keyPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Firebase key file not found: ${resolvedPath}`);
  }
  return JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
}

function getFirebaseAdmin(appName, keyPathOrOptions) {
  const normalizedAppName = String(appName || '').trim();
  if (!normalizedAppName) {
    throw new Error('appName is required.');
  }
  if (firebaseApps[normalizedAppName]) {
    return firebaseApps[normalizedAppName];
  }

  const options =
    typeof keyPathOrOptions === 'string'
      ? { keyPath: keyPathOrOptions }
      : keyPathOrOptions || {};
  const serviceAccount = loadServiceAccount(options);
  const app = admin.initializeApp(
    {
      credential: admin.credential.cert(serviceAccount),
    },
    normalizedAppName
  );

  firebaseApps[normalizedAppName] = app;
  return app;
}

async function clearFirebaseAdmin(appName) {
  const normalizedAppName = String(appName || '').trim();
  if (!normalizedAppName || !firebaseApps[normalizedAppName]) return;
  try {
    await firebaseApps[normalizedAppName].delete();
  } catch (error) {
    // ignore deletion errors
  }
  delete firebaseApps[normalizedAppName];
}

module.exports = {
  getFirebaseAdmin,
  clearFirebaseAdmin,
};
