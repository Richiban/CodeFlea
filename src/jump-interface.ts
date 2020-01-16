import * as vscode from "vscode";
import { Config } from "./config";
import { JumpLocations, JumpLocation, linqish } from "./common";
import { InlineInput } from "./inline-input";

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

    const input = await new InlineInput().show(editor, v => v);
    this.removeDecorations(editor);

    for (const loc of jumpLocations.locations) {
      if (loc.jumpCode === input) {
        return loc;
      }
    }
  }

  private addDecorations(
    editor: vscode.TextEditor,
    jumpLocations: JumpLocations
  ) {
    const regular = this.createTextEditorDecorationType(1);
    const beginning = this.createTextEditorDecorationType(0);

    const { _true: options1, _false: options2 } = linqish(
      jumpLocations.locations
    ).partition(loc => loc.charIndex > 0);

    const x = options1.map(loc =>
      this.createDecorationOptions(
        loc.lineNumber,
        loc.charIndex,
        loc.charIndex,
        loc.jumpCode
      )
    );

    const y = options2.map(loc =>
      this.createDecorationOptions(loc.lineNumber, 0, 0, loc.jumpCode)
    );

    editor.setDecorations(regular, x);
    editor.setDecorations(beginning, y);
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
    startCharacter: number,
    endCharacter: number,
    code: string
  ): vscode.DecorationOptions => {
    return {
      range: new vscode.Range(line, startCharacter, line, endCharacter),
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
    let cf = this.config.decoration;
    let key = this.config.decoration.upperCase
      ? code.toUpperCase()
      : code.toLowerCase();
    let width = code.length * cf.width;
    let colors = cf.bgColor.split(",");
    let bgColor = colors[(code.length - 1) % colors.length];
    let svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${cf.height}" height="${cf.height}" width="${width}"><rect width="${width}" height="${cf.height}" rx="2" ry="3" style="fill: ${bgColor};fill-opacity:${cf.bgOpacity};stroke:${cf.borderColor};stroke-opacity:${cf.bgOpacity};"/><text font-family="${cf.fontFamily}" font-weight="${cf.fontWeight}" font-size="${cf.fontSize}px" style="fill:${cf.color}" x="${cf.x}" y="${cf.y}">${key}</text></svg>`;
    return vscode.Uri.parse(svg);
  };
}
