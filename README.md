# Gmail Smart Compose

Detailed article explaining the training process and usage in browser: [mail Smart Compose in Keras and Tensorflow.js](https://blog.jiayihu.net/gmail-smart-compose-in-keras-and-tensorflow-js/).

This is study implementation of the Gmail Smart Compose feature, which allows to suggest sentence completion personalized on the user emails.

The seq2seq model has been trained using Tensorflow Keras on Colab and the dataset has been provided by the [Enron email dataset](https://www.kaggle.com/wcukierski/enron-email-dataset). Then the model is saved and loaded in the browser for immediate inference using [Tensorflow.js](https://www.tensorflow.org/js).

In the browser, the model loading and the inference is done within a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) to avoid blocking the main UI thread.

> Note: currently there is [a bug in Tensorflow.js](https://github.com/tensorflow/tfjs/issues/3314), which doesn't support loading TF2.2 RNN GRU models (the Python version used in Colab).

## Files

- `Google_Smart_Compose.ipybn` is the Notebook run on Colab using a GPU instance
- `Load_Smart_Compose_Keras_model.ipybn` is the Notebook which can load the saved model and use it for inference. Can be useful if you prefer to deploy the inference on a server rather than making it in the client browser
- `app` contains the browser related code
  - in `app/public/` there is both the saved models for the Encoder-Decoder and the `Tokenizer` word-to-index dictionary used to preprocess the input
