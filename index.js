const express = require('express');
const fs = require('fs');
const path = require('path');
const { Client } = require('@twilio/rest');
const { OpenAIEmbeddings } = require('langchain/embeddings/openai');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { FAISS } = require('langchain/vectorstores');
const { OpenAI } = require('langchain/llms');
const { load_qa_chain } = require('langchain/chains/question_answering');

// Initialize the app and set the port
const app = express();
const port = 3000;
const UPLOAD_FOLDER = 'pdfs';
app.use(express.static(UPLOAD_FOLDER));
app.use(express.urlencoded({ extended: true }));

// Initialize the Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new Client(accountSid, authToken);
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize variables
let pdfExists = false;
let vectorStore = null;

// Handle incoming messages
app.post('/message', async (req, res) => {
  const mediaContentType = req.body.MediaContentType0;
  const pdfUrl = req.body.MediaUrl0;
  const body = req.body.Body;

  // If the media content type is application/pdf
  if (mediaContentType === 'application/pdf') {
    pdfExists = true;
    const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
    const tempFilePath = path.join(UPLOAD_FOLDER, 'temp.pdf');

    // Write the PDF data to a file
    fs.writeFileSync(tempFilePath, response.data);

    // Extract the text from the PDF file
    const pdf = new PdfReader(tempFilePath);
    let text = '';
    for (let page = 0; page < pdf.numPages; page++) {
      text += pdf.getPage(page).getText();
    }

    // Split the text into chunks and create embeddings
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      lengthFunction: (text) => text.length,
    });
    const chunks = textSplitter.splitText(text);
    const embeddings = new OpenAIEmbeddings();
    vectorStore = await FAISS.fromTexts(chunks, embeddings);

    // Send a response indicating that the PDF has been received
    res.status(200).send('Received, you can now ask your questions');
  } else if (pdfExists) {
    // If the user has provided a question
    if (body) {
      // Find the most relevant chunks and generate an answer
      const docs = vectorStore.similaritySearch(body, 3);
      const llm = new OpenAI({ modelName: 'gpt-3.5-turbo', temperature: 0.4 });
      const chain = load_qa_chain(llm, { chainType: 'stuff' });
      const answer = await chain.run({ inputDocuments: docs, question: body });

      // Send the answer to the user
      const message = await client.messages.create({
        body: answer,
        from: twilioNumber,
        to: req.body.From,
      });
      res.status(200).send(message.sid);
    } else {
      // If the user has not provided a question
      res.status(400).send('No question provided.');
    }
  } else {
    // If the media content type is not application/pdf
    res.status(400).send('The media content type is not application/pdf');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});