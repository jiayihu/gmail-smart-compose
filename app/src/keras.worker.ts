import * as tf from '@tensorflow/tfjs';
import * as E from 'fp-ts/lib/Either';
import { array } from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/pipeable';

type WordDict = Record<string, number>;

function requestDictionary(): Promise<WordDict> {
  return fetch('public/word_dict.json').then((response) => response.json());
}

const MAX_INPUT_LENGTH = 21;
const MAX_OUTPUT_LENGTH = 20;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/([.,!?]+)/, ' $1 ')
    .replace(/[^a-zA-Z?.!,]+'/, ' ')
    .replace(/[" "]+/, ' ')
    .trim();
}

function padSequence(tokens: number[], length: number): number[] {
  const padding = new Array(length - tokens.length).fill(0);

  return [...tokens, ...padding];
}

function tokenize(dict: WordDict, text: string): E.Either<string, number[]> {
  const sentence = `<start> ${normalize(text)} <end>`;
  const words = sentence.split(' ');
  const tokens = array.sequence(E.either)(
    words.map((word) => E.fromNullable('Unknown word')(dict[word] || null)),
  );
  const padded = pipe(
    tokens,
    E.chain((tks) => {
      if (tks.length > MAX_INPUT_LENGTH) return E.left('Input is too long');

      return E.right(padSequence(tks, MAX_INPUT_LENGTH));
    }),
  );

  return padded;
}

/**
 * Implementation inspired by tensorflow.js translation example
 * @url {https://github.com/tensorflow/tfjs-examples/blob/8d0400d11bd1b20dbfd5dca7d375400fdec96303/translation/index.js#L131}
 */
function decodeSequence(
  encoderModel: tf.LayersModel,
  inferenceModel: tf.LayersModel,
  dict: WordDict,
  text: string,
): E.Either<string, string> {
  const reverseDict = Object.fromEntries(
    Object.entries(dict).map(([key, value]) => [value, key]),
  );

  return pipe(
    tokenize(dict, text),
    E.map((sequence) => {
      const tensor = [sequence];
      let state = encoderModel.predict(tf.tensor(tensor));

      let targetSeq = tf.tensor([[dict['<start>']]]);
      let currWord = '<start>';
      let decodedSeq = '';
      let i = 0;

      while (currWord !== '<end>' && i < MAX_OUTPUT_LENGTH - 1) {
        const [outputTokens, h] = inferenceModel.predict([
          targetSeq,
          state as any,
        ]);

        const logits = outputTokens.reshape([outputTokens.shape[2]!]);
        const currToken = logits.argMax().dataSync()[0];

        if (currToken === 0) break;

        currWord = reverseDict[currToken];
        decodedSeq += ` ${currWord}`;
        targetSeq = tf.tensor([[currToken]]);
        state = h;
        i += 1;
      }

      console.log(decodedSeq);

      return decodedSeq;
    }),
  );
}

const channel = new BroadcastChannel('tensorflow');

Promise.all([
  requestDictionary(),
  tf.loadLayersModel('public/enc-model/model.json'),
  tf.loadLayersModel('public/inf-model/model.json'),
]).then(([dict, encoderModel, inferenceModel]) => {
  encoderModel.summary();
  inferenceModel.summary();
  channel.postMessage({ type: 'ACTIVATE' });

  channel.addEventListener('message', (event) => {
    const message = event.data;

    switch (message.type) {
      case 'DECODE': {
        const text = message.payload;
        const decodedSeq = decodeSequence(
          encoderModel,
          inferenceModel,
          dict,
          text,
        );

        pipe(
          decodedSeq,
          E.fold(
            (error) => channel.postMessage({ type: 'ERROR', payload: error }),
            (decoded) => {
              //
            },
          ),
        );

        return;
      }
      default:
        return;
    }
  });
});
