import type { MotiaPlugin, MotiaPluginContext } from "@motiadev/core";

export default function plugin(_motia: MotiaPluginContext): MotiaPlugin {
  return {
    workbench: [
      {
        packageName: "ws-plugin",
        cssImports: ["ws-plugin/dist/styles.css"],
        label: "WS Logs",
        position: "bottom",
        componentName: "WebSocketsPage",
        labelIcon: "radio",
      },
    ],
  };
}
