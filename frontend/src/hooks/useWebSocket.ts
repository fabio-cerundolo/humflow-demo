import { useEffect, useRef, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/candidates';
const MAX_RECONNECT_DELAY = 30000; // 30 secondi max
const INITIAL_RECONNECT_DELAY = 1000; // 1 secondo iniziale

export const useCandidatesWebSocket = (onUpdate: () => void, token: string | null) => {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const onUpdateRef = useRef(onUpdate);

    // Mantieni il callback aggiornato senza ricreare la connessione
    useEffect(() => {
        onUpdateRef.current = onUpdate;
    }, [onUpdate]);

    const connect = useCallback(() => {
        if (!token) {
            console.log('⚠️ WebSocket: nessun token, connessione saltata');
            return;
        }

        try {
            // Costruisci l'URL con il token come query param
            const wsUrl = `${WS_URL}?token=${encodeURIComponent(token)}`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('✅ WebSocket connesso');
                reconnectAttemptsRef.current = 0; // Reset tentativi
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = null;
                }
            };

            ws.onmessage = (event) => {
                if (event.data === 'UPDATE_CANDIDATES') {
                    console.log('🔄 Aggiornamento ricevuto via WebSocket');
                    onUpdateRef.current();
                } else if (event.data === 'pong') {
                    // Risposta al ping di keepalive
                    console.log('🏓 Pong ricevuto');
                }
            };

            ws.onclose = (event) => {
                console.log(`⚠️ WebSocket disconnesso (code: ${event.code})`);

                // Riconnessione con backoff esponenziale
                const delay = Math.min(
                    INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
                    MAX_RECONNECT_DELAY
                );

                console.log(`🔄 Tentativo di riconnessione in ${delay}ms...`);
                reconnectTimeoutRef.current = setTimeout(() => {
                    reconnectAttemptsRef.current++;
                    connect();
                }, delay);
            };

            ws.onerror = (error) => {
                console.error('Errore WebSocket:', error);
                ws.close();
            };

            // Keepalive: invia ping ogni 30 secondi
            const pingInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send('ping');
                }
            }, 30000);

            // Pulisci l'intervallo quando la connessione si chiude
            ws.addEventListener('close', () => clearInterval(pingInterval));

        } catch (e) {
            console.error('Errore connessione WebSocket:', e);

            // Riconnessione con backoff esponenziale
            const delay = Math.min(
                INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
                MAX_RECONNECT_DELAY
            );

            reconnectTimeoutRef.current = setTimeout(() => {
                reconnectAttemptsRef.current++;
                connect();
            }, delay);
        }
    }, [token]);

    useEffect(() => {
        connect();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connect]);
};