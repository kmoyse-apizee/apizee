import { TestBed } from '@angular/core/testing';

import { ApirtcRestConversationsService } from './apirtc-rest-conversations.service';

describe('ApirtcRestConversationsService', () => {
  let service: ApirtcRestConversationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApirtcRestConversationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
