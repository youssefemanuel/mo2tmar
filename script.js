/* ============================================================
           إعدادات Firebase — عشان الكل يشوف نفس البيانات بنفس اللينك
           ============================================================
           الخطوات (5 دقايق ومجاني):
           1) روح https://console.firebase.google.com/ وسجل دخول بجيميل
              واعمل "Add project" (مشروع جديد باسم أي حاجة).
           2) من القايمة الجانبية: Build > Realtime Database > Create Database
              اختار أي location، وبعدين اختار "Start in test mode".
           3) من الترس بجانب "Project Overview" > Project settings،
              انزل تحت لحد "Your apps" واضغط أيقونة الويب </> وسجل اسم للتطبيق.
              هيديك object فيه القيم دي، انسخها وحطها مكان القيم تحت.
           4) بعد التجربة، متنساش تظبط الـ Rules في Realtime Database بعد فترة
              (test mode بيفتح القراءة/الكتابة للجميع لمدة 30 يوم بس، بعدها
              لازم تظبطها إنها تفضل مفتوحة يدويًا لو عايز اللينك يفضل شغال).
           ============================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyAsdFjnuKhpZU12aDtcBtEcVuFsM0pwXZc",
  authDomain: "moatmar-bbb4a.firebaseapp.com",
  databaseURL: "https://moatmar-bbb4a-default-rtdb.firebaseio.com",
  projectId: "moatmar-bbb4a",
  storageBucket: "moatmar-bbb4a.firebasestorage.app",
  messagingSenderId: "130073397072",
  appId: "1:130073397072:web:75dad06b542fb39694ce55",
};
let groupsRef = null;
try {
  firebase.initializeApp(firebaseConfig);
  groupsRef = firebase.database().ref("camp_groups");
} catch (e) {
  console.error("Firebase init failed:", e);
}

const COLORS = ["#dc2743", "#0095f6", "#2e7d32"];
const DEFAULTS = [
  {
    name: "Group 1",
    handle: "@group_one",
    bio: "Camp 2026 · أصل ولا صورة؟",
    photo: "",
    followers: 0,
    actions: 0,
    posts: [],
    notifs: [],
  },
  {
    name: "Group 2",
    handle: "@group_two",
    bio: "Camp 2026 · أصل ولا صورة؟",
    photo: "",
    followers: 0,
    actions: 0,
    posts: [],
    notifs: [],
  },
  {
    name: "Group 3",
    handle: "@group_three",
    bio: "Camp 2026 · أصل ولا صورة؟",
    photo: "",
    followers: 0,
    actions: 0,
    posts: [],
    notifs: [],
  },
];
let groups = [];
let activeIndex = null;
let displayMode = false;

function load() {
  if (!groupsRef) {
    // Firebase مش متظبط — استخدم نسخة محلية مؤقتة عشان الصفحة تشتغل
    groups = JSON.parse(JSON.stringify(DEFAULTS));
    render();
    alert(
      "لسه ماظبطتش إعدادات Firebase في script.js، فالبيانات دلوقتي هتفضل محلية بس مش مشتركة. راجع التعليمات في أول الملف.",
    );
    return;
  }
  groupsRef.on(
    "value",
    (snapshot) => {
      const data = snapshot.val();
      if (data) {
        groups = data;
      } else {
        groups = JSON.parse(JSON.stringify(DEFAULTS));
        groupsRef.set(groups);
      }
      groups.forEach((g) => {
        if (typeof g.actions !== "number") g.actions = 0;
        if (typeof g.followers !== "number") g.followers = 0;
        if (!Array.isArray(g.notifs)) g.notifs = [];
        if (!Array.isArray(g.posts)) g.posts = [];
        g.posts = g.posts.map((p) => ({
          cap: p.cap || p.caption || "",
          photo: p.photo || "",
          followersAdded: Number(p.followersAdded || 0),
          createdAt: p.createdAt || Date.now(),
        }));
      });
      render();
    },
    (error) => {
      console.error("Firebase read failed:", error);
      alert(
        "مقدرش أوصل لقاعدة البيانات. تأكد إن الإنترنت شغال وإن إعدادات Firebase في script.js صح.",
      );
    },
  );
}
// save(i): يكتب بس بيانات الجروب رقم i في فايربيز، مش كل الأراي.
// ده أهم تعديل هنا: كتابة الأراي كله (groupsRef.set(groups)) كانت بتمسح
// أي تعديل عمله حد تاني على جروب مختلف في نفس اللحظة تقريبًا (race condition).
function save(i) {
  if (!groupsRef) return;
  try {
    if (typeof i === "number") {
      groupsRef.child(i).set(groups[i]);
    } else {
      // استخدام كامل بس لعمليات مقصود فيها الكتابة فوق كل حاجة (Reset / Import)
      groupsRef.set(groups);
    }
  } catch (e) {
    console.error(e);
  }
}

// تحديث رقم (actions/followers) بأمان حتى لو اتنين ضغطوا في نفس اللحظة،
// بيستخدم Firebase transaction بدل ما يعتمد على النسخة المحلية القديمة.
function saveCounter(i, field, newValue) {
  if (!groupsRef) return;
  groupsRef
    .child(i)
    .child(field)
    .transaction(() => newValue);
}

function initials(n) {
  return n
    .split(" ")
    .map((w) => w[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// MODIFICATION: keep card order fixed and only update rank badges
function render() {
  const c = document.getElementById("container");
  c.innerHTML = "";

  const ranked = groups
    .map((g, index) => ({ g, index }))
    .sort((a, b) => {
      if (b.g.followers !== a.g.followers) return b.g.followers - a.g.followers;
      return b.g.actions - a.g.actions;
    });

  const rankByOriginalIndex = new Map();
  ranked.forEach((entry, rankIndex) => {
    rankByOriginalIndex.set(entry.index, rankIndex);
  });

  groups.forEach((g, index) => {
    const rankIndex = rankByOriginalIndex.get(index) ?? index;
    const i = index;
    const color = COLORS[i % 3];
    const card = document.createElement("div");
    card.className = `profile rank-${rankIndex + 1}`;
    const avatar = g.photo
      ? `<img class="avatar" src="${g.photo}" onerror="this.style.display='none'">`
      : `<div class="avatar-ph" style="background:${color}">${initials(g.name)}</div>`;

    const sortedPosts = (g.posts || [])
      .slice()
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const cells = sortedPosts
      .map((p) => {
        const originalIndex = g.posts.indexOf(p);
        const meta = [];
        const followersAdded = Number(p.followersAdded || 0);
        const timeText = p.createdAt ? formatTime(p.createdAt) : "";
        if (followersAdded) meta.push(`👥 +${followersAdded.toLocaleString()} Followers`);
        if (timeText) meta.push(`🕒 ${timeText}`);

        const caption = p.cap || p.caption || "Post";
        const details = `<div class="post-details"><div class="post-caption">${escapeHtml(caption)}</div><div class="post-meta">${meta.join("<br>")}</div></div>`;
        const inner = p.photo
          ? `<div class="post-visual"><img src="${p.photo}" onerror="this.style.display='none'"></div>${details}`
          : `<div class="post-tile" style="background:${color}"></div>${details}`;
        return `<div class="gcell new-post"><button class="del" onclick="delPost(${i},${originalIndex})">&times;</button>${inner}</div>`;
      })
      .join("");

    const grid = g.posts.length
      ? `<div class="grid">${cells}</div>`
      : `<div class="empty">No posts yet — add one after your first session</div>`;
    const bellBadge = g.notifs.length
      ? `<span class="badge show">${g.notifs.length}</span>`
      : "";
    const rankBadge =
      rankIndex === 0
        ? "🥇 Rank #1"
        : rankIndex === 1
          ? "🥈 Rank #2"
          : rankIndex === 2
            ? "🥉 Rank #3"
            : `#${rankIndex + 1}`;

    card.innerHTML = `
      <div class="rank-badge rank-${rankIndex + 1}">${rankBadge}</div>
      <div class="phead">
        <div class="avatar-wrap" onclick="openProfile(${i})">${avatar}</div>
        <div class="pmeta">
          <div class="pname">${g.name}</div>
          <div class="handle">${g.handle}</div>
          <div class="stats">
            <div class="stat"><b>${g.posts.length}</b><span>posts</span></div>
            <div class="stat"><b>${g.followers.toLocaleString()}</b><span>followers</span></div>
            <div class="stat"><b>${g.actions.toLocaleString()}</b><span>actions</span></div>
          </div>
        </div>
        <button class="bell" onclick="openNotif(${i})" aria-label="Notifications">&#128276;${bellBadge}</button>
      </div>
      <div class="bio"><span class="label">${g.name}</span> · ${g.bio}</div>
      <div class="controls">
        <span class="ctrl-label">Actions (good deeds)</span>
        <input type="number" id="a_${i}" value="1" min="1">
        <button class="btn actions" onclick="addA(${i})">+ Actions</button>
        <button class="btn minus" onclick="subA(${i})">&minus;</button>
        <button class="btn" style="background:${color}" onclick="openProfile(${i})">Edit</button>
      </div>
      <div style="padding:10px 18px 16px;">
        <button class="btn post" onclick="openPost(${i})">+ Add post</button>
      </div>
      ${grid}
    `;
    c.appendChild(card);
  });
  applyDisplayMode();
}

function addF(i) {
  const a = +document.getElementById("f_" + i).value || 0;
  if (groupsRef) {
    groupsRef.child(i).child("followers").transaction((cur) => (cur || 0) + a);
  } else {
    groups[i].followers += a;
    render();
  }
}
function subF(i) {
  const a = +document.getElementById("f_" + i).value || 0;
  if (groupsRef) {
    groupsRef.child(i).child("followers").transaction((cur) => Math.max(0, (cur || 0) - a));
  } else {
    groups[i].followers = Math.max(0, groups[i].followers - a);
    render();
  }
}
function addA(i) {
  const a = +document.getElementById("a_" + i).value || 0;
  if (groupsRef) {
    groupsRef.child(i).child("actions").transaction((cur) => (cur || 0) + a);
  } else {
    groups[i].actions += a;
    render();
  }
}
function subA(i) {
  const a = +document.getElementById("a_" + i).value || 0;
  if (groupsRef) {
    groupsRef.child(i).child("actions").transaction((cur) => Math.max(0, (cur || 0) - a));
  } else {
    groups[i].actions = Math.max(0, groups[i].actions - a);
    render();
  }
}
function delPost(i, pi) {
  const post = groups[i].posts[pi];
  if (post) {
    const followersRemoved = Number(post.followersAdded || 0);
    groups[i].followers = Math.max(0, groups[i].followers - followersRemoved);
  }
  groups[i].posts.splice(pi, 1);
  save(i);
  render();
}

function setDisplayMode(on) {
  displayMode = !!on;
  applyDisplayMode();
}
function applyDisplayMode() {
  document.body.classList.toggle("display-mode", displayMode);
}
function scrollToGroup(name) {
  const safeName = decodeURIComponent(name);
  const card = Array.from(document.querySelectorAll(".profile")).find((el) =>
    el.textContent.includes(safeName),
  );
  if (card) {
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function formatTime(ts) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function openProfile(i) {
  activeIndex = i;
  const g = groups[i];
  m_name.value = g.name;
  m_handle.value = g.handle;
  m_bio.value = g.bio;
  m_photo.value = g.photo || "";
  m_photofile.value = "";
  document.getElementById("profileModal").classList.add("show");
}
function saveProfile() {
  const g = groups[activeIndex];
  g.name = m_name.value.trim() || g.name;
  g.handle = m_handle.value.trim() || g.handle;
  g.bio = m_bio.value.trim();
  const f = m_photofile.files[0];
  if (f) {
    readFile(f, (d) => {
      g.photo = d;
      save(activeIndex);
      render();
    });
  } else {
    g.photo = m_photo.value.trim();
    save(activeIndex);
    render();
  }
  closeModal("profileModal");
}

function setPostError(message) {
  document.getElementById("postError").textContent = message;
}
function openPost(i) {
  activeIndex = i;
  p_cap.value = "";
  p_photo.value = "";
  p_followers.value = "1";
  p_photofile.value = "";
  setPostError("");
  document.getElementById("postModal").classList.add("show");
}
function savePost() {
  const g = groups[activeIndex];
  const cap = p_cap.value.trim();
  const followerInput = p_followers.value.trim();
  const followersAdded = Number(followerInput);
  if (!followerInput || !Number.isFinite(followersAdded) || followersAdded <= 0) {
    setPostError("Please enter a valid Followers amount greater than zero.");
    return;
  }
  setPostError("");
  const f = p_photofile.files[0];
  const finish = (photo) => {
    g.posts.unshift({
      cap,
      photo: photo || "",
      followersAdded,
      createdAt: Date.now(),
    });
    g.followers += followersAdded;
    save(activeIndex);
    render();
    closeModal("postModal");
  };
  if (f) {
    readFile(f, (d) => finish(d));
  } else {
    finish(p_photo.value.trim());
  }
}

/* ---- Notifications (per group) ---- */
function openNotif(i) {
  activeIndex = i;
  n_text.value = "";
  document.getElementById("notifTitle").innerHTML =
    "&#128276; Notifications · " + groups[i].name;
  renderNotifList();
  document.getElementById("notifModal").classList.add("show");
}
function sendNotif() {
  const t = n_text.value.trim();
  if (!t) return;
  const now = new Date();
  groups[activeIndex].notifs.unshift({
    text: t,
    time: now.toLocaleString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    }),
  });
  n_text.value = "";
  save(activeIndex);
  renderNotifList();
  render();
}
function delNotif(i) {
  groups[activeIndex].notifs.splice(i, 1);
  save(activeIndex);
  renderNotifList();
  render();
}
function clearNotifs() {
  const g = groups[activeIndex];
  if (!g.notifs.length) return;
  if (!confirm("Clear all notifications for " + g.name + "?")) return;
  g.notifs = [];
  save(activeIndex);
  renderNotifList();
  render();
}
function renderNotifList() {
  const el = document.getElementById("notifList");
  const list = groups[activeIndex].notifs;
  if (!list.length) {
    el.innerHTML =
      '<div class="empty">No notifications yet for this team.</div>';
    return;
  }
  el.innerHTML = list
    .map(
      (n, i) =>
        `<div class="notif-item"><button class="x" onclick="delNotif(${i})">&times;</button>${n.text}<div class="time">${n.time}</div></div>`,
    )
    .join("");
}
function readFile(file, cb) {
  const r = new FileReader();
  r.onload = (e) => cb(e.target.result);
  r.readAsDataURL(file);
}
function closeModal(id) {
  document.getElementById(id).classList.remove("show");
}
function exportData() {
  const blob = new Blob([JSON.stringify(groups)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "camp_scoreboard_backup.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function resetAll() {
  if (!confirm("Reset every group back to zero and clear all posts?")) return;
  groups = JSON.parse(JSON.stringify(DEFAULTS));
  save();
  render();
}
function importData(ev) {
  const file = ev.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw new Error("bad format");
      data.forEach((g) => {
        if (typeof g.actions !== "number") g.actions = 0;
        if (typeof g.followers !== "number") g.followers = 0;
        if (!Array.isArray(g.notifs)) g.notifs = [];
        if (!Array.isArray(g.posts)) g.posts = [];
        g.posts = g.posts.map((p) => ({
          cap: p.cap || p.caption || "",
          photo: p.photo || "",
          followersAdded: Number(p.followersAdded || 0),
          createdAt: p.createdAt || Date.now(),
        }));
      });
      groups = data;
      save();
      render();
      alert("Backup imported — " + data.length + " groups loaded.");
    } catch (err) {
      alert(
        "That file could not be read. Make sure it is the backup file exported from the scoreboard.",
      );
    }
    ev.target.value = "";
  };
  r.readAsText(file);
}
document.querySelectorAll(".modal").forEach((m) =>
  m.addEventListener("click", (e) => {
    if (e.target === m) m.classList.remove("show");
  }),
);
load();
