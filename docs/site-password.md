# Site-password sign-in

The active login uses only a six-digit numeric site passcode. It never invokes WebAuthn, fingerprint, face recognition, or device-password prompts. First use requires creating and confirming exactly six digits on the keypad. Existing text passwords are verified once before replacement with a passcode. Profile settings provides Change site passcode; the current passcode is required.

A random salt and PBKDF2-SHA256 verifier (310,000 iterations) are stored locally, never the plaintext password. Five incorrect attempts trigger a 30-second retry delay. A separate tab-scoped password session gates application content. Previous device-unlock sessions do not grant access. Sign out removes the active session without removing the password, owner details, or bills.

The app remains browser-local. This is a convenience lock, not a server-authenticated account or encrypted database. The password and records do not synchronize across browsers. No password is embedded in source code or deployment configuration.
