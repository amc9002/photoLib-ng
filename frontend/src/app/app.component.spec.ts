import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

// Калі ёсць HttpClient у сэрвісах, падключым мок:
import { HttpClientTestingModule } from '@angular/common/http/testing';

// Таксама, калі твае ўкладзеныя кампаненты standalone,
// іх трэба будзе імпартаваць у тэст, каб Angular ведаў пра іх.
// Напрыклад, калі ў шаблоне ёсць standalone кампаненты:
// import { SpinnerComponent } from '../shared/spinner/spinner.component';
// import { HomeComponent } from '../pages/home/home.component';
// import { EditPhotoDialogComponent } from '../shared/edit-photo-dialog/edit-photo-dialog.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        AppComponent,
        // Дадай сюды standalone кампаненты, калі ёсць:
        // SpinnerComponent,
        // HomeComponent,
        // EditPhotoDialogComponent,
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render app components', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges(); // Важна, каб шаблон адмаляваўся
    const compiled = fixture.nativeElement as HTMLElement;
    
    expect(compiled.querySelector('app-home')).toBeTruthy();
  });
});
