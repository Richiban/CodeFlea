export default class ExtendMode /*implements EditorMode*/ {
    // constructor(
    //     private manager: ModeManager,
    //     private subject: Subject
    // ) {}
    // equals(previousMode: EditorMode): boolean {
    //     return previousMode instanceof ExtendMode;
    // }
    // async changeSubject(subject: SubjectType) {
    //     throw new Error("Method not implemented.");
    // }
    // changeTo(newMode: EditorModeType): EditorMode {
    //     switch (newMode.kind) {
    //         case "EDIT":
    //             return new EditMode(this.manager, new NavigateMode
    //                 (this.manager, this.subject));
    //         case "EXTEND":
    //             return this;
    //         case "NAVIGATE":
    //             if (newMode.subjectName !=== this.previousNavigateMode.subject)
    //             {
    //             }
    //             return this.previousNavigateMode;
    //     }
    // }
    // onCharTyped(typed: { text: string }): EditorMode {
    //     vscode.commands.executeCommand("default:type", typed);
    //     return this;
    // }
    // refreshUI(editorManager: ModeManager) {
    //     editorManager.statusBar.text = `Extend (${this.previousNavigateMode.subject})`;
    //     if (editorManager.editor) {
    //         editorManager.editor.options.cursorStyle =
    //             vscode.TextEditorCursorStyle.BlockOutline;
    //         editorManager.editor.options.lineNumbers =
    //             vscode.TextEditorLineNumbersStyle.Relative;
    //     }
    //     vscode.commands.executeCommand("setContext", "codeFlea.mode", "EXTEND");
    // }
    // async executeSubjectCommand(command: keyof SubjectAction) {
    //     // TODO add subject and execute
    // }
}
