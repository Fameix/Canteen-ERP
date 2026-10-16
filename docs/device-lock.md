> Superseded: the active app now uses only site-password sign-in. See site-password.md. Device-unlock code is no longer imported by the login or content gate.

# Native device unlock

Login uses only a platform passkey with user verification required. There is no website PIN, email, or password form. The device chooses fingerprint, face recognition, or its own screen-lock passcode/password; websites cannot select a specific biometric method or read the device password.

First use registers this browser/device through the operating-system prompt. Existing registered credentials continue to work. Legacy website-PIN hashes are removed from the device-lock record without changing credentials, hotel details, or bills.

Assertions are verified against a fresh challenge, stored public key, origin, RP hash, and user-presence/user-verification flags. App content requires a tab-scoped unlocked session. Sign out clears the session while retaining the registered device. Unsupported browsers show an explanation and do not bypass the lock.

This remains a browser-local convenience lock, not a server account or encrypted database. Data does not synchronize between devices. Clearing site storage removes saved local data and the local public-key registration. No device passwords or biometric measurements are stored by the app.
