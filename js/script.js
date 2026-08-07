let fetchedImage = "";

// خيارات الإجراءات المتاحة لكل منصة
const taskOptions = {
    youtube: ["Subscribe Channel", "Like Video", "Turn Bell On", "Comment"],
    telegram: ["Join Channel", "Join Group"],
    instagram: ["Follow Profile", "Like Post"],
    tiktok: ["Follow Account", "Like Video"],
    discord: ["Join Server"]
};

// 1. إضافة صف مهمة جديد ديناميكياً
function addTaskRow() {
    const tasksList = document.getElementById("tasksList");
    if (!tasksList) return;

    const rowId = Date.now();
    
    const div = document.createElement("div");
    div.className = "task-row";
    div.id = `task-${rowId}`;
    div.innerHTML = `
        <select onchange="updateTaskAction('${rowId}')" class="platform-select">
            <option value="youtube">YouTube</option>
            <option value="telegram">Telegram</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="discord">Discord</option>
        </select>
        <select class="action-select" onchange="updatePreview()"></select>
        <input type="url" placeholder="Task Target URL (https://...)" class="task-link" oninput="updatePreview()">
        <button type="button" onclick="removeTask('${rowId}')" style="background:#ff4d4d; color:#fff; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:bold;">✕</button>
    `;
    tasksList.appendChild(div);
    updateTaskAction(rowId);
    updatePreview();
}

// 2. تحديث خيارات الإجراء عند تغيير المنصة
function updateTaskAction(rowId) {
    const row = document.getElementById(`task-${rowId}`);
    if (!row) return;

    const platform = row.querySelector(".platform-select").value;
    const actionSelect = row.querySelector(".action-select");
    
    actionSelect.innerHTML = taskOptions[platform]
        .map(act => `<option value="${act}">${act}</option>`).join("");
    updatePreview();
}

// 3. حذف مهمة من القائمة
function removeTask(rowId) {
    const row = document.getElementById(`task-${rowId}`);
    if (row) row.remove();
    updatePreview();
}

// 4. جلب العنوان والصورة المصغرة تلقائياً من يوتيوب
async function fetchYoutubeData() {
    const ytUrlInput = document.getElementById("mediaUrl");
    if (!ytUrlInput) return;

    const ytUrl = ytUrlInput.value.trim();
    if (!ytUrl) {
        alert("من فضلك أدخل رابط فيديو اليوتيوب أولاً");
        return;
    }

    try {
        const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(ytUrl)}`);
        const data = await res.json();
        
        if (data.title) {
            document.getElementById("title").value = data.title;
            if (data.thumbnail_url) {
                fetchedImage = data.thumbnail_url;
            }
            updatePreview();
        } else {
            alert("تعذر جلب بيانات الفيديو، تأكد من صحة الرابط.");
        }
    } catch (e) {
        alert("حدث خطأ أثناء جلب بيانات الفيديو من يوتيوب.");
    }
}

// 5. تحديث المعاينة الحية (Live Page Preview)
function updatePreview() {
    const titleVal = document.getElementById("title")?.value || "Title Preview";
    const descVal = document.getElementById("description")?.value || "Description preview will show here...";
    const prevImg = document.getElementById("prevImg");
    
    const prevTitle = document.getElementById("prevTitle");
    const prevDesc = document.getElementById("prevDesc");

    if (prevTitle) prevTitle.innerText = titleVal;
    if (prevDesc) prevDesc.innerText = descVal;

    if (prevImg) {
        if (fetchedImage) {
            prevImg.src = fetchedImage;
            prevImg.style.display = "block";
        } else {
            prevImg.style.display = "none";
        }
    }

    // عرض معاينة المهام المضافة
    const prevTasks = document.getElementById("prevTasks");
    if (prevTasks) {
        prevTasks.innerHTML = "";
        document.querySelectorAll(".task-row").forEach(row => {
            const platform = row.querySelector(".platform-select").value;
            const action = row.querySelector(".action-select").value;
            const link = row.querySelector(".task-link").value;

            if (link) {
                const taskDiv = document.createElement("div");
                taskDiv.className = "preview-task";
                taskDiv.style.cssText = "background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 8px; font-size: 13px; margin-top: 5px; display: flex; justify-content: space-between; align-items: center;";
                taskDiv.innerHTML = `<span><i class="fa-brands fa-${platform}"></i> ${action}</span> <i class="fa-solid fa-lock"></i>`;
                prevTasks.appendChild(taskDiv);
            }
        });
    }
}

// 6. معالجة وإنشاء الرابط مع السيرفر
async function processLock() {
    const button = document.getElementById("shortBtn");
    const title = document.getElementById("title")?.value.trim();
    const description = document.getElementById("description")?.value.trim();
    const targetUrl = document.getElementById("targetUrl")?.value.trim();
    const monetization = document.getElementById("monetization")?.value;
    const slug = document.getElementById("slug")?.value.trim();

    // تجميع المهام المضافة
    const tasks = [];
    document.querySelectorAll(".task-row").forEach(row => {
        const link = row.querySelector(".task-link").value.trim();
        if (link) {
            tasks.push({
                platform: row.querySelector(".platform-select").value,
                action: row.querySelector(".action-select").value,
                link: link
            });
        }
    });

    if (!title) {
        alert("من فضلك أدخل عنوان الرابط");
        return;
    }

    if (!targetUrl) {
        alert("من فضلك أدخل الرابط أو النص المراد قفله");
        return;
    }

    button.disabled = true;
    button.innerText = "جاري إنشاء الرابط...";

    try {
        const response = await fetch("/api/link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                title, 
                description, 
                image: fetchedImage, 
                targetUrl, 
                monetization, 
                tasks,
                slug 
            })
        });
        
        const data = await response.json();
        button.disabled = false;
        button.innerText = "إنشاء الرابط";

        if (data.success) {
            const finalUrlInput = document.getElementById("finalUrl");
            const successBox = document.getElementById("successBox");
            if (finalUrlInput && successBox) {
                finalUrlInput.value = data.short;
                successBox.style.display = "block";
            } else {
                alert(`✅ تم إنشاء الرابط بنجاح:\n${data.short}`);
            }
        } else {
            alert(`❌ خطأ: ${data.message}`);
        }
    } catch (e) {
        button.disabled = false;
        button.innerText = "إنشاء الرابط";
        alert("حدث خطأ أثناء الاتصال بالسيرفر");
    }
}

// 7. نسخ الرابط إلى الحافظة
function copyLink() {
    const copyText = document.getElementById("finalUrl");
    if (!copyText) return;

    copyText.select();
    navigator.clipboard.writeText(copyText.value);
    
    const copyBtn = document.querySelector('.copy-btn');
    if (copyBtn) {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    }
}
