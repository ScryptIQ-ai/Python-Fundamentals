document.addEventListener('DOMContentLoaded', function() {
    
    // Footer HTML (your existing code)
    const footerHTML = `
        <div class="footer">
            <div>© Built with parchmentIQ copyright of scryptIQ</div>
            <div>© L2D is copyright UCL 2025</div>
        </div>
    `;

    // Replace footer (your existing code)
    const existingFooter = document.querySelector('.footer');
    if (existingFooter) {
        existingFooter.outerHTML = footerHTML;
    } else {
        document.body.insertAdjacentHTML('beforeend', footerHTML);
    }


    // Sidebar toggle functionality
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
        sidebarToggle.classList.toggle('collapsed');
        
        // Change the toggle button text based on state
        if (sidebar.classList.contains('collapsed')) {
            sidebarToggle.innerHTML = '❯';
        } else {
            sidebarToggle.innerHTML = '❮';
        }
    });
    
    // Collapsible sections in sidebar
    const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
    
    collapsibleHeaders.forEach(header => {
        header.addEventListener('click', function() {
            // Toggle collapsed class on the header
            this.classList.toggle('collapsed');
            
            // Get the content element that follows this header
            const content = this.nextElementSibling;
            content.classList.toggle('collapsed');
            
            // Don't change textContent - let CSS handle the rotation
            // The CSS will handle the visual rotation based on the collapsed class
        });
    });
    
    // Nested navigation toggle functionality
    const navToggles = document.querySelectorAll('.nav-toggle');
    
    navToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            // Toggle expanded class
            this.classList.toggle('expanded');
            
            // Find the nested navigation element
            const targetId = this.getAttribute('data-target');
            const nestedNav = document.getElementById(targetId);
            
            // Toggle expanded class on the nested nav
            nestedNav.classList.toggle('expanded');
            
            // Don't change textContent - let CSS handle the rotation
            // The CSS will handle the visual rotation based on the expanded class
        });
    });
    
    // Add event listeners to navigation links in the main sections
    const mainSectionLinks = document.querySelectorAll('.sidebar > ul > li > a, .nested-nav a');
    mainSectionLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Remove 'active' class from all links
            document.querySelectorAll('.sidebar a').forEach(l => l.classList.remove('active'));
            
            // Add 'active' class to clicked link
            this.classList.add('active');
            

        });
    });
    
    // Auto-expand navigation sections that contain active links
    const activeNestedLinks = document.querySelectorAll('.nested-nav a.active');
    
    activeNestedLinks.forEach(activeLink => {
        // Find the parent nested-nav container
        const parentNestedNav = activeLink.closest('.nested-nav');
        
        if (parentNestedNav) {
            // Find the corresponding nav-toggle
            const toggleId = parentNestedNav.id;
            const navToggle = document.querySelector(`[data-target="${toggleId}"]`);
            
            if (navToggle) {
                // Add expanded class to both toggle and nested nav
                navToggle.classList.add('expanded');
                parentNestedNav.classList.add('expanded');
            }
        }
    });
    
    // Tab functionality
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to current tab
            this.classList.add('active');
            
            // Hide all tab contents
            tabContents.forEach(content => {
                content.style.display = 'none';
            });
            
            // Show the selected tab content
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId + '-content').style.display = 'block';
        });
    });
});

// Toggle code collapse/expand
function toggleCodeCollapse(codeId) {
    const container = document.getElementById(codeId + '-container');
    const header = container.previousElementSibling;
    const icon = header.querySelector('.code-collapse-icon');
    const label = header.querySelector('.code-collapse-label');
    
    if (container.classList.contains('code-collapsed')) {
        container.classList.remove('code-collapsed');
        icon.classList.add('expanded');
        label.textContent = 'Hide code';
        
        // Refresh CodeMirror after making it visible
        setTimeout(() => {
            const codeMirror = container.querySelector('.CodeMirror');
            if (codeMirror && codeMirror.CodeMirror) {
                codeMirror.CodeMirror.refresh();
            }
        }, 0);
    } else {
        container.classList.add('code-collapsed');
        icon.classList.remove('expanded');
        label.textContent = 'Show code';
    }
}