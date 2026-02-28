import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { slashCommandSuggestion } from "./slash-command-suggestion";

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: slashCommandSuggestion,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
