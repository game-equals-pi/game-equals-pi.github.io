const { createClient } = supabase;

const supabaseClient = createClient(
  'https://xoxbmcfsawwibxdegznv.supabase.co',
  'sb_publishable_PWIgfu7AZifTuNM-3CNlHA_D7wqFB7s'
);

let user = null;
let hideCompleted = false;
let bookingsDate = '';
let historyDate = '';

document.addEventListener('DOMContentLoaded', () => {
    const defaultColors = {
        primary: '#007bff',
        secondary: '#6c757d',
        accent: '#28a745',
        bg: '#f4f4f4',
        text: '#333333'
    };

    function loadCustomColors() {
        if (!user) return;
        const saved = localStorage.getItem(`custom_colors_${user.id}`);
        if (saved) {
            const colors = JSON.parse(saved);
            applyColors(colors);
            updatePickerValues(colors);
        } else {
            applyColors(defaultColors);
        }
    }

    function applyColors(colors) {
        document.documentElement.style.setProperty('--color-primary', colors.primary);
        document.documentElement.style.setProperty('--color-secondary', colors.secondary);
        document.documentElement.style.setProperty('--color-accent', colors.accent);
        document.documentElement.style.setProperty('--color-bg', colors.bg);
        document.documentElement.style.setProperty('--color-text', colors.text);
    }

    function updatePickerValues(colors) {
        document.getElementById('color-primary').value = colors.primary;
        document.getElementById('color-secondary').value = colors.secondary;
        document.getElementById('color-accent').value = colors.accent;
        document.getElementById('color-bg').value = colors.bg;
        document.getElementById('color-text').value = colors.text;
    }

    ['color-primary', 'color-secondary', 'color-accent', 'color-bg', 'color-text'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                const colors = {
                    primary: document.getElementById('color-primary').value,
                    secondary: document.getElementById('color-secondary').value,
                    accent: document.getElementById('color-accent').value,
                    bg: document.getElementById('color-bg').value,
                    text: document.getElementById('color-text').value
                };
                applyColors(colors);
            });
        }
    });

    document.getElementById('save-colors')?.addEventListener('click', () => {
        if (!user) return;
        const colors = {
            primary: document.getElementById('color-primary').value,
            secondary: document.getElementById('color-secondary').value,
            accent: document.getElementById('color-accent').value,
            bg: document.getElementById('color-bg').value,
            text: document.getElementById('color-text').value
        };
        localStorage.setItem(`custom_colors_${user.id}`, JSON.stringify(colors));
        alert('Colors saved!');
    });

    document.getElementById('reset-colors')?.addEventListener('click', () => {
        if (!user) return;
        localStorage.removeItem(`custom_colors_${user.id}`);
        applyColors(defaultColors);
        updatePickerValues(defaultColors);
        alert('Colors reset!');
    });

    // Role system
    const roleSelect = document.getElementById('user-role');
    const currentRoleDisplay = document.getElementById('current-role');

    function loadRole() {
        if (!user) return 'dispatch';
        const saved = localStorage.getItem(`user_role_${user.id}`);
        return saved || 'dispatch';
    }

    function showDashboard(role) {
        document.querySelectorAll('.dashboard-view').forEach(view => view.classList.remove('active'));
        document.getElementById(`${role}-dashboard`).classList.add('active');
    }

    document.getElementById('user-role')?.addEventListener('change', function() {
        if (!user) return;
        const newRole = this.value;
        localStorage.setItem(`user_role_${user.id}`, newRole);
        currentRoleDisplay.textContent = newRole.charAt(0).toUpperCase() + newRole.slice(1);
        showDashboard(newRole);
        initApp(newRole);
    });

    // Settings panel
    document.getElementById('settingsBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('settingsPanel').classList.toggle('active');
    });

    document.querySelector('.close-settings')?.addEventListener('click', () => {
        document.getElementById('settingsPanel').classList.remove('active');
    });

    document.addEventListener('click', (e) => {
        const panel = document.getElementById('settingsPanel');
        if (panel && !panel.contains(e.target) && e.target.id !== 'settingsBtn') {
            panel.classList.remove('active');
        }
    });

    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab + '-tab').classList.add('active');
        });
    });

    // Auth
    document.getElementById('auth-btn')?.addEventListener('click', async () => {
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;
        const message = document.getElementById('auth-message');

        if (!email || !password) {
            message.textContent = 'Fill in email and password';
            return;
        }

        message.textContent = 'Loading...';

        let { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error && error.message === 'Invalid login credentials') {
            ({ data, error } = await supabaseClient.auth.signUp({ email, password }));
            if (!error) {
                message.textContent = 'Check your email for confirmation link!';
                return;
            }
        }

        if (error) {
            message.textContent = error.message;
        } else {
            user = data.user;
            document.getElementById('login-page').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            loadCustomColors();
            const role = loadRole();
            roleSelect.value = role;
            currentRoleDisplay.textContent = role.charAt(0).toUpperCase() + role.slice(1);
            showDashboard(role);
            initApp(role);
        }
    });

    supabaseClient.auth.getSession().then(({ data }) => {
        if (data.session) {
            user = data.session.user;
            document.getElementById('login-page').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            loadCustomColors();
            const role = loadRole();
            roleSelect.value = role;
            currentRoleDisplay.textContent = role.charAt(0).toUpperCase() + role.slice(1);
            showDashboard(role);
            initApp(role);
        }
    });

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        location.reload();
    });

    // Full app logic
    async function initApp(role = 'dispatch') {
        // Set real date in header
        const todayFull = new Date().toLocaleDateString('en-US', {
            timeZone: 'Pacific/Auckland',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('dateLabel').textContent = `Today: ${todayFull}`;

        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });

        // Initialize dates only once
        if (!bookingsDate) bookingsDate = today;
        if (!historyDate) historyDate = today;

        // Set date pickers to current values
        const bookingsPicker = document.getElementById('bookingsDate');
        const historyPicker = document.getElementById('historyDate');
        if (bookingsPicker) bookingsPicker.value = bookingsDate;
        if (historyPicker) historyPicker.value = historyDate;

        // Generic tab switching + data load
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const parentTabs = tab.closest('.tabs');
                if (!parentTabs) return;
                parentTabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const targetId = tab.dataset.tab;
                const parentView = tab.closest('.dashboard-view');
                parentView.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
                document.getElementById(targetId).classList.add('active');

                // Load data on tab click
                if (targetId === 'bookings') loadBookings();
                if (targetId === 'onsite') loadOnsite();
                if (targetId === 'history') loadHistory();
            });
        });

        // Date picker listeners
        if (bookingsPicker) {
            bookingsPicker.addEventListener('change', (e) => {
                bookingsDate = e.target.value;
                loadBookings();
            });
        }

        if (historyPicker) {
            historyPicker.addEventListener('change', (e) => {
                historyDate = e.target.value;
                loadHistory();
            });
        }

        if (role !== 'dispatch') return;

        // Toggle completed
        document.getElementById('toggleCompleted')?.addEventListener('click', (e) => {
            hideCompleted = !hideCompleted;
            e.target.textContent = hideCompleted ? 'Show Completed' : 'Hide Completed';
            e.target.style.background = hideCompleted ? '#dc3545' : '#555';
            loadBookings();
        });

        // Render functions (unchanged – your original working code)
        function renderBookingsTable(data) {
            // ... your existing renderBookingsTable code ...
        }

        function renderOnsiteTable(data) {
            // ... your existing renderOnsiteTable code ...
        }

        function renderHistoryTable(data) {
            // ... your existing renderHistoryTable code ...
        }

        // ... rest of your functions (moveBookingToOnsite, modal-release blur, form submits, etc.) ...

        async function loadBookings() {
            const { data } = await supabaseClient.from('bookings').select('*').eq('date', bookingsDate);
            renderBookingsTable(data || []);
        }

        async function loadOnsite() {
            const { data } = await supabaseClient.from('onsite').select('*');
            renderOnsiteTable(data || []);
        }

        async function loadHistory() {
            const { data } = await supabaseClient.from('history').select('*').eq('completed_date', historyDate);
            renderHistoryTable(data || []);
        }

        // Real-time subscriptions
        supabaseClient.channel('public-bookings').on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => loadBookings()).subscribe();
        supabaseClient.channel('public-onsite').on('postgres_changes', { event: '*', schema: 'public', table: 'onsite' }, () => loadOnsite()).subscribe();
        supabaseClient.channel('public-history').on('postgres_changes', { event: '*', schema: 'public', table: 'history' }, () => loadHistory()).subscribe();

        // Initial load
        loadBookings();
        loadOnsite();
        loadHistory();
    }
});
