import { _fixedSizeVirtualScrollStrategyFactory } from '@angular/cdk/scrolling';
import { ContactDecorator } from './contact-decorator';


export class ContactMock {
  _id: string;
  _username: string;
  public getId() {
    return this._id;
  }
  public getUsername(): string {
    return this._username;
  }
  constructor(id: string, username: string) {
    this._id = id;
    this._username = username;
  }
}


describe('ContactDecorator', () => {
  it('should create an instance', () => {
    expect(new ContactDecorator(new ContactMock("foo", "bar"))).toBeTruthy();
  });
});
