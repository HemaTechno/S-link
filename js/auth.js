// استيراد وظائف فايربيس
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ⚠️ ضع إعدادات الفايربيس الخاصة بك هنا ⚠️
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

// تهيئة فايربيس
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// تعريف العناصر (Elements)
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const alertBox = document.getElementById('alertBox');

// دالة التبديل بين صفحة الدخول والتسجيل
const toggleForms = () => {
    alertBox.style.display = 'none';
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
};

// ربط أزرار التبديل
document.getElementById('showRegForm').addEventListener('click', toggleForms);
document.getElementById('showLoginForm').addEventListener('click', toggleForms);

// دالة إظهار التنبيهات
const showAlert = (msg, type) => {
    alertBox.textContent = msg;
    alertBox.className = `alert ${type}`;
    alertBox.style.display = 'block';
};

// ==========================================
// 1. نظام التسجيل (إنشاء الحساب)
// ==========================================
document.getElementById('regBtn').addEventListener('click', async () => {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const link = document.getElementById('regLink').value;
    const password = document.getElementById('regPassword').value;
    const btn = document.getElementById('regBtn');

    if (!name || !email || !link || !password) return showAlert("يرجى تعبئة جميع الحقول", "error");

    btn.disabled = true;
    btn.innerHTML = 'جاري الإرسال... <i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        // إنشاء الحساب
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // حفظ البيانات بحالة قيد المراجعة (pending)
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name: name,
            email: email,
            socialLink: link,
            status: "pending", 
            createdAt: serverTimestamp()
        });

        // تسجيل الخروج فوراً لكي لا يتم الدخول المباشر
        await signOut(auth);

        showAlert("تم استلام طلبك بنجاح! حسابك الآن قيد المراجعة.", "success");
        setTimeout(toggleForms, 3000); // العودة لصفحة الدخول

    } catch (error) {
        showAlert(error.message, "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'إرسال الطلب <i class="fa-solid fa-paper-plane"></i>';
    }
});

// ==========================================
// 2. نظام تسجيل الدخول
// ==========================================
document.getElementById('loginBtn').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');

    if (!email || !password) return showAlert("أدخل الإيميل وكلمة المرور", "error");

    btn.disabled = true;
    btn.innerHTML = 'جاري التحقق... <i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        // تسجيل الدخول
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // جلب بيانات المستخدم
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            if (userData.status === "pending") {
                await signOut(auth);
                showAlert("لا يمكنك تسجيل الدخول الآن، حسابك تحت المراجعة من قبل الإدارة.", "warning");
            } else if (userData.status === "approved") {
                showAlert("تم تسجيل الدخول بنجاح! جاري التوجيه...", "success");
                // 🚀 مسار صفحة الدخول بعد الموافقة
                setTimeout(() => window.location.href = "/dashboard.html", 1000); 
            } else {
                await signOut(auth);
                showAlert("حسابك محظور أو مرفوض.", "error");
            }
        } else {
            await signOut(auth);
            showAlert("لم يتم العثور على بيانات هذا الحساب.", "error");
        }

    } catch (error) {
        showAlert("الإيميل أو كلمة المرور غير صحيحة", "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'دخول <i class="fa-solid fa-arrow-left"></i>';
    }
});
