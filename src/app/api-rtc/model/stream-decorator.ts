// Decorator for apiRTC.Stream class
//
export class StreamDecorator {

    public readonly id: string;
    // The call Id might change dugring Stream life
    // so this is not good to store it
    //public readonly callId: string;
    public readonly streamInfo: any;
    public stream: any;

    public qosStat: any;

    public isSpeaking = false;

    constructor(streamInfo: any, qosStat?: any) {
        this.streamInfo = streamInfo;

        console.log("StreamDecorator: typeof streamInfo.streamId :", typeof streamInfo.streamId)
        // => number
        this.id = String(streamInfo.streamId);

        //console.log("StreamDecorator: typeof stream.getId() :", typeof stream.getId())
        // if (typeof stream.getId() === "number") {
        //     console.log("stream.getId() is actually a number, not a string !!!", typeof stream.getId())
        // }

        //this.callId = stream.callId;
        this.qosStat = qosStat && qosStat || undefined;
    }

    /**
     * 
     * @param streamInfo 
     * @returns 
     */
    public static build(streamInfo: any, qosStat?: any): StreamDecorator {
        return new StreamDecorator(streamInfo, qosStat);
    }

    // Accessors

    public getId(): string {
        return this.id;
    }

    // public getCallId(): string {
    //     return this.callId;
    // }

    public setStream(stream: any) {
        this.stream = stream;
    }
    public getStream(): any {
        return this.stream;
    }

    // QoS

    public setQosStat(qosStat: any) {
        this.qosStat = qosStat;
    }
    public getQosStat(): any {
        return this.qosStat;
    }


    public setSpeaking(isSpeaking: boolean) {
        this.isSpeaking = isSpeaking;
    }

}
