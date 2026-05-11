const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

// churchId -> firebase app instance
const firebaseApps = {};

function resolveKeyPath(rawKeyPath) {
  const keyPath = String(rawKeyPath || '').trim();
  if (!keyPath) {
    throw new Error('Firebase key path is required.');
  }

  // Allow both absolute path and project-relative path.
  if (path.isAbsolute(keyPath)) return keyPath;
  return path.resolve(process.cwd(), keyPath);
}

function getFirebaseAdmin(churchId, keyPath) {
  const appName = String(churchId || '').trim();
  if (!appName) {
    throw new Error('churchId is required.');
  }

  if (firebaseApps[appName]) {
    return firebaseApps[appName];
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
    appName
  );

  firebaseApps[appName] = app;
  return app;
}

async function clearFirebaseAdmin(churchId) {
  const appName = String(churchId || '').trim();
  if (!appName || !firebaseApps[appName]) return;

  try {
    await firebaseApps[appName].delete();
  } catch (error) {
    // Ignore deletion errors and force cache cleanup.
  }
  delete firebaseApps[appName];
}

module.exports = {
  clearFirebaseAdmin,
  getFirebaseAdmin,
};
