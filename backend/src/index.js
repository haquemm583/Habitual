/*
  index.js

  sets up the backend server and routes

  created by: CJ Quintero
  created on: 11/07/2026
*/
import express from 'express'

const app = express();
const port = process.env.PORT || 3000

// simple health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// run the app
app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
