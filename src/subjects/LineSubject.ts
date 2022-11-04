import ModeManager from "../modes/ModeManager";
import { Subject, SubjectName } from "./subjects";

export default class LineSubject /*implements Subject*/ {
    // get name(): SubjectName {
    //     return "LINE";
    // }

    constructor(private manager: ModeManager) {}

    fixSelection(): void {
        throw new Error("Method not implemented.");
    }

    async nextSubjectDown() {
        throw new Error("Method not implemented.");
    }
    async nextSubjectUp() {
        throw new Error("Method not implemented.");
    }
    async nextSubjectLeft() {
        throw new Error("Method not implemented.");
    }
    async nextSubjectRight() {
        throw new Error("Method not implemented.");
    }

    async addSubjectDown() {
        throw new Error("Method not implemented.");
    }
    async addSubjectUp() {
        throw new Error("Method not implemented.");
    }
    async addSubjectLeft() {
        throw new Error("Method not implemented.");
    }
    async addSubjectRight() {
        throw new Error("Method not implemented.");
    }

    async extendSubjectDown() {
        throw new Error("Method not implemented.");
    }

    async extendSubjectUp() {
        throw new Error("Method not implemented.");
    }

    async extendSubjectLeft() {
        throw new Error("Method not implemented.");
    }

    async extendSubjectRight() {
        throw new Error("Method not implemented.");
    }
    async swapSubjectDown() {
        throw new Error("Method not implemented.");
    }
    async swapSubjectUp() {
        throw new Error("Method not implemented.");
    }
    async swapSubjectLeft() {
        throw new Error("Method not implemented.");
    }
    async swapSubjectRight() {
        throw new Error("Method not implemented.");
    }
}
