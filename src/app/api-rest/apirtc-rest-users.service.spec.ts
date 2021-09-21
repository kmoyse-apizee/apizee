import { TestBed } from '@angular/core/testing';

import { ApirtcRestUsersService } from './apirtc-rest-users.service';

describe('ApirtcRestUsersService', () => {
  let service: ApirtcRestUsersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApirtcRestUsersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
