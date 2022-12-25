import firebase from 'firebase/compat/app';

export default interface Image {
  docID?: string;
  uid: string;
  displayName: string;
  title: string;
  author: string;
  fileName: string;
  url: string;
  timestamp: firebase.firestore.FieldValue;
  pannellum: string;
}
