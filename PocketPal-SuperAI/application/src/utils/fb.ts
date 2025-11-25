// Firebase disabled for privacy-first, local-only operation
// This is a stub to allow the app to run without Firebase dependencies

// Track initialization status
let isAppCheckInitialized = false;

export const initializeAppCheck = () => {
  if (isAppCheckInitialized) {
    return;
  }

  // Stub implementation - Firebase disabled
  console.warn('Firebase App Check is disabled in this build');
  isAppCheckInitialized = true;
};

// Get a fresh App Check token
export const getAppCheckToken = async () => {
  // Stub implementation - return null since Firebase is disabled
  console.warn('Firebase App Check is disabled - returning null token');
  return null;
};
