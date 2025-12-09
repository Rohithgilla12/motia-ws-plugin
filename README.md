# @potatocoder/ws-plugin

A Motia workbench plugin for real-time WebSocket log monitoring and debugging.

## Overview

This plugin adds a "WS Logs" tab to the Motia workbench bottom panel, providing:

- Real-time WebSocket message monitoring
- Stream subscription management (logs, API endpoints, custom streams)
- JSON syntax highlighting with expand/collapse for large payloads
- Message filtering by stream
- Connection status indicators
- Copy-to-clipboard functionality

## Installation

```bash
npm install @potatocoder/ws-plugin
# or
pnpm add @potatocoder/ws-plugin
```

## Usage

Add the plugin to your `motia.config.ts`:

```typescript
import wsPlugin from '@potatocoder/ws-plugin/plugin'

export default {
  plugins: [wsPlugin],
}
```

The plugin will automatically appear as a "WS Logs" tab in the bottom panel of your Motia workbench.

## Features

### Stream Subscriptions

The plugin auto-subscribes to default Motia streams on connection:
- `__motia.logs` - Application logs
- `__motia.api-endpoints` - API request/response events

Add custom streams via the "Add" button in the stream bar.

### Message Types

Messages are color-coded by type:
- **System** - Connection events (amber)
- **Error** - Error messages (red)
- **Sync/Create/Update/Delete** - CRUD operations (various colors)
- **Sent** - Outgoing messages (blue)

### Exported APIs

```typescript
// Main component
export { WebSocketsPage } from '@potatocoder/ws-plugin'

// Types
export type { WebSocketConnection, WebSocketMessage, WebSocketStats } from '@potatocoder/ws-plugin'

// Zustand store for external state access
export { useWebSocketStore } from '@potatocoder/ws-plugin'

// Hooks
export { useWebSocketConnections, useWebSocketMessages } from '@potatocoder/ws-plugin'
```

## Development

```bash
pnpm install
pnpm run dev      # Watch mode
pnpm run build    # Production build
pnpm run clean    # Remove dist/
```

## Requirements

- Motia with `@motiadev/core` and `@motiadev/ui`
- React 19+

## License

MIT
