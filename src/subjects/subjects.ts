import * as common from "../common";
import { SubjectType } from "./SubjectType";
import Subject from "./Subject";
import BlockSubject from "./BlockSubject";
import LineSubject from "./LineSubject";
import SubwordSubject from "./SubWordSubject";
import WordSubject from "./WordSubject";
import InterwordSubject from "./InterwordSubject";

export function createFrom(
    context: common.ExtensionContext,
    subjectName: SubjectType
): Subject {
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
    }
}
