// Shared teardown for node:test files that open the Sequelize pool.
//
// Importing this file registers a file-level after() hook that closes the
// shared pool, so the test child process can exit once its tests finish.
// Files whose tests all pass but never close the pool hang the whole
// `node --test` run forever (the runner waits for the child to exit);
// this is the fix for that class of hang.
//
// Safe to import in a file that never opens the pool: close() on an
// unused pool resolves immediately. Safe alongside a file's own close()
// call: closing an already-closed pool resolves as well.
import { after } from "node:test";
import sequelize from "../src/api/config/database.js";

after(async () => {
  await sequelize.close().catch(() => {});
});
