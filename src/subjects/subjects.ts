import * as common from "../common";
import { SubjectType } from "./SubjectType";
import SubjectBase from "./SubjectBase";
import BlockSubject from "./BlockSubject";
import LineSubject from "./LineSubject";
import SubwordSubject from "./SubWordSubject";
import WordSubject from "./WordSubject";
import InterwordSubject from "./InterwordSubject";
import BracketSubject from "./BracketSubject";
import InclusiveBracketSubject from "./InclusiveBracketSubject";

export function createFrom(
    context: common.ExtensionContext,
    subjectName: SubjectType
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
            return new BracketSubject(context);
        case "BRACKETS_INCLUSIVE":
            return new InclusiveBracketSubject(context);
    }
}

export function toDisplayName(subjectName: SubjectType): string {
    switch (subjectName) {
        case "LINE":
            return "Line";
        case "WORD":
            return "Word";
        case "SUBWORD":
            return "Subword";
        case "BLOCK":
            return "Block";
        case "INTERWORD":
            return "Inter-word";
        case "BRACKETS":
            return "Inside brackets";
        case "BRACKETS_INCLUSIVE":
            return "Outside brackets";
    }
}
