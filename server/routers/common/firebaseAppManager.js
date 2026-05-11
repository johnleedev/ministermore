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

function getFirebaseAdmin(appName, keyPath) {
  const normalizedAppName = String(appName || '').trim();
  if (!normalizedAppName) {
    throw new Error('appName is required.');
  }
  if (firebaseApps[normalizedAppName]) {
    return firebaseApps[normalizedAppName];
  }

  const resolvedPath = resolveKeyPath(keyPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Firebase key file not found: ${resolvedPath}`);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
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
