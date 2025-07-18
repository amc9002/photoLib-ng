import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { AppInitializerService } from './app/services/init/app-initializer.service';
import { APP_INITIALIZER } from '@angular/core';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideAnimations(),

    {
      provide: APP_INITIALIZER,
      useFactory: (initService: AppInitializerService) => () => initService.initializeApp(),
      deps: [AppInitializerService],
      multi: true
    }
  ]
});
