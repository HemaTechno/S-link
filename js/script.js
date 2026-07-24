const urlInput = document.getElementById("url");
const slugInput = document.getElementById("slug");
const tierInput = document.getElementById("tier");   // العنصر الجديد للـ Tier
const tasksInput = document.getElementById("tasks"); // العنصر الجديد للمهام
const result = document.getElementById("result");
const loading = document.getElementById("loading");
const button = document.getElementById("shortBtn");

async function shorten() {

    const url = urlInput.value.trim();
    const slug = slugInput.value.trim();
    // جلب القيم وتحويلها لأرقام صحيحة لتتوافق مع السيرفر
    const tier = parseInt(tierInput.value);
    const tasks = parseInt(tasksInput.value);

    result.innerHTML = "";

    if (!url) {
        showError("من فضلك أدخل الرابط");
        return;
    }

    try {

        new URL(url);

    } catch {

        showError("الرابط غير صحيح");
        return;

    }

    button.disabled = true;
    button.innerText = "جاري الاختصار...";
    loading.style.display = "block";

    try {

        const response = await fetch("/api/link", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                url,
                slug,
                tier,  // إرسال الـ Tier الجديد
                tasks  // إرسال عدد المهام الجديد
            })
        });

        const data = await response.json();

        loading.style.display = "none";
        button.disabled = false;
        button.innerText = "اختصار الرابط";

        if (!data.success) {
            showError(data.message);
            return;
        }

        result.innerHTML = `
            <div class="success-box">
                <p>✅ تم إنشاء الرابط</p>

                <input
                    id="shortLink"
                    value="${data.short}"
                    readonly>

                <button onclick="copyLink()">
                    📋 نسخ الرابط
                </button>
            </div>
        `;

    } catch (e) {

        loading.style.display = "none";
        button.disabled = false;
        button.innerText = "اختصار الرابط";

        showError("حدث خطأ أثناء الاتصال بالسيرفر");

    }

}

function copyLink() {

    const input = document.getElementById("shortLink");

    input.select();
    input.setSelectionRange(0, 99999);

    navigator.clipboard.writeText(input.value);

    alert("تم نسخ الرابط ✅");

}

function showError(message) {

    result.innerHTML = `
        <div class="error-box">
            ❌ ${message}
        </div>
    `;

}

urlInput.addEventListener("keydown", function (e) {

    if (e.key === "Enter")
        shorten(); 

});

slugInput.addEventListener("keydown", function (e) {

    if (e.key === "Enter")
        shorten();

}); 
