import express from 'express'

const healthcheckrouter = express.Router()

healthcheckrouter.get("/live", (req, res) => {
  res.status(200).json({
    status: "alive",
    uptime: process.uptime()
  });
});

export default healthcheckrouter;