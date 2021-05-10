// Decorator for apiRTC.Stream class
//
export class StreamDecorator {

    public readonly id: string;

    public readonly streamInfo: any;

    public stream: any;

    public qosStat: any;

    public isSpeaking = false;

    public published = false;

    constructor(streamInfo: any, qosStat?: any) {
        this.streamInfo = streamInfo;

        // console.log("StreamDecorator: typeof streamInfo.streamId :", typeof streamInfo.streamId) => number
        this.id = String(streamInfo.streamId);

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

    // Speaking

    public setSpeaking(isSpeaking: boolean) {
        this.isSpeaking = isSpeaking;
    }

    // Published

    public setPublished(published: boolean) {
        this.published = published;
    }
    public isPublished(): boolean {
        return this.published;
    }

}
