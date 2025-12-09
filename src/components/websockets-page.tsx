import React, { useState, useMemo } from "react";
import {
  Badge,
  Button,
  Input,
  Empty,
  EmptyDescription,
  EmptyTitle,
  LevelDot,
  cn,
} from "@motiadev/ui";
import { Plus, X, Check, Wifi, WifiOff, Trash2 } from "lucide-react";
import { useMotiaWebSocket } from "../hooks/use-websocket-connections";
import { useWebSocketStore } from "../stores/websocket-store";
import { MessageViewer } from "./message-viewer";

// Stream color palette - each stream gets a unique color
const STREAM_COLORS = [
  {
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/40",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  {
    bg: "bg-blue-500/15",
    border: "border-blue-500/40",
    text: "text-blue-400",
    dot: "bg-blue-400",
  },
  {
    bg: "bg-amber-500/15",
    border: "border-amber-500/40",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  {
    bg: "bg-rose-500/15",
    border: "border-rose-500/40",
    text: "text-rose-400",
    dot: "bg-rose-400",
  },
  {
    bg: "bg-violet-500/15",
    border: "border-violet-500/40",
    text: "text-violet-400",
    dot: "bg-violet-400",
  },
  {
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/40",
    text: "text-cyan-400",
    dot: "bg-cyan-400",
  },
];

// Preset streams for quick access
const PRESET_STREAMS = [
  { name: "__motia.logs", label: "Logs" },
  { name: "__motia.api-endpoints", label: "API" },
];

interface SubscribedStream {
  name: string;
  label: string;
  colorIndex: number;
  messageCount: number;
  lastActivity: number;
}

export const WebSocketsPage: React.FC = () => {
  const { isConnected, sendMessage, subscribeToStream, connectionId } =
    useMotiaWebSocket();
  const {
    selectedConnectionId,
    selectConnection,
    stats,
    clearMessages,
    messages,
    connections,
  } = useWebSocketStore();

  // Stream management
  const [subscribedStreams, setSubscribedStreams] = useState<
    SubscribedStream[]
  >([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null); // null = show all
  const [showAddStream, setShowAddStream] = useState(false);
  const [newStreamName, setNewStreamName] = useState("");
  const [groupId] = useState("default");
  const [colorCounter, setColorCounter] = useState(0);

  // Auto-select the live connection if none selected
  React.useEffect(() => {
    if (!selectedConnectionId && connectionId && connections.length > 0) {
      selectConnection(connectionId);
    }
  }, [selectedConnectionId, connectionId, connections, selectConnection]);

  // Auto-subscribe to both API and Logs streams when connected
  React.useEffect(() => {
    if (isConnected && subscribedStreams.length === 0) {
      // Subscribe to all preset streams automatically
      PRESET_STREAMS.forEach((preset, index) => {
        subscribeToStream(preset.name, groupId);

        const newStream: SubscribedStream = {
          name: preset.name,
          label: preset.label,
          colorIndex: index % STREAM_COLORS.length,
          messageCount: 0,
          lastActivity: Date.now(),
        };

        setSubscribedStreams((prev) => [...prev, newStream]);
      });
      setColorCounter(PRESET_STREAMS.length);
    }
  }, [isConnected]);

  // Count messages per stream
  const streamMessageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    messages.forEach((msg) => {
      if (typeof msg.data === "object" && msg.data !== null) {
        const streamName = (msg.data as Record<string, unknown>)
          .streamName as string;
        if (streamName) {
          counts[streamName] = (counts[streamName] || 0) + 1;
        }
      }
    });
    return counts;
  }, [messages]);

  const handleAddStream = (streamName: string, label?: string) => {
    if (!streamName || subscribedStreams.some((s) => s.name === streamName))
      return;

    subscribeToStream(streamName, groupId);

    const newStream: SubscribedStream = {
      name: streamName,
      label: label || streamName.replace("__motia.", "").replace(/-/g, " "),
      colorIndex: colorCounter % STREAM_COLORS.length,
      messageCount: 0,
      lastActivity: Date.now(),
    };

    setSubscribedStreams((prev) => [...prev, newStream]);
    setColorCounter((prev) => prev + 1);
    setNewStreamName("");
    setShowAddStream(false);
  };

  const handleRemoveStream = (streamName: string) => {
    // Note: unsubscribeFromStream needs subscriptionId which we don't track yet
    // For now, just remove from UI
    setSubscribedStreams((prev) => prev.filter((s) => s.name !== streamName));
    if (activeFilter === streamName) {
      setActiveFilter(null);
    }
  };

  const handleClearAll = () => {
    clearMessages();
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Main Header Bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-semibold">WebSockets</h1>
          <Badge variant={isConnected ? "success" : "error"} className="gap-2">
            {isConnected ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">
              {stats.totalMessages}
            </span>{" "}
            messages
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="w-3 h-3 mr-1.5" />
            Clear all
          </Button>
        </div>
      </div>

      {/* Stream Subscription Bar */}
      <div className="px-5 py-3 bg-muted/30 border-b border-border/50">
        <div className="flex items-center gap-6">
          {/* Subscribed Streams Section */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Streams
            </span>

            <div className="flex items-center gap-2">
              {/* All Tab */}
              <Button
                variant={activeFilter === null ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveFilter(null)}
                className="h-7 text-xs"
              >
                All
                <span
                  className={cn(
                    "ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium tabular-nums",
                    activeFilter === null
                      ? "bg-primary-foreground/20"
                      : "bg-muted"
                  )}
                >
                  {stats.totalMessages}
                </span>
              </Button>

              {/* Stream Tabs */}
              {subscribedStreams.map((stream) => {
                const color = STREAM_COLORS[stream.colorIndex];
                const count = streamMessageCounts[stream.name] || 0;
                const isActive = activeFilter === stream.name;

                return (
                  <div
                    key={stream.name}
                    className={cn(
                      "group inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-md text-xs font-medium",
                      "transition-all duration-150 cursor-pointer",
                      isActive
                        ? `${color.bg} ${color.text} ring-1 ${color.border}`
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                    onClick={() =>
                      setActiveFilter(isActive ? null : stream.name)
                    }
                  >
                    <LevelDot level={isActive ? "success" : "neutral"} />
                    <span className="capitalize">{stream.label}</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-medium tabular-nums",
                        isActive
                          ? "bg-white/10"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveStream(stream.name);
                      }}
                      className={cn(
                        "p-0.5 rounded transition-all",
                        isActive
                          ? "opacity-60 hover:opacity-100 hover:bg-white/10"
                          : "opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-accent"
                      )}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-border" />

          {/* Add Stream Section */}
          <div className="flex items-center gap-3">
            {!showAddStream ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddStream(true)}
                  disabled={!isConnected}
                  className="h-7 text-xs border-dashed"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add
                </Button>

                {/* Quick Add - only show when no streams */}
                {subscribedStreams.length === 0 && (
                  <div className="flex items-center gap-2 pl-2 border-l border-border">
                    <span className="text-[10px] text-muted-foreground">
                      Quick:
                    </span>
                    {PRESET_STREAMS.map((preset) => (
                      <Button
                        key={preset.name}
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleAddStream(preset.name, preset.label)
                        }
                        disabled={!isConnected}
                        className="h-6 px-2 text-[10px]"
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted ring-1 ring-border">
                <Input
                  type="text"
                  value={newStreamName}
                  onChange={(e) => setNewStreamName(e.target.value)}
                  placeholder="__motia.stream-name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newStreamName)
                      handleAddStream(newStreamName);
                    if (e.key === "Escape") {
                      setShowAddStream(false);
                      setNewStreamName("");
                    }
                  }}
                  className="w-44 h-7 text-xs font-mono border-0 bg-transparent focus-visible:ring-0"
                />
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      newStreamName && handleAddStream(newStreamName)
                    }
                    disabled={!newStreamName}
                    className="h-6 w-6 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowAddStream(false);
                      setNewStreamName("");
                    }}
                    className="h-6 w-6"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Viewer - Full Width */}
      <div className="flex-1 overflow-hidden">
        {selectedConnectionId ? (
          <MessageViewer
            connectionId={selectedConnectionId}
            onSendMessage={sendMessage}
            isConnected={isConnected}
            streamFilter={activeFilter}
            streamColors={subscribedStreams.reduce((acc, s) => {
              acc[s.name] = STREAM_COLORS[s.colorIndex];
              return acc;
            }, {} as Record<string, (typeof STREAM_COLORS)[0]>)}
          />
        ) : (
          <Empty className="h-full">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-muted border border-border flex items-center justify-center">
              <Wifi className="w-8 h-8 text-muted-foreground animate-pulse" />
            </div>
            <EmptyTitle>Connecting to WebSocket</EmptyTitle>
            <EmptyDescription className="font-mono">
              ws://localhost:3000
            </EmptyDescription>
          </Empty>
        )}
      </div>
    </div>
  );
};
