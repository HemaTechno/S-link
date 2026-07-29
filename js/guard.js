import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ⚠️ ضع إعدادات الفايربيس هنا أيضاً ⚠️
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// التحقق من حالة المستخدم
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // إذا كان هناك حساب، نتأكد أن الإدارة لم تقم بحظره لاحقاً
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists() || userDoc.data().status !== "approved") {
            // إذا تم تغيير حالته لغير مقبول، يتم طرده لصفحة تسجيل الدخول
            await signOut(auth);
            window.location.href = "/auth.html";
        }
    } else {
        // إذا لم يكن مسجل دخول، يُطرد لصفحة تسجيل الدخول
        window.location.href = "/auth.html";
    }
});
