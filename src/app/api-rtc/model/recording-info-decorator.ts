export class RecordingInfoDecorator {
    public readonly recordingInfo: Object;
    public readonly available: boolean;

    constructor(recordingInfo: Object, available: boolean) {
        this.recordingInfo = recordingInfo;
        this.available = available;
    }

    // public getRecordingInfo(): Object {
    //     return this.recordingInfo;
    // }

    public isAvailable(): boolean {
        return this.available;
    }
    // public setAvailable(available: boolean) {
    //     this.available = available;
    // }

}
