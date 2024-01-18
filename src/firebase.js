import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyAucMqjb1L3CqhpGMnOW7O80LEABVvJ0YE',
  authDomain: 'todosproject-8fc5f.firebaseapp.com',
  projectId: 'todosproject-8fc5f',
  storageBucket: 'todosproject-8fc5f.appspot.com',
  messagingSenderId: '72769960764',
  appId: '1:72769960764:web:470a7c34ed728700237c39',
  databaseURL: 'https://todosproject-8fc5f-default-rtdb.europe-west1.firebasedatabase.app/'
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app)