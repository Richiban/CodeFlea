import * as common from "../common";
import { SubjectType } from "../subjects/SubjectType";
import { Subject } from "../subjects/Subject";
import { BlockSubject } from "../subjects/BlockSubject";
import { LineSubject } from "../subjects/LineSubject";
import { SubWordSubject } from "../subjects/SubWordSubject";
import { WordSubject } from "../subjects/WordSubject";
import { AllLinesSubject } from "../subjects/AllLinesSubject";

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
            return new SubWordSubject(context);
        case "BLOCK":
            return new BlockSubject(context);
    }
}
