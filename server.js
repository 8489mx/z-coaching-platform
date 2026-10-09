/**
 * Root Server Entry Point Fallback
 * Seamlessly boots the unified Express server and SPA handler from src/api/server.js.
 * Ensures zero-config compatibility with platforms expecting server.js in root (e.g. Hostinger, Render, Heroku).
 */
import "./src/api/server.js";
