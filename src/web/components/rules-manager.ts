import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface Template {
  name: string;
  filename: string;
}

@customElement('rules-manager')
export class RulesManager extends LitElement {
  @state()
  private rules = '';

  @state()
  private model = 'ministral-3';

  @state()
  private templates: Template[] = [];

  @state()
  private selectedTemplate = '';

  static styles = css`
    label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
    }

    .label-with-dropdown {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .label-with-dropdown label {
      margin-bottom: 0;
    }

    .form-group {
      margin-bottom: 0.75rem;
    }

    textarea, input, select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    select {
      background-color: white;
      cursor: pointer;
      width: auto;
      min-width: 200px;
    }

    textarea {
      resize: vertical;
      min-height: 120px;
    }

    textarea:focus, input:focus, select:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgb(79 70 229 / 0.1);
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
    this.loadTemplates();
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
          placeholder="ministral-3, llama3, azure:gpt-4o, openai:gpt-4o, etc."
        />
        <small class="help-text">
          Use Ollama models (e.g., ministral-3, llama3), OpenAI with "openai:" prefix (e.g., openai:gpt-4o, openai:gpt-4o-mini), or Azure OpenAI with "azure:" prefix (e.g., azure:gpt-4o)
        </small>
      </div>
      <div class="form-group">
        <div class="label-with-dropdown">
          <label for="rules">Renaming Rules</label>
          <select
            id="template-select"
            .value=${this.selectedTemplate}
            @change=${this.handleTemplateChange}
          >
            <option value="">Select a template...</option>
            ${this.templates.map(template => html`
              <option value="${template.name}">${template.name}</option>
            `)}
          </select>
        </div>
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

  private async loadTemplates() {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      this.templates = data.templates || [];
    } catch (error) {
      console.error('Failed to load templates:', error);
      this.templates = [];
    }
  }

  private async handleTemplateChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    this.selectedTemplate = target.value;
    
    if (!this.selectedTemplate) {
      return;
    }
    
    try {
      const response = await fetch(`/api/templates/${this.selectedTemplate}`);
      const data = await response.json();
      
      if (data.content) {
        this.rules = data.content;
        this.saveData();
        
        this.dispatchEvent(new CustomEvent('rules-changed', {
          detail: this.rules,
          bubbles: true
        }));
      }
    } catch (error) {
      console.error('Failed to load template content:', error);
    }
  }
}