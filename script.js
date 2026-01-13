document.addEventListener('DOMContentLoaded', () => {
    // --- 1. REFERENCIAS DOM ---
    // Vistas
    const viewLanding = document.getElementById('view-landing');
    const viewPayment = document.getElementById('view-payment');
    const viewEditor = document.getElementById('view-editor');

    // Landing & Pago
    const btnStart = document.getElementById('btn-start-now');
    const btnClosePayment = document.getElementById('btn-close-payment');
    const btnCopyPhone = document.getElementById('btn-copy-phone');
    const btnConfirmPayment = document.getElementById('btn-confirm-payment');
    const generatedCodeEl = document.getElementById('generated-code');
    const inputCode = document.getElementById('input-validation-code');

    // Editor
    const btnPrint = document.getElementById('btn-print');
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    const statusIndicator = document.getElementById('save-status');
    const profilePicContainer = document.getElementById('profile-pic');
    const imgInput = document.getElementById('img-upload');
    const avatarImg = document.getElementById('avatar-img');
    const avatarText = document.getElementById('avatar-text');

    // Admin
    const debugInfo = document.getElementById('debug-info');

    // --- 2. GESTIÓN DE ESTADO (PAGO) ---
    const APP_STATE_KEY = 'cv_express_payment';
    let appState = JSON.parse(localStorage.getItem(APP_STATE_KEY)) || {
        isPaid: false,
        userCode: null
    };

    const initRouter = () => {
        updateDebugPanel();

        if (appState.isPaid) {
            showView('editor');
        } else {
            showView('landing');
        }
    };

    const showView = (viewName) => {
        // Ocultar todo
        viewLanding.classList.add('hidden');
        viewEditor.classList.add('hidden');
        viewPayment.classList.add('hidden');

        // Mostrar lo que toca
        if (viewName === 'landing') viewLanding.classList.remove('hidden');
        if (viewName === 'editor') viewEditor.classList.remove('hidden');
        if (viewName === 'payment') {
            viewLanding.classList.remove('hidden'); // Mantener landing de fondo
            viewPayment.classList.remove('hidden');
            setupPaymentModal();
        }
    };

    // --- 3. LÓGICA DE PAGO ---

    const setupPaymentModal = () => {
        // Generar código si no existe
        if (!appState.userCode) {
            const randomCode = 'CV-' + Math.floor(1000 + Math.random() * 9000);
            appState.userCode = randomCode;
            saveAppState();
        }
        generatedCodeEl.textContent = appState.userCode;
        updateDebugPanel();
    };

    const saveAppState = () => {
        localStorage.setItem(APP_STATE_KEY, JSON.stringify(appState));
    };

    // Listeners de Pago
    btnStart.addEventListener('click', () => showView('payment'));

    btnClosePayment.addEventListener('click', () => {
        viewPayment.classList.add('hidden');
    });

    btnCopyPhone.addEventListener('click', () => {
        navigator.clipboard.writeText('944507095');
        const originalBtn = btnCopyPhone.innerHTML;
        btnCopyPhone.innerHTML = '✅';
        setTimeout(() => btnCopyPhone.innerHTML = originalBtn, 2000);
    });

    btnConfirmPayment.addEventListener('click', () => {
        const input = inputCode.value.trim().toUpperCase();
        const expected = appState.userCode;

        if (input === expected) {
            // PROCESO DE PAGO EXITOSO
            alert(`🎉 ¡Pago validado correctamente!\n\nBienvenido al Editor de CV Express.`);
            appState.isPaid = true;
            saveAppState();
            showView('editor');
        } else {
            alert('❌ Código incorrecto.\nPor favor escribe el código tal cual aparece arriba (Ej: CV-1234).');
        }
    });

    // --- 4. PERSISTENCIA EDITOR (LocalStorage) ---
    // Clave para datos del contenido
    const CONTENT_KEY = 'cv_express_data';

    const loadContent = () => {
        const savedData = localStorage.getItem(CONTENT_KEY);
        if (savedData) {
            const data = JSON.parse(savedData);

            // Textos
            for (const [id, content] of Object.entries(data.texts || {})) {
                const el = document.getElementById(id);
                if (el) el.innerHTML = content;
            }

            // Imagen
            if (data.image) {
                avatarImg.src = data.image;
                avatarImg.style.display = 'block';
                avatarText.style.display = 'none';
            }
        }
    };

    const saveContent = () => {
        const data = {
            texts: {},
            image: avatarImg.src && avatarImg.style.display !== 'none' ? avatarImg.src : null
        };

        const currentEditable = document.querySelectorAll('[contenteditable="true"]');
        currentEditable.forEach(el => {
            if (el.id) {
                data.texts[el.id] = el.innerHTML;
            }
        });

        localStorage.setItem(CONTENT_KEY, JSON.stringify(data));
        showSavedStatus();
    };

    let saveTimeout;
    const showSavedStatus = () => {
        statusIndicator.classList.add('visible');
        statusIndicator.innerText = 'Guardando...';
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            statusIndicator.innerText = 'Cambios guardados';
            setTimeout(() => statusIndicator.classList.remove('visible'), 2000);
        }, 500);
    };

    // Guardar al escribir (Delegación para elementos nuevos si los hubiera, pero usamos static IDs)
    document.addEventListener('input', (e) => {
        if (e.target.isContentEditable) {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveContent, 1000); // Debounce 1s
        }
    });

    // --- 5. IMAGEN DE PERFIL ---
    profilePicContainer.addEventListener('click', () => imgInput.click());
    imgInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                avatarImg.src = event.target.result;
                avatarImg.style.display = 'block';
                avatarText.style.display = 'none';
                saveContent();
            };
            reader.readAsDataURL(file);
        }
    });

    // --- 6. EXPORTAR PDF ---
    const exportarCV = () => {
        const nameEl = document.getElementById('cv-name');
        const rawName = nameEl ? nameEl.innerText : "Mi_CV";
        const cleanName = rawName.trim().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
        const filename = `${cleanName}_CV_Profesional`;

        const originalTitle = document.title;
        document.title = filename;
        window.print();
        document.title = originalTitle;
    };

    if (btnPrint) btnPrint.addEventListener('click', exportarCV);

    // --- 7. ADMIN PANEL ---
    function updateDebugPanel() {
        debugInfo.innerHTML = `
            <strong>Estado:</strong> ${appState.isPaid ? 'PAGADO' : 'PENDIENTE'}<br>
            <strong>Código:</strong> ${appState.userCode || '---'}
        `;
    }

    if (window.location.hash === '#admin') {
        document.getElementById('admin-panel').style.display = 'block';
    }

    // Inicializar App
    loadContent(); // Cargar contenido siempre (puede estar detrás)
    initRouter();  // Decidir qué vista mostrar
});
