import * as vscode from "vscode";
import { changeCase } from "./casing";

export type ModifyCommand = "flipCaseFirstCharacter" | "transformToCamelCase";

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
        
        case "transformToCamelCase":
            vscode.window.activeTextEditor!.edit((edit) => {
                for (const selection of vscode.window.activeTextEditor!.selections) {
                    const text =
                        vscode.window.activeTextEditor!.document.getText(
                            selection
                        );
                    edit.replace(selection, changeCase(text, "camel"));
                }
            });
            break;
    }
}
