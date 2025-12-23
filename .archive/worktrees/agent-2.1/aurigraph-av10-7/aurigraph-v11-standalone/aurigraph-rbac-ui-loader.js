/**
 * Aurigraph RBAC UI Loader
 * Dynamically loads RBAC UI components into the page
 *
 * Version: 2.0.0
 * Date: October 12, 2025
 */

(function() {
    'use strict';

    console.log('[RBAC UI Loader] Loading RBAC UI components...');

    // Fetch and inject RBAC UI HTML
    fetch('aurigraph-rbac-ui.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load RBAC UI: ${response.statusText}`);
            }
            return response.text();
        })
        .then(html => {
            // Parse the HTML document
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Extract and inject styles
            const styles = doc.querySelectorAll('style');
            styles.forEach(style => {
                document.head.appendChild(style.cloneNode(true));
            });

            // Extract and inject body content
            const bodyContent = doc.body.innerHTML;
            const container = document.createElement('div');
            container.id = 'rbac-ui-container';
            container.innerHTML = bodyContent;
            document.body.appendChild(container);

            // Extract and execute scripts
            const scripts = doc.querySelectorAll('script');
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                if (script.src) {
                    newScript.src = script.src;
                } else {
                    newScript.textContent = script.textContent;
                }
                document.body.appendChild(newScript);
            });

            console.log('[RBAC UI Loader] ✅ RBAC UI components loaded successfully');
        })
        .catch(error => {
            console.error('[RBAC UI Loader] ❌ Failed to load RBAC UI:', error);
            console.error('[RBAC UI Loader] Make sure aurigraph-rbac-ui.html is in the same directory');
        });
})();
