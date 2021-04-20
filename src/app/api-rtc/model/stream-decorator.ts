// Decorator for apiRTC.Stream class
//
export class StreamDecorator {

    public readonly id: string;
    // The call Id might change dugring Stream life
    // so this is not good to store it
    //public readonly callId: string;
    public readonly stream: any;

    public qosStat: any;

    public isSpeaking = false;

    public isSubscribed = false;

    constructor(stream: any, qosStat?: any) {
        this.stream = stream;
        this.id = stream.getId();
        //this.callId = stream.callId;
        this.qosStat = qosStat && qosStat || undefined;
    }

    /**
     * 
     * @param stream 
     * @returns 
     */
    public static build(stream: any, qosStat?: any): StreamDecorator {
        return new StreamDecorator(stream, qosStat);
    }

    // Accessors

    public getId(): string {
        return this.id;
    }

    // public getCallId(): string {
    //     return this.callId;
    // }

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

    public setSubscribed(isSubscribed: boolean) {
        this.isSubscribed = isSubscribed;
    }

}
