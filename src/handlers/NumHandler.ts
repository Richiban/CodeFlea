import * as vscode from "vscode";
import * as common from "../common";
import Enumerable from "../utils/Enumerable";
import SubjectBase from "../subjects/SubjectBase";
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

    abstract init(): void;
    abstract change(): NumHandler;
    abstract handleNumKey(number: number, shifted: boolean): Promise<void>;
    abstract handleCommandExecution(
        command: () => Promise<void>
    ): Promise<void>;
    abstract clearUI(): void;

    abstract setUI(subject: SubjectBase): void;
}

export class QuickJumpNumHandler extends NumHandler {
    readonly statusText = undefined;

    private readonly decorationType =
        vscode.window.createTextEditorDecorationType({});

    private forwardRanges: vscode.Range[] | undefined;
    private backwardRanges: vscode.Range[] | undefined;

    init() {}

    change() {
        return new CommandMultiplierNumHandler(this.context);
    }

    async handleNumKey(number: number, shifted: boolean): Promise<void> {
        let range;

        if (!shifted) {
            if (!this.forwardRanges) {
                return;
            }

            range = this.forwardRanges[number];
        } else {
            if (!this.backwardRanges) {
                return;
            }

            range = this.backwardRanges[(number + 9) % 10];
        }

        if (range) {
            this.context.editor.selection = ranges.rangeToSelection(range);
        }
    }

    setUI(subject: SubjectBase): void {
        this.forwardRanges = subject
            .iterAll("forwards", this.context.editor.visibleRanges[0])
            .take(10)
            .toArray();

        this.backwardRanges = subject
            .iterAll("backwards", this.context.editor.visibleRanges[0])
            .take(10)
            .toArray();

        const decorations = new Enumerable(this.forwardRanges!)
            .skip(1)
            .zipWith([1, 2, 3, 4, 5, 6, 7, 8, 9, 0])
            .concat(
                new Enumerable(this.backwardRanges!).zipWith([
                    1, 2, 3, 4, 5, 6, 7, 8, 9, 0,
                ])
            )
            .map(([range, i]) => {
                return make(ranges.positionToRange(range.start), i.toString());
            })
            .toArray();

        this.context.editor.setDecorations(this.decorationType, decorations);
    }

    clearUI() {
        this.context.editor.setDecorations(this.decorationType, []);
    }

    async handleCommandExecution(
        repeatCommand: () => Promise<void>
    ): Promise<void> {
        await repeatCommand();
    }
}

export class CommandMultiplierNumHandler extends NumHandler {
    private commandMultiplier = 1;

    get statusText() {
        if (this.commandMultiplier > 1) {
            return `x${this.commandMultiplier}`;
        }
    }

    init(): void {
        throw new Error("Method not implemented.");
    }

    change(): NumHandler {
        return new QuickJumpNumHandler(this.context);
    }

    clearUI(): void {}

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

    async handleCommandExecution(command: () => Promise<void>): Promise<void> {
        while (this.commandMultiplier >= 1) {
            await command();
            this.commandMultiplier--;
        }

        this.commandMultiplier = 1;
    }

    setUI(): void {}
}
