export class ContactDecorator {

    private contact: any;

    constructor(contact?: any) {
        this.contact = contact;
    }

    public static build(contact: any): ContactDecorator {
        return new ContactDecorator(contact);
    }

    public get id(): string {
        return this.contact.getId();
    }

    public get username(): string {
        return this.contact.getUsername();
    }

    public getId(): string {
        return this.id;
    }
}