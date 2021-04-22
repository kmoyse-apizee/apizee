import { StreamDecorator } from './stream-decorator'

export class ContactDecorator {

    public readonly id: string;

    private contact: any;

    private readonly streamHoldersById: Map<string, StreamDecorator> = new Map();

    constructor(contact?: any) {
        this.contact = contact;
        this.id = contact.getId();
    }

    public static build(contact: any): ContactDecorator {
        return new ContactDecorator(contact);
    }

    public get username(): string {
        return this.contact.getUsername();
    }

    public getId(): string {
        return this.id;
    }

    public getStreamsById(): Map<string, StreamDecorator> {
        return this.streamHoldersById;
    }

    public addStream(stream: StreamDecorator) {
        this.streamHoldersById.set(stream.getId(), stream);
    }

    public removeStream(streamId: string) {
        this.streamHoldersById.delete(streamId);
    }

}