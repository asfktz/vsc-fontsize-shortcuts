"use strict";

import {
  ExtensionContext,
  WorkspaceConfiguration,
  commands,
  window,
  workspace,
} from "vscode";

const minFontSize = 1;
const maxFontSize = Number.MAX_SAFE_INTEGER;

enum Dir { increase = 1, decrease = -1 };
enum Env { editor = "editor", terminal = "terminal.integrated" }

const updateFontSize = (env: Env, i: Dir) => () => {
  const config = workspace.getConfiguration();
  const fontSize = config.get<number>(`${env}.fontSize`);
  const step = config.get<number>("fontshortcuts.step");
  const lineHeight = config.get<number>("fontshortcuts.lineHeight");
  const newSize = Math.min(maxFontSize, Math.round(fontSize + (step * i)));
  
  if (newSize === fontSize) return;

  return Promise.all([
    config.update(`${env}.lineHeight`, newSize * lineHeight, true),
    config.update(`${env}.fontSize`, newSize, true)
  ])
}

const increaseEditorFontSize = updateFontSize(Env.editor, Dir.increase);
const decreaseEditorFontSize = updateFontSize(Env.editor, Dir.decrease);
const increaseTerminalFontSize = updateFontSize(Env.terminal, Dir.increase);
const decreaseTerminalFontSize = updateFontSize(Env.terminal, Dir.decrease);

export function activate(context: ExtensionContext) {
  const lineHeight = 1.4;

  async function resetFontSize(terminal: boolean) {
    const config = workspace.getConfiguration();
    const fontSizeType = terminal
      ? "terminal.integrated.fontSize"
      : "editor.fontSize";
    const defaultFontSizeType = terminal
      ? "fontshortcuts.defaultFontSize"
      : "fontshortcuts.defaultTerminalFontSize";
    const defaultFontSize = config.get<number>(defaultFontSizeType);

    if (defaultFontSize === null) {
      try {
        return await config.update(fontSizeType, undefined, true);
      } catch (e) {
        // swallow errors
        return;
      }
    }

    if (
      Number.isSafeInteger(defaultFontSize) &&
      defaultFontSize >= minFontSize &&
      defaultFontSize <= maxFontSize
    ) {
      return config.update(fontSizeType, defaultFontSize, true);
    }

    window.showErrorMessage(
      `Cannot set font size to "${defaultFontSize}".
       Please set "${defaultFontSizeType}" to an integer
       between ${minFontSize} and ${maxFontSize} in your user settings.`
    );
  }

  context.subscriptions.push(
    commands.registerCommand("fontshortcuts.increaseEditorFontSize", increaseEditorFontSize),
    commands.registerCommand("fontshortcuts.increaseTerminalFontSize", increaseEditorFontSize),

    commands.registerCommand("fontshortcuts.increaseFontSize", () =>
      Promise.all([
        increaseEditorFontSize,
        increaseTerminalFontSize
      ])
    ),

    commands.registerCommand("fontshortcuts.decreaseEditorFontSize", decreaseEditorFontSize),
    commands.registerCommand("fontshortcuts.decreaseTerminalFontSize", decreaseTerminalFontSize),
    commands.registerCommand("fontshortcuts.decreaseFontSize", () =>
      Promise.all([
        decreaseEditorFontSize,
        decreaseTerminalFontSize
      ])
    ),

    commands.registerCommand("fontshortcuts.resetEditorFontSize", () => resetFontSize(false)),
    commands.registerCommand("fontshortcuts.resetTerminalFontSize", () => resetFontSize(true)),
    commands.registerCommand("fontshortcuts.resetFontSize", () =>
      Promise.all([
        resetFontSize(false),
        resetFontSize(true
      )])
    )
  );
}

export function deactivate() {
  // should unregister
}