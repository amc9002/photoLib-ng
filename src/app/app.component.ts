import { Component } from '@angular/core';
import { HomeComponent } from './pages/home/home.component'; // ✅ Імпартуй кампанент

@Component({
  selector: 'app-root',
  standalone: true, // ✅ standalone кампанент
  imports: [HomeComponent], 
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'photolib-ng';
}
