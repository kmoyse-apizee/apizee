import { StreamDecorator } from './stream-decorator'

export class ContactDecorator {

    public readonly id: string;
    public username: string;

    private contact: any;

    private readonly streamHoldersById: Map<string, StreamDecorator> = new Map();

    constructor(contact: any) {
        //console.log("typeof contact.getId()", typeof contact.getId());
        this.id = String(contact.getId());
        this.update(contact);
    }

    public static build(contact: any): ContactDecorator {
        return new ContactDecorator(contact);
    }

    // Do not use this from templates : it can trigger performance issues
    // public get username(): string {
    //     return this.contact.getUsername();
    // }

    public update(contact: any) {
        this.contact = contact;
        this.username = contact.getUsername();
    }

    public getId(): string {
        return this.id;
    }

    public getStreamHoldersById(): Map<string, StreamDecorator> {
        return this.streamHoldersById;
    }

    public addStream(stream: StreamDecorator) {
        this.streamHoldersById.set(stream.getId(), stream);
    }

    public removeStream(streamId: string) {
        this.streamHoldersById.delete(streamId);
    }

}