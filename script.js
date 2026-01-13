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
    const btnWhatsapp = document.getElementById('btn-whatsapp-support');

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

    // Nuevo: Botón Soporte WhatsApp
    if (btnWhatsapp) {
        btnWhatsapp.addEventListener('click', () => {
            const code = appState.userCode || 'CV-XXXX';
            const msg = `Hola David, ya realicé mi pago de S/ 1.00. \nMi código es: *${code}*.\nAdjunto mi captura aquí.`;
            const url = `https://wa.me/51944507095?text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');
        });
    }

    btnConfirmPayment.addEventListener('click', () => {
        const input = inputCode.value.trim().toUpperCase();
        const expected = appState.userCode;

        // Feedback Visual "Verificando"
        const originalText = btnConfirmPayment.innerText;
        btnConfirmPayment.innerText = "Verificando...";
        btnConfirmPayment.disabled = true;

        setTimeout(() => {
            btnConfirmPayment.innerText = originalText;
            btnConfirmPayment.disabled = false;

            if (input === expected) {
                // PROCESO DE PAGO EXITOSO
                alert(`🎉 ¡Pago validado correctamente!\n\nBienvenido al Editor de CV Express.`);
                appState.isPaid = true;
                saveAppState();
                showView('editor');
            } else {
                alert('❌ Código incorrecto.\nPor favor escribe el código tal cual aparece arriba (Ej: CV-1234).');
            }
        }, 1500); // Simulamos 1.5s de red
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

    // --- MEJORAS NIVEL 1: FILAS DINÁMICAS ---

    // Delegación para eliminar filas
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete-row')) {
            const item = e.target.closest('.item-wrapper');
            const parent = item.parentNode;
            // Solo borrar si hay más de 1 elemento, para no dejar la lista vacía
            if (parent.querySelectorAll('.item-wrapper').length > 1) {
                item.remove();
                saveContent();
            } else {
                alert('Debes mantener al menos un elemento.');
            }
        }
    });

    // Botones para añadir filas (+)
    document.querySelectorAll('.btn-add-row').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const container = document.getElementById(targetId);
            const template = container.querySelector('.item-wrapper'); // Clonamos el primero como plantilla

            if (template) {
                const clone = template.cloneNode(true);

                // Limpiar contenido editable
                clone.querySelectorAll('[contenteditable]').forEach(el => {
                    el.innerText = '';
                    // Si tiene placeholder, se verá vacío
                });

                container.appendChild(clone);
                saveContent();
            }
        });
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

    // --- 7. ADMIN PANEL PROFESIONAL ---
    const adminPanel = document.getElementById('admin-panel');
    const adminStatus = document.getElementById('admin-status');
    const adminCode = document.getElementById('admin-code');
    const adminRevenue = document.getElementById('admin-revenue');
    const adminAttempts = document.getElementById('admin-attempts');
    const adminHistory = document.getElementById('admin-history');
    const btnCloseAdmin = document.getElementById('btn-close-admin');
    const btnResetApp = document.getElementById('btn-reset-app');
    const btnForceUnlock = document.getElementById('btn-force-unlock');

    // Admin Stats Key
    const ADMIN_STATS_KEY = 'cv_express_admin_stats';
    let adminStats = JSON.parse(localStorage.getItem(ADMIN_STATS_KEY)) || {
        attempts: 0,
        revenue: 0,
        codeHistory: []
    };

    function updateAdminPanel() {
        if (!adminPanel) return;

        // Update status
        if (adminStatus) {
            adminStatus.textContent = appState.isPaid ? '✅ PAGADO' : '⏳ PENDIENTE';
            adminStatus.style.color = appState.isPaid ? '#68d391' : '#fc8181';
        }

        if (adminCode) {
            adminCode.textContent = appState.userCode || '---';
        }

        if (adminRevenue) {
            adminRevenue.textContent = `S/ ${adminStats.revenue.toFixed(2)}`;
        }

        if (adminAttempts) {
            adminAttempts.textContent = adminStats.attempts;
        }

        if (adminHistory) {
            if (adminStats.codeHistory.length > 0) {
                adminHistory.innerHTML = adminStats.codeHistory.map(c =>
                    `<div>${c.code} - ${c.date} ${c.paid ? '✅' : '⏳'}</div>`
                ).join('');
            } else {
                adminHistory.innerHTML = '<div style="opacity:0.5">Sin historial</div>';
            }
        }
    }

    function saveAdminStats() {
        localStorage.setItem(ADMIN_STATS_KEY, JSON.stringify(adminStats));
    }

    // Track payment attempt
    function trackPaymentAttempt(code, paid = false) {
        adminStats.attempts++;
        if (paid) {
            adminStats.revenue += 1;
        }
        adminStats.codeHistory.unshift({
            code: code,
            date: new Date().toLocaleTimeString(),
            paid: paid
        });
        // Keep only last 10
        if (adminStats.codeHistory.length > 10) {
            adminStats.codeHistory.pop();
        }
        saveAdminStats();
        updateAdminPanel();
    }

    // Admin Button Handlers
    if (btnCloseAdmin) {
        btnCloseAdmin.addEventListener('click', () => {
            adminPanel.classList.add('hidden');
        });
    }

    if (btnResetApp) {
        btnResetApp.addEventListener('click', () => {
            if (confirm('¿Estás seguro de resetear toda la aplicación? Esto borrará todos los datos.')) {
                localStorage.clear();
                location.reload();
            }
        });
    }

    if (btnForceUnlock) {
        btnForceUnlock.addEventListener('click', () => {
            appState.isPaid = true;
            saveAppState();
            trackPaymentAttempt(appState.userCode || 'ADMIN', true);
            showView('editor');
            updateAdminPanel();
            alert('🔓 Editor desbloqueado manualmente.');
        });
    }

    // Show admin panel if hash is #admin
    if (window.location.hash === '#admin') {
        adminPanel.classList.remove('hidden');
    }

    // Override confirm payment to track
    const originalConfirmHandler = btnConfirmPayment.onclick;
    btnConfirmPayment.addEventListener('click', () => {
        const input = inputCode.value.trim().toUpperCase();
        if (input === appState.userCode) {
            trackPaymentAttempt(input, true);
        } else {
            trackPaymentAttempt(input, false);
        }
    });

    // Inicializar App
    loadContent();
    initRouter();
    updateAdminPanel();
});
