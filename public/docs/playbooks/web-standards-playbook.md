# Web Standards Playbook

## Frontend

Use HTML imports. Don't use `vite`.

### Local Development

Use `live-server` to serve the website locally.

```sh
npx live-server .
```

### HTML & JavaScript

HTML files can import .js files directly.

```html
<html>
  <body>
    <h1 id="app">Hello, world!</h1>
    <script type="module" src="./frontend.js"></script>
  </body>
</html>
```

With the following `frontend.js`:

```js
// import .css files directly and it works
import "./index.css";

const app = document.getElementById("app");
if (app) {
  app.textContent = "Hello from Vanilla JS!";
}
```

### Deployment

> [!NOTE]
> The site is deployed to a standard web server on the Internet.

### Bun Usage

> [!NOTE]
> Bun is used to drive the graph database ingestion pipeline, not for serving the frontend.
