// api/hello.js
export default function handler(req, res) {
  // Set the response as plain text and send your message
  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send('Hello from your fronted Vercel app!');
}
