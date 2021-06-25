import { TestBed } from '@angular/core/testing';

import { ApirtcRestMediasService } from './apirtc-rest-medias.service';

describe('ApirtcRestMediasService', () => {
  let service: ApirtcRestMediasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApirtcRestMediasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
