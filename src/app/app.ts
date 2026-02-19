import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('apka-testowa');

  constructor() {
    // #region agent log
    fetch('http://127.0.0.1:7389/ingest/d4bc3059-1bec-4ee6-bc32-5de3f01e7c26',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'260e7d'},body:JSON.stringify({sessionId:'260e7d',location:'app.ts:12',message:'App component constructor',data:{timestamp:Date.now()},timestamp:Date.now(),runId:'run2',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
  }
}
