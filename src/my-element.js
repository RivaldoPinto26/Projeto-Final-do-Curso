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

  async handleSubmit(event) {
    event.preventDefault();

    const formData = {
      name: this.name,
      email: this.email,
      phone: this.phone,
      dob: this.dob,
    };

    if (navigator.onLine) {
      // If online, send data to the server
      await this.sendToServer(formData);
    } else {
      // If offline, store data in localStorage
      this.storeOfflineData(formData);
    }

    // Clear the form
    this.name = '';
    this.email = '';
    this.phone = '';
    this.dob = '';
    this.requestUpdate();
  }

  async sendToServer(data) {
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        console.log('Data sent to server:', data);
      } else {
        throw new Error('Failed to send data to server');
      }
    } catch (error) {
      console.error('Error sending data to server:', error);
      this.storeOfflineData(data); // Fallback to storing offline
    }
  }

  storeOfflineData(data) {
    const offlineData = JSON.parse(localStorage.getItem('offlineData') || '[]');
    offlineData.push(data);
    localStorage.setItem('offlineData', JSON.stringify(offlineData));
    console.log('Data stored offline:', data);
  }

  render() {
    return html`
      <form @submit=${this.handleSubmit}>
        <label for="name">Name:</label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="Enter your name"
          .value=${this.name}
          @input=${this.handleInput}
          required
        />

        <label for="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Enter your email"
          .value=${this.email}
          @input=${this.handleInput}
          required
        />

        <label for="phone">Phone:</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          placeholder="Enter your phone number"
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