const { createClient } = supabase;

const supabaseClient = createClient(
  'https://xoxbmcfsawwibxdegznv.supabase.co',
  'sb_publishable_PWIgfu7AZifTuNM-3CNlHA_D7wqFB7s'
);

let user = null;
let hideCompleted = false;

document.addEventListener('DOMContentLoaded', () => {
    // Custom colors (existing code – keep as is)
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

    // Live preview
    ['color-primary', 'color-secondary', 'color-accent', 'color-bg', 'color-text'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            const colors = {
                primary: document.getElementById('color-primary').value,
                secondary: document.getElementById('color-secondary').value,
                accent: document.getElementById('color-accent').value,
                bg: document.getElementById('color-bg').value,
                text: document.getElementById('color-text').value
            };
            applyColors(colors);
        });
    });

    document.getElementById('save-colors').addEventListener('click', () => {
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

    document.getElementById('reset-colors').addEventListener('click', () => {
        if (!user) return;
        localStorage.removeItem(`custom_colors_${user.id}`);
        applyColors(defaultColors);
        updatePickerValues(defaultColors);
        alert('Colors reset!');
    });

    // Role switching
    const roleSelect = document.getElementById('user-role');
    const currentRoleDisplay = document.getElementById('current-role');

    function loadRole() {
        if (!user) return 'dispatch';
        const saved = localStorage.getItem(`user_role_${user.id}`);
        return saved || 'dispatch';
    }

    function showDashboard(role) {
        // Hide all dashboards
        document.querySelectorAll('.dashboard-view').forEach(view => view.classList.remove('active'));

        if (role === 'dispatch') {
            document.getElementById('dispatch-dashboard').classList.add('active');
        } else if (role === 'driver') {
            document.getElementById('driver-dashboard').classList.add('active');
        } else if (role === 'admin') {
            document.getElementById('admin-dashboard').classList.add('active');
        }
    }

    // Save role
    document.getElementById('save-role').addEventListener('click', () => {
        if (!user) return;
        const newRole = roleSelect.value;
        localStorage.setItem(`user_role_${user.id}`, newRole);
        alert('Role saved! Page will reload.');
        location.reload();
    });

    // Auth
    document.getElementById('auth-btn').addEventListener('click', async () => {
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

    document.getElementById('logout-btn').addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        location.reload();
    });

    // App init with role
    async function initApp(role = 'dispatch') {
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
        const todayFull = new Date().toLocaleDateString('en-US', { timeZone: 'Pacific/Auckland', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('dateLabel').textContent = `Today: ${todayFull}`;

        if (role === 'dispatch') {
            // Your existing dispatch logic here (tab switching, loadBookings, etc.)
            // ... (keep all your current render/load functions)
            // For brevity, I'm keeping the structure – paste your existing dispatch code here
        } else if (role === 'driver') {
            // Driver view – placeholder for now
            // Later: load movements for this driver's rego
        } else if (role === 'admin') {
            // Admin view – placeholder
        }
    }
});
