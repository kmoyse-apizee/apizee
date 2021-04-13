// Decorator for apiRTC.Stream class
//
export class Stream {

    public readonly streamId: string;
    public readonly callId: string;
    public readonly stream: any;

    public qosStat: any;

    public isSpeaking = false;

    constructor(stream: any, qosStat?: any) {
        this.stream = stream;
        this.streamId = stream.streamId;
        this.callId = stream.callId;
        this.qosStat = qosStat && qosStat || undefined;
    }

    /**
     * 
     * @param stream 
     * @returns 
     */
    public static build(stream: any, qosStat?: any): Stream {
        return new Stream(stream, qosStat);
    }

    // Accessors

    public getStreamId(): string {
        return this.streamId;
    }

    public getCallId(): string {
        return this.callId;
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
