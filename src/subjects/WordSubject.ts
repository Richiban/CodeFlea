import WordIO from "../io/WordIO";
import SubjectBase from "./SubjectBase";

export default class WordSubject extends SubjectBase {
    protected subjectIO = new WordIO();
    public readonly outlineColour = "#964d4d";
    public readonly name = "WORD";
    public readonly displayName = "word";
    public readonly jumpPhaseType = "dual-phase";
}
