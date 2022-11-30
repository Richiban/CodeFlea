import * as vscode from "vscode";
import * as common from "../common";
import * as ranges from "../utils/selectionsAndRanges";

export function defaultNumHandler(context: common.ExtensionContext) {
    return new CommandMultiplierNumHandler(context);
}

function make(decorationRange: vscode.Range, text: string) {
    return <vscode.DecorationOptions>{
        range: decorationRange,
        renderOptions: {
            before: {
                color: new vscode.ThemeColor("editor.foreground"),
                background: new vscode.ThemeColor("editor.background"),
                contentText: text,
                margin: `-1.5ch 0 0 0; position: absolute`,
                textDecoration: ";font-size:0.65em",
            },
        },
    };
}

export abstract class NumHandler {
    abstract get statusText(): string | undefined;
    constructor(protected context: common.ExtensionContext) {}

    abstract change(): NumHandler;
    abstract handleNumKey(number: number): Promise<void>;
    abstract handleCommandExecution(
        command: () => Promise<void>
    ): Promise<{ needsUiRefresh: boolean }>;
    abstract clear(): void;

    abstract setRanges(
        forwardRanges: common.Linqish<vscode.Range>,
        backwardRanges: common.Linqish<vscode.Range>
    ): void;
}

export class QuickJumpNumHandler extends NumHandler {
    readonly statusText = undefined;

    private readonly decorationType =
        vscode.window.createTextEditorDecorationType({});

    private forwardRanges: vscode.Range[] | undefined;
    private backwardRanges: vscode.Range[] | undefined;

    change() {
        return new CommandMultiplierNumHandler(this.context);
    }

    async handleNumKey(number: number): Promise<void> {
        if (!this.forwardRanges) {
            return;
        }

        const range = this.forwardRanges[number];

        if (range) {
            this.context.editor.selection = ranges.rangeToSelection(range);
        }
    }

    setRanges(
        forwardRanges: common.Linqish<vscode.Range>,
        backwardRanges: common.Linqish<vscode.Range>
    ): void {
        this.forwardRanges = forwardRanges.toArray();
        this.backwardRanges = backwardRanges.toArray();

        const decorations = common
            .linqish(this.forwardRanges)
            .skip(1)
            .zipWith([1, 2, 3, 4, 5, 6, 7, 8, 9, 0])
            .concat(
                common
                    .linqish(this.backwardRanges)
                    .zipWith([1, 2, 3, 4, 5, 6, 7, 8, 9, 0])
            )
            .map(([range, i]) => {
                return make(ranges.pointToRange(range.start), i.toString());
            })
            .toArray();

        this.context.dispatch({
            kind: "setEditorDecorations",
            decorationType: this.decorationType,
            targets: decorations,
        });
    }

    clear() {
        this.context.dispatch({
            kind: "clearEditorDecorations",
            decorationType: this.decorationType,
        });
    }

    async handleCommandExecution(
        repeatCommand: () => Promise<void>
    ): Promise<{ needsUiRefresh: boolean }> {
        await repeatCommand();

        return { needsUiRefresh: false };
    }
}

export class CommandMultiplierNumHandler extends NumHandler {
    private commandMultiplier = 1;

    get statusText() {
        if (this.commandMultiplier > 1) {
            return `x${this.commandMultiplier}`;
        }
    }

    change(): NumHandler {
        return new QuickJumpNumHandler(this.context);
    }

    clear() {
        return undefined;
    }

    async handleNumKey(number: number) {
        if (number < 0 || number > 9) {
            throw new Error("Number out of range");
        }

        if (this.commandMultiplier === 1) {
            this.commandMultiplier = number;
        } else {
            this.commandMultiplier = this.commandMultiplier * 10 + number;
        }
    }

    async handleCommandExecution(
        command: () => Promise<void>
    ): Promise<{ needsUiRefresh: boolean }> {
        let needsUiRefresh = false;

        while (this.commandMultiplier >= 1) {
            await command();
            this.commandMultiplier--;
            needsUiRefresh = true;
        }

        this.commandMultiplier = 1;

        return { needsUiRefresh };
    }

    setRanges(
        forwardRanges: common.Linqish<vscode.Range>,
        backwardRanges: common.Linqish<vscode.Range>
    ) {
        return undefined;
    }
}
