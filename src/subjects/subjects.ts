import * as common from "../common";
import { SubjectType } from "./SubjectType";
import { Subject } from "./Subject";
import { BlockSubject } from "./BlockSubject";
import { LineSubject } from "./LineSubject";
import { SubwordSubject } from "./SubWordSubject";
import { WordSubject } from "./WordSubject";
import { AllLinesSubject } from "./AllLinesSubject";

export function createFrom(
    context: common.ExtensionContext,
    subjectName: SubjectType
): Subject {
    switch (subjectName) {
        case "LINE":
            return new LineSubject(context);
        case "WORD":
            return new WordSubject(context);
        case "ALL_LINES":
            return new AllLinesSubject(context);
        case "SUBWORD":
            return new SubwordSubject(context);
        case "BLOCK":
            return new BlockSubject(context);
    }
}
