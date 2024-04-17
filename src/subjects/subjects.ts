import * as common from "../common";
import { SubjectName } from "./SubjectName";
import SubjectBase from "./SubjectBase";
import BlockSubject from "./BlockSubject";
import LineSubject from "./LineSubject";
import SubwordSubject from "./SubWordSubject";
import WordSubject from "./WordSubject";
import InterwordSubject from "./InterwordSubject";
import InsideBracketSubject from "./InsideBracketSubject";
import OutsideBracketSubject from "./OutsideBracketSubject";

export function createFrom(
    context: common.ExtensionContext,
    subjectName: SubjectName
): SubjectBase {
    switch (subjectName) {
        case "LINE":
            return new LineSubject(context);
        case "WORD":
            return new WordSubject(context);
        case "SUBWORD":
            return new SubwordSubject(context);
        case "BLOCK":
            return new BlockSubject(context);
        case "INTERWORD":
            return new InterwordSubject(context);
        case "BRACKETS":
            return new InsideBracketSubject(context);
        case "BRACKETS_INCLUSIVE":
            return new OutsideBracketSubject(context);
    }
}
