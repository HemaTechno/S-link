let fetchedImage = "";
let taskCounter = 0;

// قائمة الإجراءات السريعة الجاهزة لكل منصة
const platformPresets = {
  youtube: ["Subscribe Channel", "Like Video", "Watch Video", "Comment"],
  discord: ["Join Server", "Accept Invite", "Boost Server"],
  telegram: ["Join Channel", "Join Group"],
  tiktok: ["Follow Account", "Like Video"],
  instagram: ["Follow Profile", "Like Post"],
  facebook: ["Like Page", "Follow Page", "Join Group"],
  link: ["Visit Website", "Read Article", "Download File"]
};

// 1. إضافة كارت مهمة جديد بأسلوب الكروت واسعة المساحة والمنصات التفاعلية
function addTaskCard() {
  taskCounter++;
  const cardId = `task-item-${taskCounter}`;
  const container = document.getElementById('tasksContainer');
  if (!container) return;

  const cardHtml = `
    <div class="task-item-card" id="${cardId}" data-selected-platform="youtube">
      <div class="task-card-header">
        <span class="task-number-badge">Task Step #${taskCounter}</span>
        <button type="button" class="btn-remove-task" onclick="removeTaskCard('${cardId}')">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>

      <!-- شبكة اختيار المنصة بالأيقونات واللوجو -->
      <div class="app-selector-grid">
        <div class="app-chip selected" data-platform="youtube" onclick="selectPlatform('${cardId}', 'youtube')">
          <i class="fa-brands fa-youtube"></i>
          <span>YouTube</span>
        </div>
        <div class="app-chip" data-platform="discord" onclick="selectPlatform('${cardId}', 'discord')">
          <i class="fa-brands fa-discord"></i>
          <span>Discord</span>
        </div>
        <div class="app-chip" data-platform="telegram" onclick="selectPlatform('${cardId}', 'telegram')">
          <i class="fa-brands fa-telegram"></i>
          <span>Telegram</span>
        </div>
        <div class="app-chip" data-platform="tiktok" onclick="selectPlatform('${cardId}', 'tiktok')">
          <i class="fa-brands fa-tiktok"></i>
          <span>TikTok</span>
        </div>
        <div class="app-chip" data-platform="instagram" onclick="selectPlatform('${cardId}', 'instagram')">
          <i class="fa-brands fa-instagram"></i>
          <span>Instagram</span>
        </div>
        <div class="app-chip" data-platform="facebook" onclick="selectPlatform('${cardId}', 'facebook')">
          <i class="fa-brands fa-facebook"></i>
          <span>Facebook</span>
        </div>
        <div class="app-chip" data-platform="link" onclick="selectPlatform('${cardId}', 'link')">
          <i class="fa-solid fa-globe"></i>
          <span>Website</span>
        </div>
      </div>

      <!-- أزرار اختيار المهمة السريعة -->
      <div class="action-presets-wrap" id="presets-${cardId}"></div>

      <!-- عنوان المهمة والتعديل اليدوي -->
      <div class="input-group" style="margin-bottom: 0;">
        <input type="text" class="task-action-input" id="action-input-${cardId}" placeholder="Action Title (e.g., Subscribe Channel)" oninput="updatePreview()">
        <i class="fa-solid fa-heading input-icon"></i>
      </div>

      <!-- رابط المهمة -->
      <div class="input-group" style="margin-bottom: 0;">
        <input type="url" class="task-link-input" placeholder="Target Link (https://...)" oninput="updatePreview()">
        <i class="fa-solid fa-link input-icon"></i>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', cardHtml);
  renderPresets(cardId, 'youtube');
  updatePreview();
}

// 2. تغيير المنصة المحددة للكارت
function selectPlatform(cardId, platform) {
  const card = document.getElementById(cardId);
  if (!card) return;

  const chips = card.querySelectorAll('.app-chip');
  chips.forEach(chip => chip.classList.remove('selected'));

  const selectedChip = card.querySelector(`[data-platform="${platform}"]`);
  if (selectedChip) selectedChip.classList.add('selected');

  card.setAttribute('data-selected-platform', platform);
  renderPresets(cardId, platform);
  updatePreview();
}

// 3. بناء وتوليد أزرار الإجراءات السريعة بناءً على المنصة المختارة
function renderPresets(cardId, platform) {
  const presetsWrap = document.getElementById(`presets-${cardId}`);
  if (!presetsWrap) return;

  const presets = platformPresets[platform] || platformPresets['link'];
  presetsWrap.innerHTML = presets.map((action, idx) => `
    <button type="button" class="preset-btn ${idx === 0 ? 'active' : ''}" onclick="applyPreset('${cardId}', '${action}', this)">
      ${action}
    </button>
  `).join('');

  const actionInput = document.getElementById(`action-input-${cardId}`);
  if (actionInput) actionInput.value = presets[0];
}

// 4. تطبيق الخيار السريع المختار على حقل إدخال عنوان المهمة
function applyPreset(cardId, actionText, btnElement) {
  const card = document.getElementById(cardId);
  if (!card) return;

  const actionInput = document.getElementById(`action-input-${cardId}`);
  if (actionInput) actionInput.value = actionText;

  const presetBtns = card.querySelectorAll('.preset-btn');
  presetBtns.forEach(btn => btn.classList.remove('active'));
  btnElement.classList.add('active');

  updatePreview();
}

// 5. حذف كارت مهمة
function removeTaskCard(cardId) {
  const card = document.getElementById(cardId);
  if (card) card.remove();
  updatePreview();
}

// 6. اختيار شبكة الربح (Single Choice Toggle)
function selectNetwork(val, element) {
  const input = document.getElementById('monetization');
  if (input) input.value = val;

  const cards = document.querySelectorAll('.network-card');
  cards.forEach(card => card.classList.remove('selected'));
  if (element) element.classList.add('selected');
}

// 7. جلب بيانات يوتيوب تلقائياً
async function fetchYoutubeData() {
  const mediaInput = document.getElementById("mediaUrl");
  if (!mediaInput) return;

  const ytUrl = mediaInput.value.trim();
  if (!ytUrl) {
    alert("من فضلك أدخل رابط فيديو اليوتيوب أولاً");
    return;
  }

  try {
    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(ytUrl)}`);
    const data = await res.json();

    if (data.title) {
      const titleInput = document.getElementById("title");
      if (titleInput && !titleInput.value.trim()) {
        titleInput.value = data.title;
      }

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

// 8. تحديث المعاينة الحية (Live Preview) فورياً
function updatePreview() {
  const titleVal = document.getElementById("title")?.value || "";
  const descVal = document.getElementById("description")?.value || "";
  const mediaVal = document.getElementById("mediaUrl")?.value || "";

  const prevTitle = document.getElementById("prevTitle");
  const prevDesc = document.getElementById("prevDesc");
  const prevImg = document.getElementById("prevImg");

  if (prevTitle) prevTitle.innerText = titleVal.trim() !== "" ? titleVal : "Title Preview";
  if (prevDesc) prevDesc.innerText = descVal.trim() !== "" ? descVal : "Description preview will show here...";

  if (prevImg) {
    const displayImg = fetchedImage || mediaVal.trim();
    if (displayImg) {
      prevImg.src = displayImg;
      prevImg.style.display = "block";
    } else {
      prevImg.style.display = "none";
    }
  }

  // تحديث قائمة المهام في الـ Preview
  const prevTasksContainer = document.getElementById("prevTasks");
  if (prevTasksContainer) {
    prevTasksContainer.innerHTML = "";

    const taskCards = document.querySelectorAll(".task-item-card");
    taskCards.forEach((card, index) => {
      const platform = card.getAttribute("data-selected-platform") || "youtube";
      const actionInput = card.querySelector(".task-action-input");
      const actionText = actionInput && actionInput.value.trim() !== "" ? actionInput.value : `Task Step #${index + 1}`;

      let iconClass = "fa-brands fa-youtube";
      if (platform === "discord") iconClass = "fa-brands fa-discord";
      else if (platform === "telegram") iconClass = "fa-brands fa-telegram";
      else if (platform === "tiktok") iconClass = "fa-brands fa-tiktok";
      else if (platform === "instagram") iconClass = "fa-brands fa-instagram";
      else if (platform === "facebook") iconClass = "fa-brands fa-facebook";
      else if (platform === "link") iconClass = "fa-solid fa-globe";

      prevTasksContainer.innerHTML += `
        <div class="preview-task">
          <div style="display:flex; align-items:center; gap:8px;">
            <i class="${iconClass}" style="color: var(--theme-blue); font-size:14px;"></i>
            <span style="font-weight:700; color:#fff;">${actionText}</span>
          </div>
          <i class="fa-solid fa-chevron-right" style="color: var(--text-sub); font-size:11px;"></i>
        </div>
      `;
    });
  }
}

// 9. إنشاء القفل وإرسال البيانات للسيرفر
async function processLock() {
  const button = document.getElementById("shortBtn");
  const title = document.getElementById("title")?.value.trim();
  const description = document.getElementById("description")?.value.trim();
  const targetUrl = document.getElementById("targetUrl")?.value.trim();
  const mediaUrl = document.getElementById("mediaUrl")?.value.trim();
  const monetization = document.getElementById("monetization")?.value || "just";
  const slug = document.getElementById("slug")?.value.trim();

  if (!title) {
    alert("من فضلك أدخل عنوان الرابط");
    return;
  }

  if (!targetUrl) {
    alert("من فضلك أدخل الرابط أو النص المراد قفله");
    return;
  }

  // تجميع كافة كروت المهام
  const tasks = [];
  const taskCards = document.querySelectorAll(".task-item-card");
  taskCards.forEach(card => {
    const platform = card.getAttribute("data-selected-platform") || "youtube";
    const action = card.querySelector(".task-action-input")?.value.trim() || "Complete Step";
    const link = card.querySelector(".task-link-input")?.value.trim() || "";

    if (link && link !== "#") {
      tasks.push({ platform, action, link });
    }
  });

  const finalImage = fetchedImage || mediaUrl;

  button.disabled = true;
  button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Link...';

  try {
    const response = await fetch("/api/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        image: finalImage,
        targetUrl,
        monetization,
        tasks,
        slug
      })
    });

    const data = await response.json();
    button.disabled = false;
    button.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Create Content Locker';

    if (data.success) {
      const finalUrlInput = document.getElementById("finalUrl");
      const successBox = document.getElementById("successBox");
      if (finalUrlInput && successBox) {
        finalUrlInput.value = data.short;
        successBox.style.display = "block";
        successBox.scrollIntoView({ behavior: "smooth" });
      } else {
        alert(`✅ تم إنشاء الرابط بنجاح:\n${data.short}`);
      }
    } else {
      alert(`❌ خطأ: ${data.message}`);
    }
  } catch (e) {
    button.disabled = false;
    button.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Create Content Locker';
    alert("حدث خطأ أثناء الاتصال بالسيرفر");
  }
}

// 10. نسخ الرابط للحافظة
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

// إضافة الكارت الأول افتراضياً عند تحميل الصفحة
window.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("tasksContainer") && document.querySelectorAll(".task-item-card").length === 0) {
    addTaskCard();
  }
});
