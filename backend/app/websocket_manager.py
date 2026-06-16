from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        """
        Invia messaggio a tutte le connessioni attive.
        Itera su una copia della lista per evitare RuntimeError.
        """
        dead_connections = []
        
        # Itera su una copia della lista
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception:
                # Segna la connessione come morta
                dead_connections.append(connection)
        
        # Rimuovi le connessioni morte dopo l'iterazione
        for conn in dead_connections:
            self.disconnect(conn)

manager = ConnectionManager()