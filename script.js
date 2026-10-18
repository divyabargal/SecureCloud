
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
