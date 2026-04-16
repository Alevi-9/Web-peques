// Configuración de Firebase (la tuya)
const firebaseConfig = {
  apiKey: "AIzaSyDz6i5kK3Oyd4UlXA9NI7L1PxJv-z7HA9o",
  authDomain: "web-peques.firebaseapp.com",
  projectId: "web-peques",
  storageBucket: "web-peques.firebasestorage.app",
  messagingSenderId: "993022488152",
  appId: "1:993022488152:web:cc54dadbe3ca9158d1242d",
  measurementId: "G-M1PYV3S8KQ"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ELEMENTOS DEL DOM
const userStatus = document.getElementById('userStatus');

const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');

const registerMsg = document.getElementById('registerMsg');
const loginMsg = document.getElementById('loginMsg');

const postForm = document.getElementById('postForm');
const postMsg = document.getElementById('postMsg');
const postsList = document.getElementById('postsList');

// ESTADO DE USUARIO
let currentUser = null;

// OBSERVADOR DE AUTENTICACIÓN
auth.onAuthStateChanged(user => {
  currentUser = user;
  if (user) {
    userStatus.textContent = user.email + (user.emailVerified ? " (verificado)" : " (no verificado)");
    logoutBtn.style.display = 'inline-block';
  } else {
    userStatus.textContent = "No identificado";
    logoutBtn.style.display = 'none';
  }
});

// REGISTRO
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    registerMsg.textContent = "";
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();

    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      await cred.user.sendEmailVerification();
      registerMsg.textContent = "Cuenta creada. Revisa tu correo para verificar tu cuenta.";
      registerMsg.style.color = "green";
      registerForm.reset();
    } catch (err) {
      registerMsg.textContent = err.message;
      registerMsg.style.color = "red";
    }
  });
}

// LOGIN
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginMsg.textContent = "";
    const email = document.getElementById('logEmail').value.trim();
    const password = document.getElementById('logPassword').value.trim();

    try {
      const cred = await auth.signInWithEmailAndPassword(email, password);
      if (!cred.user.emailVerified) {
        loginMsg.textContent = "Has iniciado sesión, pero tu correo no está verificado. Revisa tu bandeja de entrada.";
        loginMsg.style.color = "orange";
      } else {
        loginMsg.textContent = "Inicio de sesión correcto.";
        loginMsg.style.color = "green";
      }
      loginForm.reset();
    } catch (err) {
      loginMsg.textContent = err.message;
      loginMsg.style.color = "red";
    }
  });
}

// LOGOUT
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await auth.signOut();
    loginMsg.textContent = "";
    registerMsg.textContent = "";
  });
}

// FORO: PUBLICAR MENSAJE
if (postForm) {
  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    postMsg.textContent = "";

    if (!currentUser) {
      postMsg.textContent = "Debes iniciar sesión para publicar.";
      postMsg.style.color = "red";
      return;
    }

    if (!currentUser.emailVerified) {
      postMsg.textContent = "Tu correo no está verificado. Verifica tu cuenta antes de publicar.";
      postMsg.style.color = "red";
      return;
    }

    const content = document.getElementById('postContent').value.trim();
    if (!content) return;

    try {
      await db.collection('posts').add({
        content,
        userEmail: currentUser.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      postMsg.textContent = "Mensaje publicado.";
      postMsg.style.color = "green";
      postForm.reset();
    } catch (err) {
      postMsg.textContent = err.message;
      postMsg.style.color = "red";
    }
  });
}

// FORO: ESCUCHAR MENSAJES EN TIEMPO REAL
db.collection('posts')
  .orderBy('createdAt', 'desc')
  .limit(50)
  .onSnapshot(snapshot => {
    postsList.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const div = document.createElement('div');
      div.className = 'post-item';

      const meta = document.createElement('div');
      meta.className = 'post-meta';

      const date = data.createdAt ? data.createdAt.toDate().toLocaleString() : 'Fecha desconocida';
      meta.textContent = `${data.userEmail} · ${date}`;

      const content = document.createElement('div');
      content.className = 'post-content';
      content.textContent = data.content;

      div.appendChild(meta);
      div.appendChild(content);
      postsList.appendChild(div);
    });
  });
