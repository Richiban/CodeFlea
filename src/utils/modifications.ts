import * as vscode from "vscode";

export type ModifyCommand = "flipCaseFirstCharacter";

export function executeModifyCommand(command: ModifyCommand) {
    switch (command) {
        case "flipCaseFirstCharacter":
            vscode.window.activeTextEditor!.edit((edit) => {
                for (const selection of vscode.window.activeTextEditor!
                    .selections) {
                    const text =
                        vscode.window.activeTextEditor!.document.getText(
                            selection
                        );
                    const newText =
                        text[0].toUpperCase() === text[0]
                            ? text[0].toLowerCase() + text.slice(1)
                            : text[0].toUpperCase() + text.slice(1);
                    edit.replace(selection, newText);
                }
            });
            break;
    }
}
