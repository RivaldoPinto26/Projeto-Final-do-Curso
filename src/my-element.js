import { LitElement, css, html } from 'lit'

export class MyElement extends LitElement {
  render() {
    return html`
      <form>
        <label for="name">Nome:</label>
        <input type="text" id="name" name="name" required>
        
        <label for="email">Email:</label>
        <input type="email" id="email" name="email" required>
        
        <label for="phone">Telefone:</label>
        <input type="tel" id="phone" name="phone" required>
        
        <label for="dob">Data de Nascimento:</label>
        <input type="date" id="dob" name="dob" required>
        
        <button type="submit">Registrar</button>
      </form>
    `
  }

  static get styles() {
    return css`
      form {
      display: flex;
      flex-direction: column;
      max-width: 300px;
      margin: auto;
    }
    label, input {
      margin-bottom: 10px;
    }
    `
  }
}

window.customElements.define('my-element', MyElement)