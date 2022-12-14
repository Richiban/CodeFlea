import * as common from "../common";
import * as editor from "../utils/editor";
import Linqish from "../utils/Linqish";
import * as vscode from "vscode";
import * as ranges from "../utils/selectionsAndRanges";

function createDecorationOption(decorationRange: vscode.Range, text: string) {
    return <vscode.DecorationOptions>{
        range: decorationRange,
        renderOptions: {
            before: {
                color: new vscode.ThemeColor("editor.foreground"),
                contentText: text,
                margin: `-1.5ch 0 0 0; position: absolute`,
                textDecoration: ";font-size:0.85em;background-color:navy;",
            },
        },
    };
}

export default class JumpInterface {
    private jumpCodes: string[];
    private decorationType;

    constructor(private readonly context: common.ExtensionContext) {
        this.jumpCodes = context.config.jump.characters.split(/[\s,]+/);
        this.decorationType = vscode.window.createTextEditorDecorationType({});
    }

    async jump(jumpLocations: {
        kind: common.JumpPhaseType;
        locations: Linqish<vscode.Position>;
    }): Promise<vscode.Position | undefined> {
        switch (jumpLocations.kind) {
            case "dual-phase": {
                const targetChar = await editor.inputBoxChar(
                    "Enter the first character"
                );

                const remainingLocations = jumpLocations.locations.filterMap(
                    (p) => {
                        const char = editor.charAt(
                            this.context.editor.document,
                            p
                        );

                        if (char.toLowerCase() === targetChar.toLowerCase()) {
                            return p;
                        }
                    }
                );

                return await this.jump({
                    kind: "single-phase",
                    locations: remainingLocations,
                });
            }
            case "single-phase": {
                const codedLocations = jumpLocations.locations
                    .zipWith(this.jumpCodes)
                    .toArray();

                this.drawJumpCodes(codedLocations);

                const targetChar = await editor.inputBoxChar(
                    "Enter the jump character"
                );

                this.removeJumpCodes();

                return this.findMatch(codedLocations, targetChar);
            }
        }
    }

    private findMatch(
        codedLocations: (readonly [vscode.Position, string])[],
        targetChar: string
    ): vscode.Position | undefined {
        for (const [location, jumpCode] of codedLocations) {
            if (jumpCode === targetChar) {
                return location;
            }
        }

        return undefined;
    }

    private removeJumpCodes() {
        this.context.editor.setDecorations(this.decorationType, []);
    }

    private drawJumpCodes(
        jumpLocations: (readonly [vscode.Position, string])[]
    ) {
        const decorations = jumpLocations.map(([position, code]) =>
            createDecorationOption(
                ranges.positionToRange(position),
                code.toString()
            )
        );

        this.context.editor.setDecorations(this.decorationType, decorations);
    }
}
