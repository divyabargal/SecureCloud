import { createClient } from
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://gxcbtbwqrjmogfqotcxd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_49sRRJOS1mJFj1z2LUNSVw_30LXOdp3';

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
const fileInput = document.getElementById("fileInput");
const fileInfo = document.getElementById("fileInfo");

fileInput.addEventListener("change", function () {
    const file = fileInput.files[0];

    if (file) {
        fileInfo.textContent =
            "File Name: " + file.name +
            " | File Size: " + (file.size / 1024).toFixed(2) + " KB";
    }
});

const splitButton = document.getElementById("splitButton");
const blockSizeInput = document.getElementById("blockSize");
const splitInfo = document.getElementById("splitInfo");

splitButton.addEventListener("click", async function () {
    const file = fileInput.files[0];

    if (!file) {
        splitInfo.textContent = "Please select a file first.";
        return;
    }

    const blockSizeKB = Number(blockSizeInput.value);

    if (!Number.isFinite(blockSizeKB) || blockSizeKB <= 0) {
        splitInfo.textContent = "Enter a valid block size.";
        return;
    }

    const blockSize = Math.floor(blockSizeKB * 1024);
    const totalBlocks = Math.ceil(file.size / blockSize);

    splitInfo.textContent =
        "File split into " + totalBlocks + " blocks.";

    for (let i = 0; i < totalBlocks; i++) {
        const start = i * blockSize;
        const end = Math.min(start + blockSize, file.size);
        const block = file.slice(start, end);

        const link = document.createElement("a");
        link.href = URL.createObjectURL(block);
        link.download = file.name + ".part" + (i + 1);
        link.textContent = "Download Block " + (i + 1);

        const line = document.createElement("p");
        line.appendChild(link);
        splitInfo.appendChild(line);
    }
});

const encryptButton = document.getElementById("encryptButton");
const encryptionPassword = document.getElementById("encryptionPassword");
const encryptInfo = document.getElementById("encryptInfo");

encryptButton.addEventListener("click", async function () {
    const file = fileInput.files[0];
    const password = encryptionPassword.value;

    if (!file) {
        encryptInfo.textContent = "Please select a file first.";
        return;
    }

    if (password.length < 8) {
        encryptInfo.textContent =
            "Please enter a password with at least 8 characters.";
        return;
    }

    try {
        encryptInfo.textContent = "Encrypting file...";

        const encoder = new TextEncoder();
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            encoder.encode(password),
            "PBKDF2",
            false,
            ["deriveKey"]
        );

        const key = await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 250000,
                hash: "SHA-256"
            },
            keyMaterial,
            {
                name: "AES-GCM",
                length: 256
            },
            false,
            ["encrypt"]
        );

        const encrypted = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            key,
            await file.arrayBuffer()
        );

        const result = new Uint8Array(
            salt.length + iv.length + encrypted.byteLength
        );

        result.set(salt, 0);
        result.set(iv, salt.length);
        result.set(new Uint8Array(encrypted), salt.length + iv.length);

        const blob = new Blob([result], {
            type: "application/octet-stream"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = file.name + ".encrypted";
        link.textContent = "Download Encrypted File";
        link.click();

        setTimeout(() => URL.revokeObjectURL(url), 60000);

        encryptInfo.textContent =
            "Encryption successful! Your encrypted file was downloaded.";
    } catch (error) {
        encryptInfo.textContent =
            "Encryption failed. Please try again in Chrome.";
        console.error(error);
    }
});

const decryptButton = document.getElementById("decryptButton");
const decryptInfo = document.getElementById("decryptInfo");

