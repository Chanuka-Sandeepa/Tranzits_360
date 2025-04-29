const clients = new Map();

function addClient(clientId, ws) {
  clients.set(clientId, {
    id: clientId,
    ws: ws,
    connectedAt: Date.now(),
    metadata: {},
  });
}

function removeClient(clientId) {
  return clients.delete(clientId);
}

function getClientById(clientId) {
  return clients.get(clientId);
}

function getAllClients() {
  return Array.from(clients.values());
}

function updateClientMetadata(clientId, metadata) {
  const client = clients.get(clientId);
  if (client) {
    client.metadata = { ...client.metadata, ...metadata };
    clients.set(clientId, client);
    return true;
  }
  return false;
}

function getClientCount() {
  return clients.size;
}

export { addClient, removeClient, getClientById, getAllClients, updateClientMetadata, getClientCount };
