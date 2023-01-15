import SubjectBase from "./SubjectBase";
import BracketIO from "../io/BracketIO";

export default class OutsideBracketSubject extends SubjectBase {
    protected subjectIO = new BracketIO(true);
    public readonly outlineColour = {
        dark: "#9900ff",
        light: "#9900ff",
    } as const;
    readonly name = "BRACKETS_INCLUSIVE";
    public readonly displayName = "outside brackets";
    public readonly jumpPhaseType = "single-phase";
}
