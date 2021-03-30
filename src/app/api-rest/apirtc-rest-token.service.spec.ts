import { TestBed } from '@angular/core/testing';

import { ApirtcRestTokenService } from './apirtc-rest-token.service';

describe('ApirtcRestTokenService', () => {
  let service: ApirtcRestTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApirtcRestTokenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
