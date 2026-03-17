import { TestBed } from '@angular/core/testing';

import { PosService } from './pos';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('PosService', () => {
  let service: PosService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(PosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
