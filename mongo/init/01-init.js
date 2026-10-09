/**
 * Runs once, on first boot of an empty data volume.
 * Creates the least-privilege application user from environment variables —
 * the app never connects as root.
 */
const appDb = process.env.APP_DB;
const user = process.env.APP_USER;
const pwd = process.env.APP_PASSWORD;

if (!appDb || !user || !pwd) {
  print('[init] APP_DB / APP_USER / APP_PASSWORD missing — skipping app user creation');
} else {
  const target = db.getSiblingDB(appDb);
  const existing = target.getUser(user);

  if (existing) {
    print(`[init] user "${user}" already exists on "${appDb}"`);
  } else {
    target.createUser({
      user,
      pwd,
      roles: [{ role: 'readWrite', db: appDb }],
    });
    print(`[init] created application user "${user}" on "${appDb}"`);
  }
}
