import * as vscode from "vscode";

export async function readKey() {
  return new Promise<string | undefined>((resolve, reject) => {
    const command = vscode.commands.registerCommand(
      "type",
      (event: { text: string }) => {
        resolve(event.text);
        command.dispose();
      }
    );
  });
}
