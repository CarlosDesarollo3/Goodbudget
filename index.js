import { registerRootComponent } from 'expo';
import FormData from 'react-native/Libraries/Network/FormData';
import App from './App';

if (globalThis.FormData == null) {
  globalThis.FormData = FormData;
}

registerRootComponent(App);
