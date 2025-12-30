import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

export type ThemeMode = 'light' | 'dark' | 'system';

@customElement('theme-toggle')
export class ThemeToggle extends LitElement {
  @state()
  private currentTheme: ThemeMode = 'system';

  private mediaQueryListener: ((e: MediaQueryListEvent) => void) | undefined;

  static styles = css`
    .theme-toggle {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      padding: 0.5rem;
      background: var(--surface);
      border-radius: 8px;
      box-shadow: var(--shadow);
    }

    .theme-toggle label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
      margin: 0;
    }

    .theme-buttons {
      display: flex;
      gap: 0.25rem;
      background: var(--background);
      border-radius: 6px;
      padding: 0.25rem;
    }

    button {
      padding: 0.375rem 0.75rem;
      border: none;
      border-radius: 4px;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      background: transparent;
      color: var(--text-secondary);
    }

    button:hover {
      color: var(--text-primary);
      background: rgba(0, 0, 0, 0.05);
    }

    button.active {
      background: var(--primary-color);
      color: white;
    }

    button.active:hover {
      background: var(--primary-hover);
    }

    @media (max-width: 600px) {
      .theme-toggle {
        flex-direction: column;
        align-items: stretch;
        gap: 0.25rem;
      }

      .theme-toggle label {
        text-align: center;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadTheme();
    this.applyTheme();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Remove media query listener when component is destroyed
    if (this.mediaQueryListener) {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.mediaQueryListener);
    }
  }

  render() {
    return html`
      <div class="theme-toggle">
        <label>Theme:</label>
        <div class="theme-buttons">
          <button 
            class="${this.currentTheme === 'light' ? 'active' : ''}"
            @click=${() => this.setTheme('light')}
            title="Light mode"
          >
            ☀️ Light
          </button>
          <button 
            class="${this.currentTheme === 'dark' ? 'active' : ''}"
            @click=${() => this.setTheme('dark')}
            title="Dark mode"
          >
            🌙 Dark
          </button>
          <button 
            class="${this.currentTheme === 'system' ? 'active' : ''}"
            @click=${() => this.setTheme('system')}
            title="Use system preference"
          >
            💻 System
          </button>
        </div>
      </div>
    `;
  }

  private loadTheme() {
    const savedTheme = localStorage.getItem('amv-theme') as ThemeMode;
    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
      this.currentTheme = savedTheme;
    } else {
      this.currentTheme = 'system';
    }
  }

  private setTheme(theme: ThemeMode) {
    this.currentTheme = theme;
    localStorage.setItem('amv-theme', theme);
    this.applyTheme();
  }

  private applyTheme() {
    const root = document.documentElement;
    
    if (this.currentTheme === 'system') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      
      // Remove old listener if it exists
      if (this.mediaQueryListener) {
        window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.mediaQueryListener);
      }
      
      // Create and store new listener for system theme changes
      this.mediaQueryListener = (e: MediaQueryListEvent) => {
        if (this.currentTheme === 'system') {
          root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
      };
      
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this.mediaQueryListener);
    } else {
      // Remove listener when not using system theme
      if (this.mediaQueryListener) {
        window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.mediaQueryListener);
        this.mediaQueryListener = undefined;
      }
      root.setAttribute('data-theme', this.currentTheme);
    }
  }
}
