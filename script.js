// ادمین پیش‌فرض
const defaultAdmin = { name: "ادمین", email: "admin@vlog.com", password: "admin123", role: "admin" };

// ذخیره و بازیابی داده‌ها
function getUsers() {
  return JSON.parse(localStorage.getItem('users')) || [defaultAdmin];
}

function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

function getVlogs() {
  return JSON.parse(localStorage.getItem('vlogs')) || [];
}

function saveVlogs(vlogs) {
  localStorage.setItem('vlogs', JSON.stringify(vlogs));
}

let currentUser = JSON.parse(localStorage.getItem('currentUser'));
let allVlogs = getVlogs();

function showMsg(text, success = false) {
  const msg = document.getElementById('msg');
  msg.textContent = text;
  msg.style.color = success ? 'green' : 'red';
  setTimeout(() => msg.textContent = '', 3000);
}

function showLogin() {
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
}

function showRegister() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
}

function register() {
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const pass = document.getElementById('regPass').value;
  if (!name || !email || !pass) return showMsg('همه فیلدها الزامی');

  const users = getUsers();
  if (users.find(u => u.email === email)) return showMsg('ایمیل قبلاً ثبت شده');

  users.push({ name, email, password: pass, role: "user" });
  saveUsers(users);
  showMsg('ثبت‌نام موفق', true);
  showLogin();
}

function login() {
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPass').value;

  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === pass);
  if (!user) return showMsg('ایمیل یا رمز اشتباه');

  currentUser = user;
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  location.reload();
}

function logout() {
  localStorage.removeItem('currentUser');
  currentUser = null;
  location.reload();
}

function showAdmin() {
  if (currentUser.role !== 'admin') return showMsg('دسترسی غیرمجاز');
  document.getElementById('welcome').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  renderVlogs(getVlogs(), 'adminVlogs');
}

function hideAdmin() {
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('welcome').style.display = 'block';
  renderVlogs(allVlogs, 'vlogs');
}

function showProfile() {
  document.getElementById('welcome').style.display = 'none';
  document.getElementById('profilePanel').style.display = 'block';
  document.getElementById('profileName').textContent = currentUser.name;
  document.getElementById('profileEmail').textContent = currentUser.email;
  loadLikedVlogs();
}

function hideProfile() {
  document.getElementById('profilePanel').style.display = 'none';
  document.getElementById('welcome').style.display = 'block';
  renderVlogs(allVlogs, 'vlogs');
}

function uploadVlog() {
  const title = document.getElementById('title').value;
  const desc = document.getElementById('desc').value;
  const file = document.getElementById('fileInput').files[0];
  if (!title || !file) return showMsg('عنوان و فایل الزامی');

  const reader = new FileReader();
  reader.onload = function(e) {
    const vlog = {
      id: Date.now(),
      title, desc,
      fileUrl: e.target.result,
      fileType: file.type,
      date: new Date().toLocaleString('fa-IR'),
      likes: [],
      comments: []
    };
    const vlogs = getVlogs();
    vlogs.push(vlog);
    saveVlogs(vlogs);
    allVlogs = vlogs;
    alert('آپلود شد!');
    renderVlogs(vlogs, 'adminVlogs');
    renderVlogs(allVlogs, 'vlogs');
    document.getElementById('title').value = '';
    document.getElementById('desc').value = '';
    document.getElementById('fileInput').value = '';
  };
  reader.readAsDataURL(file);
}

function likeVlog(vlogId, btn) {
  const vlogs = getVlogs();
  const vlog = vlogs.find(v => v.id === vlogId);
  if (!vlog.likes.includes(currentUser.email)) {
    vlog.likes.push(currentUser.email);
  } else {
    vlog.likes = vlog.likes.filter(e => e !== currentUser.email);
  }
  saveVlogs(vlogs);
  allVlogs = vlogs;
  btn.textContent = `لایک (${vlog.likes.length})`;
  btn.classList.toggle('liked');
  loadLikedVlogs();
  renderVlogs(allVlogs, 'vlogs');
  renderVlogs(allVlogs, 'adminVlogs');
}

function addComment(vlogId) {
  const input = document.getElementById(`comment-${vlogId}`);
  const text = input.value.trim();
  if (!text) return showMsg('متن کامنت الزامی');

  const vlogs = getVlogs();
  const vlog = vlogs.find(v => v.id === vlogId);
  vlog.comments.push({
    user: currentUser.name,
    email: currentUser.email,
    text,
    date: new Date().toLocaleString('fa-IR')
  });
  saveVlogs(vlogs);
  allVlogs = vlogs;
  input.value = '';
  renderVlogs(allVlogs, 'vlogs');
  renderVlogs(allVlogs, 'adminVlogs');
}

function deleteComment(vlogId, commentIndex) {
  if (!confirm('حذف این کامنت؟')) return;
  const vlogs = getVlogs();
  const vlog = vlogs.find(v => v.id === vlogId);
  vlog.comments.splice(commentIndex, 1);
  saveVlogs(vlogs);
  allVlogs = vlogs;
  renderVlogs(allVlogs, 'vlogs');
  renderVlogs(allVlogs, 'adminVlogs');
}

function searchVlogs() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allVlogs.filter(v => 
    v.title.toLowerCase().includes(query) || v.desc.toLowerCase().includes(query)
  );
  renderVlogs(filtered, 'vlogs');
}

function renderVlogs(vlogs, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  if (vlogs.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#999;">هیچ ولاگی یافت نشد</p>';
    return;
  }
  vlogs.reverse().forEach(v => {
    const isLiked = currentUser && v.likes.includes(currentUser.email);
    const likesCount = v.likes.length;
    const commentsCount = v.comments.length;

    const div = document.createElement('div');
    div.className = 'vlog-item';
    div.innerHTML = `
      <h3>${v.title}</h3>
      <p>${v.desc}</p>
      <small>${v.date} • ${commentsCount} نظر</small>
      ${v.fileType.startsWith('video') 
        ? `<video controls src="${v.fileUrl}"></video>` 
        : `<img src="${v.fileUrl}" alt="${v.title}">`
      }
      <button class="like-btn ${isLiked ? 'liked' : ''}" onclick="likeVlog(${v.id}, this)">
        لایک (${likesCount})
      </button>
      <div class="comment-box">
        <textarea id="comment-${v.id}" placeholder="نظر شما..."></textarea>
        <button onclick="addComment(${v.id})" style="width:auto; padding:8px 16px; margin-top:5px;">ارسال</button>
        ${v.comments.map((c, i) => `
          <div class="comment">
            <strong>${c.user}</strong>: ${c.text}<br>
            <small>${c.date}</small>
            ${currentUser && currentUser.role === 'admin' ? `<span class="delete-comment" onclick="deleteComment(${v.id}, ${i})">حذف</span>` : ''}
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(div);
  });
}

function loadLikedVlogs() {
  const liked = allVlogs.filter(v => v.likes.includes(currentUser.email));
  renderVlogs(liked, 'likedVlogs');
}

// نمایش اولیه
if (currentUser) {
  document.getElementById('userName').textContent = currentUser.name;
  document.getElementById('welcome').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'none';
  if (currentUser.role === 'admin') document.getElementById('adminBtn').style.display = 'inline-block';
  renderVlogs(allVlogs, 'vlogs');
}