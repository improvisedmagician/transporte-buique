import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, push, get, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyA9hs5lY1_uTuboVnRaRcvkDc5TEfzuLv4",
    authDomain: "transporte-buique-461bd.firebaseapp.com",
    databaseURL: "https://transporte-buique-461bd-default-rtdb.firebaseio.com",
    projectId: "transporte-buique-461bd",
    storageBucket: "transporte-buique-461bd.firebasestorage.app",
    messagingSenderId: "781727735970",
    appId: "1:781727735970:web:53e6dea2c7d2d38873f7fb"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const Storage = {
    // CRUD: Transportes
    async saveTransport(entry) {
        const path = `transporte_escolar/${entry.date}`;
        await push(ref(db, path), entry);
    },

    async deleteTransportEntry(path) {
        await remove(ref(db, `transporte_escolar/${path}`));
    },

    // CRUD: Escolas
    async getSchools() {
        const snapshot = await get(ref(db, 'escolas_oficiais'));
        if (snapshot.exists()) {
            return Object.values(snapshot.val()).sort();
        }
        return ["ADICIONE UMA ESCOLA"];
    },

    async saveSchool(name) {
        // Formata o nome para criar uma chave segura e sem acentos no Firebase
        const key = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
        await set(ref(db, `escolas_oficiais/${key}`), name);
    },

    async deleteSchool(name) {
        // Usa a mesma formatação para encontrar a chave exata e deletar
        const key = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
        await remove(ref(db, `escolas_oficiais/${key}`));
    }
};

export { Storage, db };