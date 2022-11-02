import * as vscode from "vscode";

export function selectWordUnderCursor(editor: vscode.TextEditor) {
    if (editor.selection.isEmpty)
        vscode.commands.executeCommand(
            "editor.action.addSelectionToNextFindMatch"
        );
}
