import { TestBed } from '@angular/core/testing';

import { ApirtcRestConferenceService } from './apirtc-rest-conference.service';

describe('ApirtcRestConferenceService', () => {
  let service: ApirtcRestConferenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApirtcRestConferenceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
