const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

/** `HomeinappMain` multer와 동일 — JSON 키 파일 디렉터리 */
const HOMEINAPP_FIREBASE_KEYS_DIR = path.resolve(__dirname, '../homeinappkeys');

// churchId -> firebase app instance
const firebaseApps = {};

function resolveKeyPath(rawKeyPath) {
  const keyPath = String(rawKeyPath || '').trim();
  if (!keyPath) {
    throw new Error('Firebase key path is required.');
  }

  if (path.isAbsolute(keyPath)) return keyPath;

  const normalized = keyPath.replace(/\\/g, '/');
  // DB에는 파일명만 저장. 상대 전체 경로(레거시)는 cwd 기준 유지.
  if (!normalized.includes('/')) {
    return path.resolve(HOMEINAPP_FIREBASE_KEYS_DIR, normalized);
  }
  return path.resolve(process.cwd(), normalized);
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
