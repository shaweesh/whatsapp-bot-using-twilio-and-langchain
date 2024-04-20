# WhatsApp Bot using Twilio and Langchain

This is a simple WhatsApp bot that uses Twilio for handling messages and Langchain for processing the text. The bot can receive PDF files, extract the text from them, and answer questions based on the content of the PDF files.

## Getting Started

1. **Install the necessary dependencies**

Create a new directory and save the `package.json` file in that directory. Then, run `npm install` to install the necessary dependencies.

2. **Set the environment variables**

Set the following environment variables:

- `TWILIO_ACCOUNT_SID`: Your Twilio account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio auth token
- `TWILIO_PHONE_NUMBER`: Your Twilio phone number
- `OPENAI_API_KEY`: Your OpenAI API key

3. **Start the bot**

Save the Node.js code in a file named `index.js` in the same directory and run `npm start` to start the bot.

## How it Works

The bot listens for incoming messages on the Twilio webhook. When it receives a message, it checks if the message contains a PDF file. If it does, the bot extracts the text from the PDF file, splits it into chunks, creates embeddings for each chunk, and stores them in a FAISS index.

When the user sends a question, the bot performs a similarity search on the FAISS index to find the most relevant chunks. It then uses the OpenAI LLM to generate an answer based on the relevant chunks.

## License

This project is licensed under the ISC License.
