# backend/app/websocket_manager.py
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Lista delle connessioni WebSocket attive
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        # Invia il messaggio a tutti i client connessi
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                # Se la connessione è caduta, la rimuoviamo
                self.disconnect(connection)

# Istanza globale del manager
manager = ConnectionManager()