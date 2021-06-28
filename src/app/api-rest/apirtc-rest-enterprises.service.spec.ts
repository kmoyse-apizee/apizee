import { TestBed } from '@angular/core/testing';

import { ApirtcRestEnterprisesService } from './apirtc-rest-enterprises.service';

describe('ApirtcRestEnterprisesService', () => {
  let service: ApirtcRestEnterprisesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApirtcRestEnterprisesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
