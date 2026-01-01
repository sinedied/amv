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

  @state()
  private ollamaModels: string[] = [];

  @state()
  private isOllamaAvailable = false;

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
      background-color: var(--surface);
      color: var(--text-primary);
    }

    select {
      cursor: pointer;
      width: auto;
      min-width: 200px;
    }

    select:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    textarea {
      resize: vertical;
      min-height: 120px;
    }

    textarea:focus, input:focus, select:focus {
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
    this.loadTemplates();
    this.loadOllamaModels();
  }

  render() {
    return html`
      <div class="form-group">
        <div class="label-with-dropdown">
          <label for="model">AI Model</label>
          <select
            id="model-select"
            .value=${this.getOllamaModelFromInput()}
            @change=${this.handleModelSelectChange}
            ?disabled=${!this.isOllamaAvailable || this.ollamaModels.length === 0}
            title=${!this.isOllamaAvailable ? 'Ollama not available' : this.ollamaModels.length === 0 ? 'No models available' : 'Select an Ollama model'}
          >
            <option value="">Select Ollama model...</option>
            ${this.ollamaModels.map(model => html`
              <option value="${model}">${model}</option>
            `)}
          </select>
        </div>
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

  private async loadOllamaModels() {
    try {
      const response = await fetch('/api/ollama/models');
      const data = await response.json();
      
      if (response.ok && Array.isArray(data.models) && data.models.length > 0) {
        this.ollamaModels = data.models;
        this.isOllamaAvailable = true;
      } else {
        this.ollamaModels = [];
        this.isOllamaAvailable = false;
      }
    } catch (error) {
      console.error('Failed to load Ollama models:', error);
      this.ollamaModels = [];
      this.isOllamaAvailable = false;
    }
  }

  private getOllamaModelFromInput(): string {
    // If the current model doesn't have a prefix (azure: or openai:), it's an Ollama model
    if (!this.model.startsWith('azure:') && !this.model.startsWith('openai:')) {
      return this.model;
    }
    return '';
  }

  private handleModelSelectChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    const selectedModel = target.value;
    
    if (selectedModel) {
      this.model = selectedModel;
      this.saveData();
      
      this.dispatchEvent(new CustomEvent('model-changed', {
        detail: this.model,
        bubbles: true
      }));
    }
  }
}