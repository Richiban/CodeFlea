import SubjectBase from "./SubjectBase";
import BracketIO from "../io/BracketIO";

export default class InsideBracketSubject extends SubjectBase {
    protected subjectIO = new BracketIO(false);
    public outlineColour = "#9900ff";
    readonly name = "BRACKETS";
    public readonly displayName = "inside brackets";
    public readonly jumpPhaseType = "single-phase";
}
