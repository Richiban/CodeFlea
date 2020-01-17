import * as vscode from "vscode";
import { Config } from "./config";
import { JumpLocations, JumpLocation, linqish } from "./common";
import { readKey } from "./inline-input";

export class JumpInterface {
  constructor(
    private config: Config,
    private cache: { [index: string]: vscode.Uri },
    private decorations: {
      [index: number]: vscode.TextEditorDecorationType;
    } = {}
  ) {}

  initialize = (config: Config) => {
    this.config = config;
    this.updateCache();
  };

  async pick(
    editor: vscode.TextEditor,
    jumpLocations: JumpLocations
  ): Promise<JumpLocation | undefined> {
    this.addDecorations(editor, jumpLocations);

    const input = await readKey();
    this.removeDecorations(editor);

    return jumpLocations.find(x => x.jumpCode === input);
  }

  private addDecorations(
    editor: vscode.TextEditor,
    jumpLocations: JumpLocations
  ) {
    const {
      _true: standardOptions,
      _false: optionsWithNoSpaceToLeft
    } = linqish(jumpLocations)
      .map(loc =>
        this.createDecorationOptions(
          loc.lineNumber,
          loc.charIndex,
          loc.jumpCode
        )
      )
      .partition(loc => loc.range.start.character > 0);

    editor.setDecorations(
      this.createTextEditorDecorationType(1),
      standardOptions
    );

    editor.setDecorations(
      this.createTextEditorDecorationType(0),
      optionsWithNoSpaceToLeft
    );
  }

  removeDecorations(editor: vscode.TextEditor) {
    for (const dec in this.decorations) {
      if (this.decorations[dec] === null) continue;
      editor.setDecorations(this.decorations[dec], []);
      this.decorations[dec].dispose();
      this.decorations[dec] = null!;
    }
  }

  private createTextEditorDecorationType(charsToOffsetToLeft: number) {
    let decorationType = this.decorations[charsToOffsetToLeft];
    if (decorationType) return decorationType;

    decorationType = vscode.window.createTextEditorDecorationType({
      after: {
        margin: `0 0 0 ${charsToOffsetToLeft *
          -this.config.decoration.width}px`,
        height: `${this.config.decoration.height}px`,
        width: `${charsToOffsetToLeft * this.config.decoration.width}px`
      }
    });

    this.decorations[charsToOffsetToLeft] = decorationType;

    return decorationType;
  }

  private createDecorationOptions = (
    line: number,
    char: number,
    code: string
  ): vscode.DecorationOptions => {
    return {
      range: new vscode.Range(line, char, line, char),
      renderOptions: {
        dark: {
          after: {
            contentIconPath: this.getUri(code)
          }
        },
        light: {
          after: {
            contentIconPath: this.getUri(code)
          }
        }
      }
    };
  };

  private getUri = (code: string) => {
    if (this.cache[code] != undefined) return this.cache[code];
    this.cache[code] = this.buildUri(code);
    return this.cache[code];
  };

  private updateCache = () => {
    this.cache = {};
    this.config.jumper.characters.forEach(
      code => (this.cache[code] = this.buildUri(code))
    );
  };

  private buildUri = (code: string) => {
    const cf = this.config.decoration;
    const key = this.config.decoration.upperCase
      ? code.toUpperCase()
      : code.toLowerCase();
    const width = code.length * cf.width;
    const colors = cf.bgColor.split(",");
    const bgColor = "lime"; //colors[(code.length - 1) % colors.length];

    const svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${cf.height}" height="${cf.height}" width="${width}"><rect width="${width}" height="${cf.height}" rx="2" ry="3" style="fill: ${bgColor};fill-opacity:1;stroke:${cf.borderColor};stroke-opacity:${cf.bgOpacity};"/><text font-family="${cf.fontFamily}" font-weight="${cf.fontWeight}" font-size="${cf.fontSize}px" style="fill:${cf.color}" x="${cf.x}" y="${cf.y}">${key}</text></svg>`;

    return vscode.Uri.parse(svg);
  };
}
