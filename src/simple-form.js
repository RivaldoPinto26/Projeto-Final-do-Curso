import { LitElement, html, css } from 'lit';

export class SimpleForm extends LitElement {
  static styles = css`
    form {
      display: flex;
      flex-direction: column;
      gap: 15px;
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    label {
      font-weight: bold;
      margin-bottom: 5px;
    }
    input {
      padding: 10px;
      font-size: 16px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    button {
      padding: 10px;
      font-size: 16px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background-color: #0056b3;
    }
  `;

  constructor() {
    super();
    this.name = '';
    this.email = '';
    this.phone = '';
    this.dob = '';
  }

  handleInput(event) {
    const { name, value } = event.target;
    this[name] = value;
  }

  handleSubmit(event) {
    event.preventDefault();

    const formData = {
      name: this.name,
      email: this.email,
      phone: this.phone,
      dob: this.dob,
    };

    // Tenta enviar diretamente para o endpoint
    fetch('http://localhost:3000/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
      .then(response => {
        if (!response.ok) throw new Error('Falha no servidor');
        // Limpa o formulário se enviar com sucesso
        this.resetForm();
      })
      .catch(error => {
        console.error('Falha ao enviar:', error);
      });
  }

  resetForm() {
    this.name = '';
    this.email = '';
    this.phone = '';
    this.dob = '';
    this.requestUpdate();
  }
  render() {
    return html`
      <form @submit=${this.handleSubmit}>
        <label for="name">Name:</label>
        <input
          type="text"
          id="name"
          name="name"
          .value=${this.name}
          @input=${this.handleInput}
          required
        />

        <label for="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          .value=${this.email}
          @input=${this.handleInput}
          required
        />

        <label for="phone">Phone:</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          .value=${this.phone}
          @input=${this.handleInput}
          required
        />

        <label for="dob">Date of Birth:</label>
        <input
          type="date"
          id="dob"
          name="dob"
          .value=${this.dob}
          @input=${this.handleInput}
          required
        />

        <button type="submit">Submit</button>
      </form>
    `;
  }
}

customElements.define('simple-form', SimpleForm);
