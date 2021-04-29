import { TestBed } from '@angular/core/testing';

import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ApirtcRestTokenService } from './apirtc-rest-token.service';

describe('ApirtcRestTokenService', () => {
  let service: ApirtcRestTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        HttpClientTestingModule
      ]
    });
    service = TestBed.inject(ApirtcRestTokenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
