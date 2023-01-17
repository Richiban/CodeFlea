import InterwordIO from "../io/InterwordIO";
import SubjectBase from "./SubjectBase";

export default class InterwordSubject extends SubjectBase {
    protected subjectIO = new InterwordIO();
    public outlineColour = { dark: "#964d4d", light: "#964d4d" } as const;
    public readonly name = "INTERWORD";
    public readonly displayName = "inter-word";
    public readonly jumpPhaseType = "single-phase";
}
