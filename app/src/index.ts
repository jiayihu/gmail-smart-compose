import './index.css';
import Worker from 'worker-loader!./keras.worker';

const form = document.querySelector('form')!;
const input = document.querySelector('input')!;
const button = document.querySelector('button')!;
const pre = document.querySelector('pre')!;

const worker = new Worker();
const channel = new BroadcastChannel('tensorflow');

channel.addEventListener('message', (event) => {
  const message = event.data;
  console.log(message);

  switch (message.type) {
    case 'ACTIVATE': {
      button.disabled = false;
      button.textContent = 'Predict completion';
      return;
    }
    default:
      return;
  }
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = input.value;

  channel.postMessage({
    type: 'DECODE',
    payload: text,
  });
});
