import * as vscode from "vscode";

const disposables: vscode.Disposable[] = [];

function beginInputContext() {
  vscode.commands.executeCommand("setContext", "codeFleaInput", true);
}

function endInputContext() {
  vscode.commands.executeCommand("setContext", "codeFleaInput", false);
}

function endInput() {
  for (const d of disposables) {
    d.dispose();
  }

  endInputContext();
}

export async function readKey() {
  return new Promise<string | undefined>((resolve, reject) => {
    beginInputContext();

    disposables.push(
      vscode.commands.registerCommand("type", (event: { text: string }) => {
        resolve(event.text);
        endInput();
      })
    );

    disposables.push(
      vscode.commands.registerTextEditorCommand("codeFlea.input.cancel", () => {
        resolve();
        endInput();
      })
    );
  });
}
