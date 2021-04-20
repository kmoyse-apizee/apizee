/**
 * To avoid accessing to data using methods in templates,
 * this decorator allows to access relevant attributes
 */
export class MessageDecorator {

    readonly username: string;
    readonly content: string;

    private message: any;


    constructor(message?: any, username?: string, content?: string) {
        if (message) {
            this.message = message;
            this.username = message.sender.getUsername();
            this.content = message.content;
        }
        else {
            this.username = username;
            this.content = content;
        }
    }

    /**
     * 
     * @param message 
     * @returns 
     */
    public static buildFromMessage(message: any): MessageDecorator {
        return new MessageDecorator(message);
    }

    public static build(username: string, content: string): MessageDecorator {
        return new MessageDecorator(null, username, content);
    }

    getMessage(): any {
        return this.message;
    }

}
