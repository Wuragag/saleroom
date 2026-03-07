import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { SyncedBlockNodeView } from "./synced-block-node-view";

export const SyncedBlockNode = Node.create({
  name: "syncedBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      syncedBlockId: { default: null },
      blockName: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="synced-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "synced-block",
        "data-synced-block-id": HTMLAttributes.syncedBlockId || "",
        "data-block-name": HTMLAttributes.blockName || "",
      }),
      `[Synced Block: ${HTMLAttributes.blockName || "Unknown"}]`,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SyncedBlockNodeView);
  },
});
