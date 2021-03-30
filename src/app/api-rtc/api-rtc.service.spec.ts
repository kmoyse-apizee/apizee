import { TestBed } from '@angular/core/testing';

import { ApiRtcService } from './api-rtc.service';

describe('ApiRtcService', () => {
  let service: ApiRtcService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiRtcService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