decryptButton.addEventListener("click", async function () {
    const file = fileInput.files[0];
    const password = encryptionPassword.value;

    if (!file) {
        decryptInfo.textContent =
            "Please select your .encrypted file first.";
        return;
    }

    if (!file.name.endsWith(".encrypted")) {
        decryptInfo.textContent =
            "Please select a file ending in .encrypted.";
        return;
    }

    if (!password) {
        decryptInfo.textContent =
            "Please enter your encryption password.";
        return;
    }

    try {
        decryptInfo.textContent = "Decrypting file...";

        const data = new Uint8Array(await file.arrayBuffer());

        if (data.length < 29) {
            throw new Error("Invalid encrypted file.");
        }

        const salt = data.slice(0, 16);
        const iv = data.slice(16, 28);
        const ciphertext = data.slice(28);

        const encoder = new TextEncoder();

        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            encoder.encode(password),
            "PBKDF2",
            false,
            ["deriveKey"]
        );

        const key = await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 250000,
                hash: "SHA-256"
            },
            keyMaterial,
            {
                name: "AES-GCM",
                length: 256
            },
            false,
            ["decrypt"]
        );

        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            ciphertext
        );

        const blob = new Blob([decrypted], {
            type: "application/octet-stream"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = file.name.slice(
            0, -".encrypted".length
        );

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 60000);

        decryptInfo.textContent =
            "Success! Your decrypted file has been downloaded.";
    } catch (error) {
        decryptInfo.textContent =
            "Decryption failed. Check your password and file.";
        console.error(error);
    }
});
const loginForm = document.getElementById("loginForm");
const authInfo = document.getElementById("authInfo");
const logoutBtn = document.getElementById("logoutBtn");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    authInfo.textContent = "Login failed: " + error.message;
    return;
  }

  authInfo.textContent = "Login successful!";
});

logoutBtn.addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();

  authInfo.textContent = error
    ? "Sign out failed: " + error.message
    : "Signed out successfully.";
});
const resetForm = document.getElementById("resetPasswordForm");
const resetInfo = document.getElementById("resetInfo");

if (resetForm && resetInfo) {
  const { data: { subscription } } =
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        resetForm.style.display = "block";
        resetInfo.textContent =
          "Recovery verified. Enter your new password.";
      }
    });

  resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const newPassword =
      document.getElementById("newPassword").value;

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      resetInfo.textContent = "Error: " + error.message;
    } else {
      resetInfo.textContent =
        "Password updated! You can now sign in.";
      resetForm.reset();
    }
  });
}

const uploadBtn = document.getElementById("uploadBtn");
const uploadInfo = document.getElementById("uploadInfo");

if (uploadBtn && uploadInfo) {
  uploadBtn.addEventListener("click", async () => {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];

    if (!file) {
      uploadInfo.textContent = "Please select a file first.";
      return;
    }

    uploadBtn.disabled = true;
    uploadInfo.textContent = "Uploading...";

    try {
      const { data: { user }, error: userError } =
        await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Please sign in before uploading.");
      }

      
const password = encryptionPassword.value;

if (password.length < 8) {
  throw new Error("Enter your encryption password (at least 8 characters).");
}

uploadInfo.textContent = "Encrypting file...";

const encoder = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));

const keyMaterial = await crypto.subtle.importKey(
  "raw",
  encoder.encode(password),
  "PBKDF2",
  false,
  ["deriveKey"]
);

const key = await crypto.subtle.deriveKey(
  {
    name: "PBKDF2",
    salt,
    iterations: 250000,
    hash: "SHA-256"
  },
  keyMaterial,
  {
    name: "AES-GCM",
    length: 256
  },
  false,
  ["encrypt"]
);

const ciphertext = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv },
  key,
  await file.arrayBuffer()
);

// Store salt + IV + ciphertext together, as in your existing format.
const result = new Uint8Array(
  salt.length + iv.length + ciphertext.byteLength
);

result.set(salt, 0);
result.set(iv, salt.length);
result.set(
  new Uint8Array(ciphertext),
  salt.length + iv.length
);

const encryptedBlob = new Blob([result], {
  type: "application/octet-stream"
});

const filePath =
  `${user.id}/${Date.now()}-${file.name}.encrypted`;

uploadInfo.textContent = "Uploading encrypted file...";

const { error } = await supabase.storage
  .from("securecloud-files")
  .upload(filePath, encryptedBlob, {
    contentType: "application/octet-stream",
    upsert: false
  });

if (error) throw error;

uploadInfo.textContent =
  "Encrypted file uploaded successfully!";

    } catch (error) {
      uploadInfo.textContent = "Upload failed: " + error.message;
    } finally {
      uploadBtn.disabled = false;
    }
  });
}
