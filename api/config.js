// 1. إعدادات وتكوين Firebase الخاصة بمشروعك
const firebaseConfig = {
  apiKey: "AIzaSyBoPJbx5v6EkOqxOJkbhzHqIJdAByh79Rg",
  authDomain: "hhhhhh-d4fb8.firebaseapp.com",
  databaseURL: "https://hhhhhh-d4fb8-default-rtdb.firebaseio.com",
  projectId: "hhhhhh-d4fb8",
  storageBucket: "hhhhhh-d4fb8.appspot.com",
  messagingSenderId: "24512338206",
  appId: "1:24512338206:web:dfe045db59bd3434a2110f",
  measurementId: "G-HD4R7GNQ5H"
};

// 2. تفعيل الفايربيس وقاعدة البيانات
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
