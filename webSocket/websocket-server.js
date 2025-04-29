import { WebSocketServer, WebSocket } from 'ws'; // Correctly import both WebSocketServer and WebSocket

// Store connected clients
const clients = new Map();

function initializeWebSocketServer(server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    const clientId = req.headers['sec-websocket-key'] || generateUniqueId();
    addClient(clientId, ws);
    console.log(`WebSocket client connected: ${clientId}`);

    ws.send(
      JSON.stringify({
        type: 'connection',
        status: 'connected',
        clientId: clientId,
        timestamp: Date.now(),
      })
    );

    ws.on('message', (message) => {
      try {
        const parsedMessage = JSON.parse(message);

        switch (parsedMessage.type) {
          case 'location':
            handleLocationUpdate(clientId, parsedMessage.data);
            break;
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;
          default:
            console.log(`Unknown message type: ${parsedMessage.type}`);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    ws.on('close', () => {
      console.log(`WebSocket client disconnected: ${clientId}`);
      removeClient(clientId);
      broadcastToAll({ type: 'clientDisconnected', clientId, timestamp: Date.now() });
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
    });
  });

  console.log('WebSocket server initialized');
  return wss;
}

function broadcastToAll(message) {
  const clientsList = getAllClients();
  const messageString = JSON.stringify(message);

  clientsList.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(messageString);
    }
  });
}

function sendToClient(clientId, message) {
  const client = getClientById(clientId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
    return true;
  }
  return false;
}

// Helper functions for client management
function addClient(clientId, ws) {
  clients.set(clientId, { clientId, ws });
}

function removeClient(clientId) {
  clients.delete(clientId);
}

function getClientById(clientId) {
  return clients.get(clientId);
}

function getAllClients() {
  return Array.from(clients.values());
}

function generateUniqueId() {
  return Math.random().toString(36).substring(2, 15);
}

function handleLocationUpdate(clientId, locationData) {
  // Broadcast location update to all clients
  broadcastToAll({
    type: 'locationUpdate',
    clientId,
    data: locationData,
    timestamp: Date.now()
  });
}

export {
  initializeWebSocketServer,
  broadcastToAll,
  sendToClient
};

export default initializeWebSocketServer;
