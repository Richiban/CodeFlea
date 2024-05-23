import * as common from "../common";
import * as editor from "../utils/editor";
import Seq from "../utils/seq";
import * as vscode from "vscode";
import * as ranges from "../utils/selectionsAndRanges";

function createDecorationOption(decorationRange: vscode.Range, text: string) {
    const extraProps = [
        "font-size:0.85em",
        "border-radius: 0.5ch",
        "line-height: 1.75ch",
        "position: absolute",
    ].join(";");

    return <vscode.DecorationOptions>{
        range: decorationRange,
        renderOptions: {
            before: {
                color: "silver",
                backgroundColor: "navy",
                contentText: text,
                margin: `-0.5ch 0.1ch 0 0`,
                padding: `0 0.25ch`,
                textDecoration: ";" + extraProps,
                border: "1px solid gray",
            },
        },
    };
}

const jumpCodeDecorationType = vscode.window.createTextEditorDecorationType({});

export default class JumpInterface {
    private jumpCodes: string[];

    constructor(private readonly context: common.ExtensionContext) {
        this.jumpCodes = context.config.jump.characters.split("");
    }

    async jump(jumpLocations: {
        kind: common.JumpPhaseType;
        locations: Seq<vscode.Position>;
    }): Promise<vscode.Position | undefined> {
        switch (jumpLocations.kind) {
            case "dual-phase": {
                const targetChar = await editor.inputBoxChar(
                    "Enter the first character"
                );

                if (!targetChar) {
                    return undefined;
                }

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

                if (!targetChar) {
                    return undefined;
                }

                return codedLocations.find(([location, jumpCode]) => {
                    if (jumpCode === targetChar) {
                        return location;
                    }
                })?.[0];
            }
        }
    }

    private removeJumpCodes() {
        this.context.editor.setDecorations(jumpCodeDecorationType, []);
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

        this.context.editor.setDecorations(jumpCodeDecorationType, decorations);
    }
}
