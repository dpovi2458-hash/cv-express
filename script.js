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
    const btnCopyCode = document.getElementById('btn-copy-code');
    const btnConfirmPayment = document.getElementById('btn-confirm-payment');
    const generatedCodeEl = document.getElementById('generated-code');
    const inputCode = document.getElementById('input-validation-code');
    const btnWhatsapp = document.getElementById('btn-whatsapp-support');

    // QR Tabs
    const qrTabs = document.querySelectorAll('.qr-tab');
    const qrPanels = document.querySelectorAll('.qr-panel');

    // Editor
    const btnPrint = document.getElementById('btn-print');
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    const statusIndicator = document.getElementById('save-status');
    const profilePicContainer = document.getElementById('profile-pic');
    const imgInput = document.getElementById('img-upload');
    const avatarImg = document.getElementById('avatar-img');
    const avatarText = document.getElementById('avatar-text');

    // --- 2. GESTIÓN DE ESTADO (PAGO) ---
    const APP_STATE_KEY = 'cv_express_payment';
    const SESSION_KEY = 'cv_express_session';
    
    // Generar ID de sesión único
    const generateSessionId = () => {
        return 'SES-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    };

    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
        sessionId = generateSessionId();
        sessionStorage.setItem(SESSION_KEY, sessionId);
    }

    let appState = JSON.parse(localStorage.getItem(APP_STATE_KEY)) || {
        isPaid: false,
        userCode: null
    };

    // Registrar visita
    trackVisitor();

    const initRouter = () => {
        updateAdminPanel();

        if (appState.isPaid) {
            showView('editor');
        } else {
            showView('landing');
        }
    };

    const showView = (viewName) => {
        viewLanding.classList.add('hidden');
        viewEditor.classList.add('hidden');
        viewPayment.classList.add('hidden');

        if (viewName === 'landing') viewLanding.classList.remove('hidden');
        if (viewName === 'editor') viewEditor.classList.remove('hidden');
        if (viewName === 'payment') {
            viewLanding.classList.remove('hidden');
            viewPayment.classList.remove('hidden');
            setupPaymentModal();
        }
    };

    // --- 3. LÓGICA DE PAGO ---

    const setupPaymentModal = () => {
        if (!appState.userCode) {
            const randomCode = 'CV-' + Math.floor(1000 + Math.random() * 9000);
            appState.userCode = randomCode;
            saveAppState();
            // Registrar usuario con código generado
            trackUserCode(randomCode);
        }
        generatedCodeEl.textContent = appState.userCode;
        updateAdminPanel();
    };

    const saveAppState = () => {
        localStorage.setItem(APP_STATE_KEY, JSON.stringify(appState));
    };

    // QR Tabs functionality
    qrTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const qrType = tab.getAttribute('data-qr');
            
            // Update tabs
            qrTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update panels
            qrPanels.forEach(p => p.classList.remove('active'));
            document.getElementById(`qr-${qrType}`).classList.add('active');
        });
    });

    // Listeners de Pago
    btnStart.addEventListener('click', () => showView('payment'));

    btnClosePayment.addEventListener('click', () => {
        viewPayment.classList.add('hidden');
    });

    // Copiar teléfono
    btnCopyPhone.addEventListener('click', () => {
        navigator.clipboard.writeText('944507095');
        const originalText = btnCopyPhone.innerHTML;
        btnCopyPhone.innerHTML = '✅ Copiado';
        btnCopyPhone.style.background = '#48bb78';
        setTimeout(() => {
            btnCopyPhone.innerHTML = originalText;
            btnCopyPhone.style.background = '';
        }, 2000);
    });

    // Copiar código generado
    if (btnCopyCode) {
        btnCopyCode.addEventListener('click', () => {
            const code = generatedCodeEl.textContent;
            navigator.clipboard.writeText(code);
            const originalText = btnCopyCode.innerHTML;
            btnCopyCode.innerHTML = '✅ Copiado';
            btnCopyCode.style.background = '#48bb78';
            setTimeout(() => {
                btnCopyCode.innerHTML = originalText;
                btnCopyCode.style.background = '';
            }, 2000);
        });
    }

    // WhatsApp Soporte
    if (btnWhatsapp) {
        btnWhatsapp.addEventListener('click', () => {
            const code = appState.userCode || 'CV-XXXX';
            const msg = `Hola David, ya realicé mi pago de S/ 1.00.\nMi código es: *${code}*\nAdjunto mi captura aquí.`;
            const url = `https://wa.me/51944507095?text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');
        });
    }

    btnConfirmPayment.addEventListener('click', () => {
        const input = inputCode.value.trim().toUpperCase();
        const expected = appState.userCode;

        const originalText = btnConfirmPayment.innerText;
        btnConfirmPayment.innerText = "⏳ Verificando...";
        btnConfirmPayment.disabled = true;

        setTimeout(() => {
            btnConfirmPayment.innerText = originalText;
            btnConfirmPayment.disabled = false;

            if (input === expected) {
                trackPaymentAttempt(input, true);
                appState.isPaid = true;
                saveAppState();
                
                // Mostrar mensaje breve y entrar directo
                const toast = document.createElement('div');
                toast.className = 'success-toast';
                toast.innerHTML = '🎉 ¡Bienvenido! Acceso desbloqueado';
                toast.style.cssText = `
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, #48bb78, #38a169);
                    color: white;
                    padding: 1rem 2rem;
                    border-radius: 12px;
                    font-weight: 600;
                    z-index: 10000;
                    box-shadow: 0 10px 30px rgba(72, 187, 120, 0.5);
                    animation: slideDown 0.3s ease;
                `;
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    toast.remove();
                    showView('editor');
                }, 1500);
            } else {
                trackPaymentAttempt(input, false);
                inputCode.style.borderColor = '#e53e3e';
                inputCode.style.animation = 'shake 0.5s ease';
                setTimeout(() => {
                    inputCode.style.borderColor = '';
                    inputCode.style.animation = '';
                }, 500);
                alert('❌ Código incorrecto.\nAsegúrate de copiar el código exacto que aparece arriba.');
            }
        }, 1200);
    });

    // --- 4. PERSISTENCIA EDITOR (LocalStorage) ---
    const CONTENT_KEY = 'cv_express_data';

    const loadContent = () => {
        const savedData = localStorage.getItem(CONTENT_KEY);
        if (savedData) {
            const data = JSON.parse(savedData);

            for (const [id, content] of Object.entries(data.texts || {})) {
                const el = document.getElementById(id);
                if (el) el.innerHTML = content;
            }

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
            statusIndicator.innerText = '✓ Guardado';
            setTimeout(() => statusIndicator.classList.remove('visible'), 2000);
        }, 500);
    };

    document.addEventListener('input', (e) => {
        if (e.target.isContentEditable) {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveContent, 1000);
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

    // --- FILAS DINÁMICAS ---
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete-row')) {
            const item = e.target.closest('.item-wrapper');
            const parent = item.parentNode;
            if (parent.querySelectorAll('.item-wrapper').length > 1) {
                item.remove();
                saveContent();
            } else {
                alert('Debes mantener al menos un elemento.');
            }
        }
    });

    document.querySelectorAll('.btn-add-row').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const container = document.getElementById(targetId);
            const template = container.querySelector('.item-wrapper');

            if (template) {
                const clone = template.cloneNode(true);
                clone.querySelectorAll('[contenteditable]').forEach(el => {
                    el.innerText = '';
                });
                container.appendChild(clone);
                saveContent();
            }
        });
    });

    // --- 6. EXPORTAR PDF - AUTOMÁTICO ---
    const exportarCV = () => {
        const nameEl = document.getElementById('cv-name');
        const rawName = nameEl ? nameEl.innerText : "Mi_CV";
        const cleanName = rawName.trim().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
        const filename = `${cleanName}_CV_Profesional`;

        // Cambiar título para el nombre del archivo
        const originalTitle = document.title;
        document.title = filename;
        
        // Imprimir directamente
        window.print();
        
        // Restaurar título
        document.title = originalTitle;
    };

    if (btnPrint) btnPrint.addEventListener('click', exportarCV);

    // --- 7. ADMIN PANEL CON TRACKING DE USUARIOS ---
    const adminPanel = document.getElementById('admin-panel');
    const adminStatus = document.getElementById('admin-status');
    const adminCode = document.getElementById('admin-code');
    const adminRevenue = document.getElementById('admin-revenue');
    const adminAttempts = document.getElementById('admin-attempts');
    const adminVisitors = document.getElementById('admin-visitors');
    const adminConversions = document.getElementById('admin-conversions');
    const adminHistory = document.getElementById('admin-history');
    const adminUsersList = document.getElementById('admin-users-list');
    const adminSessionId = document.getElementById('admin-session-id');
    const adminBrowser = document.getElementById('admin-browser');
    const btnCloseAdmin = document.getElementById('btn-close-admin');
    const btnResetApp = document.getElementById('btn-reset-app');
    const btnForceUnlock = document.getElementById('btn-force-unlock');
    const btnExportData = document.getElementById('btn-export-data');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // Admin Stats
    const ADMIN_STATS_KEY = 'cv_express_admin_stats';
    const USERS_KEY = 'cv_express_users';

    let adminStats = JSON.parse(localStorage.getItem(ADMIN_STATS_KEY)) || {
        attempts: 0,
        revenue: 0,
        visitors: 0,
        conversions: 0,
        codeHistory: []
    };

    let usersData = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

    // Track visitor
    function trackVisitor() {
        const visitKey = 'cv_express_visited_' + new Date().toDateString();
        if (!sessionStorage.getItem(visitKey)) {
            sessionStorage.setItem(visitKey, 'true');
            adminStats.visitors++;
            saveAdminStats();
        }
    }

    // Track user code generation
    function trackUserCode(code) {
        const userData = {
            id: sessionId,
            code: code,
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleString('es-PE'),
            browser: getBrowserInfo(),
            paid: false
        };
        
        // Evitar duplicados
        const existingIndex = usersData.findIndex(u => u.code === code);
        if (existingIndex === -1) {
            usersData.unshift(userData);
            if (usersData.length > 50) usersData.pop(); // Mantener últimos 50
            saveUsersData();
        }
    }

    function getBrowserInfo() {
        const ua = navigator.userAgent;
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return 'Otro';
    }

    function saveAdminStats() {
        localStorage.setItem(ADMIN_STATS_KEY, JSON.stringify(adminStats));
    }

    function saveUsersData() {
        localStorage.setItem(USERS_KEY, JSON.stringify(usersData));
    }

    function trackPaymentAttempt(code, paid = false) {
        adminStats.attempts++;
        if (paid) {
            adminStats.revenue += 1;
            adminStats.conversions++;
            
            // Actualizar usuario como pagado
            const userIndex = usersData.findIndex(u => u.code === code);
            if (userIndex !== -1) {
                usersData[userIndex].paid = true;
                usersData[userIndex].paidAt = new Date().toLocaleString('es-PE');
                saveUsersData();
            }
        }
        
        adminStats.codeHistory.unshift({
            code: code,
            date: new Date().toLocaleTimeString('es-PE'),
            paid: paid
        });
        
        if (adminStats.codeHistory.length > 20) {
            adminStats.codeHistory.pop();
        }
        
        saveAdminStats();
        updateAdminPanel();
    }

    function updateAdminPanel() {
        if (!adminPanel) return;

        // Status
        if (adminStatus) {
            adminStatus.textContent = appState.isPaid ? '✅ PAGADO' : '⏳ PENDIENTE';
            adminStatus.style.background = appState.isPaid ? 'rgba(72, 187, 120, 0.3)' : 'rgba(252, 129, 129, 0.3)';
            adminStatus.style.color = appState.isPaid ? '#68d391' : '#fc8181';
        }

        if (adminCode) {
            adminCode.textContent = appState.userCode || '---';
        }

        if (adminSessionId) {
            adminSessionId.textContent = sessionId;
        }

        if (adminBrowser) {
            adminBrowser.textContent = getBrowserInfo();
        }

        if (adminRevenue) {
            adminRevenue.textContent = `S/ ${adminStats.revenue.toFixed(2)}`;
        }

        if (adminAttempts) {
            adminAttempts.textContent = adminStats.attempts;
        }

        if (adminVisitors) {
            adminVisitors.textContent = adminStats.visitors;
        }

        if (adminConversions) {
            adminConversions.textContent = adminStats.conversions;
        }

        // Users list
        if (adminUsersList) {
            renderUsersList('all');
        }

        // History
        if (adminHistory) {
            if (adminStats.codeHistory.length > 0) {
                adminHistory.innerHTML = adminStats.codeHistory.map(c =>
                    `<div class="history-item">${c.code} - ${c.date} ${c.paid ? '✅' : '❌'}</div>`
                ).join('');
            } else {
                adminHistory.innerHTML = '<div style="opacity:0.5;text-align:center;padding:0.5rem">Sin historial</div>';
            }
        }
    }

    function renderUsersList(filter) {
        if (!adminUsersList) return;

        let filteredUsers = usersData;
        if (filter === 'paid') {
            filteredUsers = usersData.filter(u => u.paid);
        } else if (filter === 'pending') {
            filteredUsers = usersData.filter(u => !u.paid);
        }

        if (filteredUsers.length === 0) {
            adminUsersList.innerHTML = '<div class="empty-state">Sin registros</div>';
            return;
        }

        adminUsersList.innerHTML = filteredUsers.map(u => `
            <div class="user-item">
                <div>
                    <span class="user-code">${u.code}</span>
                    <span class="user-time">${u.date}</span>
                </div>
                <span class="user-status">${u.paid ? '✅' : '⏳'}</span>
            </div>
        `).join('');
    }

    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderUsersList(btn.getAttribute('data-filter'));
        });
    });

    // Admin actions
    if (btnCloseAdmin) {
        btnCloseAdmin.addEventListener('click', () => {
            adminPanel.classList.add('hidden');
        });
    }

    if (btnResetApp) {
        btnResetApp.addEventListener('click', () => {
            if (confirm('⚠️ ¿Resetear toda la aplicación?\nSe borrarán todos los datos guardados.')) {
                localStorage.clear();
                sessionStorage.clear();
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

    if (btnExportData) {
        btnExportData.addEventListener('click', () => {
            const exportData = {
                stats: adminStats,
                users: usersData,
                exportedAt: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cv_express_data_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // Show admin panel with hash #admin
    if (window.location.hash === '#admin') {
        adminPanel.classList.remove('hidden');
    }

    // Keyboard shortcut: Ctrl+Shift+A for admin
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            adminPanel.classList.toggle('hidden');
        }
    });

    // Add shake animation CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-5px); }
            40%, 80% { transform: translateX(5px); }
        }
        @keyframes slideDown {
            from { transform: translate(-50%, -100%); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
        }
        .history-item {
            padding: 0.25rem 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
    `;
    document.head.appendChild(style);

    // Initialize
    loadContent();
    initRouter();
    updateAdminPanel();
});
