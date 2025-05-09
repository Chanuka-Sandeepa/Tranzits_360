import express from 'express';
import { getAllClients, getClientCount } from './client-manager.js';
import { getAllLocations, getLocationByClientId } from './location-handler.js';

const router = express.Router();

router.get('/status', (req, res) => {
  try {
    res.json({
      status: 'active',
      clientCount: getClientCount(),
      clients: getAllClients().map(({ id, connectedAt, metadata }) => ({
        id,
        connectedAt,
        lastActivity: metadata.lastActivity || connectedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch WebSocket status' });
  }
});

router.get('/locations', (req, res) => {
  res.json(getAllLocations());
});

router.get('/locations/:clientId', (req, res) => {
  const location = getLocationByClientId(req.params.clientId);
  if (!location) return res.status(404).json({ message: 'Location not found' });
  res.json(location);
});

export default router;
