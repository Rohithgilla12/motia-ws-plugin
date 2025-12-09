import { useEffect, useCallback, useRef, useState } from "react";
import { useWebSocketStore } from "../stores/websocket-store";

// Connect to the actual Motia WebSocket server and monitor messages
export function useMotiaWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const {
    addConnection,
    updateConnection,
    removeConnection,
    addMessage,
    updateStats,
  } = useWebSocketStore();
  const connectionIdRef = useRef<string>(`motia_ws_${Date.now()}`);

  useEffect(() => {
    const wsUrl = window.location.origin.replace("http", "ws");
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    const connectionId = connectionIdRef.current;

    // Register this connection
    addConnection({
      id: connectionId,
      url: wsUrl,
      status: "connecting",
      createdAt: Date.now(),
      messageCount: 0,
    });

    ws.onopen = () => {
      setIsConnected(true);
      updateConnection(connectionId, { status: "connected" });
      updateStats({ activeConnections: 1 });

      // Add a system message
      addMessage({
        id: `msg_${Date.now()}_open`,
        connectionId,
        type: "received",
        data: { type: "system", message: "WebSocket connection established" },
        timestamp: Date.now(),
      });
    };

    ws.onmessage = (event) => {
      let data: string | object;
      try {
        data = JSON.parse(event.data) as object;
      } catch {
        data = event.data as string;
      }

      addMessage({
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        connectionId,
        type: "received",
        data,
        timestamp: Date.now(),
      });

      // Update message count
      const store = useWebSocketStore.getState();
      const conn = store.connections.find((c) => c.id === connectionId);
      if (conn) {
        updateConnection(connectionId, { messageCount: conn.messageCount + 1 });
      }
      updateStats({ totalMessages: store.messages.length + 1 });
    };

    ws.onerror = () => {
      updateConnection(connectionId, {
        status: "error",
        errorMessage: "WebSocket error occurred",
      });

      addMessage({
        id: `msg_${Date.now()}_error`,
        connectionId,
        type: "received",
        data: { type: "error", message: "WebSocket error occurred" },
        timestamp: Date.now(),
      });
    };

    ws.onclose = () => {
      setIsConnected(false);
      updateConnection(connectionId, { status: "disconnected" });
      updateStats({ activeConnections: 0 });

      addMessage({
        id: `msg_${Date.now()}_close`,
        connectionId,
        type: "received",
        data: { type: "system", message: "WebSocket connection closed" },
        timestamp: Date.now(),
      });
    };

    return () => {
      ws.close();
      removeConnection(connectionId);
    };
  }, [
    addConnection,
    updateConnection,
    removeConnection,
    addMessage,
    updateStats,
  ]);

  const sendMessage = useCallback(
    (data: string | object) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const message = typeof data === "string" ? data : JSON.stringify(data);
        wsRef.current.send(message);

        const connectionId = connectionIdRef.current;
        addMessage({
          id: `msg_${Date.now()}_sent`,
          connectionId,
          type: "sent",
          data,
          timestamp: Date.now(),
        });

        // Update message count
        const store = useWebSocketStore.getState();
        const conn = store.connections.find((c) => c.id === connectionId);
        if (conn) {
          updateConnection(connectionId, {
            messageCount: conn.messageCount + 1,
          });
        }
        updateStats({ totalMessages: store.messages.length + 1 });
      }
    },
    [addMessage, updateConnection, updateStats]
  );

  // Subscribe to a stream
  const subscribeToStream = useCallback(
    (streamName: string, groupId: string, id?: string) => {
      const subscriptionId = `sub_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const message = {
        type: "join",
        data: {
          streamName,
          groupId,
          ...(id && { id }),
          subscriptionId,
        },
      };
      sendMessage(message);
      return subscriptionId;
    },
    [sendMessage]
  );

  // Unsubscribe from a stream
  const unsubscribeFromStream = useCallback(
    (
      streamName: string,
      groupId: string,
      subscriptionId: string,
      id?: string
    ) => {
      const message = {
        type: "leave",
        data: {
          streamName,
          groupId,
          ...(id && { id }),
          subscriptionId,
        },
      };
      sendMessage(message);
    },
    [sendMessage]
  );

  return {
    isConnected,
    sendMessage,
    subscribeToStream,
    unsubscribeFromStream,
    connectionId: connectionIdRef.current,
  };
}

export function useWebSocketConnections() {
  const { connections, updateStats } = useWebSocketStore();

  const fetchConnections = useCallback(async () => {
    // Connections are now managed by useMotiaWebSocket hook
    // This is kept for compatibility but primarily uses store data
    updateStats({
      totalConnections: connections.length,
      activeConnections: connections.filter((c) => c.status === "connected")
        .length,
    });
  }, [connections, updateStats]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  return { connections, refetch: fetchConnections };
}

export function useWebSocketMessages(connectionId: string | null) {
  const { messages } = useWebSocketStore();

  const filteredMessages = connectionId
    ? messages.filter((m) => m.connectionId === connectionId)
    : messages;

  return { messages: filteredMessages };
}
