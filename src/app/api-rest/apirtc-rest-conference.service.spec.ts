import { TestBed } from '@angular/core/testing';

import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ApirtcRestConferenceService } from './apirtc-rest-conference.service';

describe('ApirtcRestConferenceService', () => {
  let service: ApirtcRestConferenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        HttpClientTestingModule
      ]
    });
    service = TestBed.inject(ApirtcRestConferenceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
