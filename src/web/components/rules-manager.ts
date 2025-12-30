import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('rules-manager')
export class RulesManager extends LitElement {
  @state()
  private rules = '';

  @state()
  private model = 'ministral-3';

  static styles = css`
    label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
    }

    .form-group {
      margin-bottom: 0.75rem;
    }

    textarea, input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
      box-sizing: border-box;
      background-color: var(--surface);
      color: var(--text-primary);
    }

    textarea {
      resize: vertical;
      min-height: 120px;
    }

    textarea:focus, input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px var(--focus-ring);
    }

    .help-text {
      display: block;
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
      line-height: 1.4;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadData();
  }

  render() {
    return html`
      <div class="form-group">
        <label for="model">AI Model</label>
        <input
          id="model"
          type="text"
          .value=${this.model}
          @input=${this.handleModelChange}
          placeholder="ministral-3, llama3, azure:gpt-4o, etc."
        />
        <small class="help-text">
          Use Ollama models (e.g., ministral-3, llama3) or Azure OpenAI with "azure:" prefix (e.g., azure:gpt-4o, azure:gpt-4o-mini)
        </small>
      </div>
      <div class="form-group">
        <label for="rules">Renaming Rules</label>
        <textarea
          id="rules"
          .value=${this.rules}
          @input=${this.handleRulesChange}
          placeholder="Describe how you want to rename your files. For example:&#10;- Convert to kebab-case&#10;- Remove spaces and special characters&#10;- Add date prefix (YYYY-MM-DD)&#10;- Convert to lowercase"
        ></textarea>
      </div>
    `;
  }

  private handleModelChange(e: Event) {
    const target = e.target as HTMLInputElement;
    this.model = target.value;
    this.saveData();
    
    this.dispatchEvent(new CustomEvent('model-changed', {
      detail: this.model,
      bubbles: true
    }));
  }

  private handleRulesChange(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    this.rules = target.value;
    this.saveData();
    
    this.dispatchEvent(new CustomEvent('rules-changed', {
      detail: this.rules,
      bubbles: true
    }));
  }

  private loadData() {
    const savedRules = localStorage.getItem('amv-rules');
    if (savedRules) {
      this.rules = savedRules;
    }
    
    const savedModel = localStorage.getItem('amv-model');
    if (savedModel) {
      this.model = savedModel;
    }
  }

  private saveData() {
    localStorage.setItem('amv-rules', this.rules);
    localStorage.setItem('amv-model', this.model);
  }

  getRules() {
    return this.rules;
  }

  getModel() {
    return this.model;
  }
}