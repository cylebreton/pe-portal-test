# PE Investor Portal - Plugin Development Guide

**Version:** 1.0.0
**Last Updated:** October 22, 2025
**Target Audience:** AI Coding Assistants (Claude Code, Copilot, etc.)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Plugin Architecture](#plugin-architecture)
3. [Plugin Manifest Specification](#plugin-manifest-specification)
4. [Plugin Context API Reference](#plugin-context-api-reference)
5. [File Structure Requirements](#file-structure-requirements)
6. [Implementation Guide](#implementation-guide)
7. [Build and Packaging Process](#build-and-packaging-process)
8. [Complete Example: Hello World Plugin](#complete-example-hello-world-plugin)
9. [API Endpoints Reference](#api-endpoints-reference)
10. [Troubleshooting Common Issues](#troubleshooting-common-issues)

---

## System Overview

### What is the Plugin System?

The PE Investor Portal includes a comprehensive plugin system that allows extending the application with custom features without modifying core code. Plugins are packaged as ZIP archives containing JavaScript modules and configuration files.

### Key Capabilities

Plugins can:
- ✅ Add dashboard widgets to multiple slots (top, stats, sidebar, main)
- ✅ Register menu items in main navigation or admin section
- ✅ Create custom routes and pages
- ✅ Access core application APIs (auth, routing, notifications, storage)
- ✅ Persist data using scoped localStorage
- ✅ Communicate between plugins via event system
- ✅ Execute lifecycle hooks (install, update, uninstall)
- ✅ Declare dependencies on other plugins or packages
- ✅ Define permissions and access controls

### Technology Stack

**Frontend:**
- Vue 3 with Composition API
- PrimeVue v4 components
- Tailwind CSS for styling
- Pinia for state management
- Dynamic ES module loading

**Backend:**
- NestJS framework
- PostgreSQL database with Prisma ORM
- File storage for plugin assets
- Validation and security checks

---

## Plugin Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Application                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐          ┌──────────────────┐            │
│  │ Plugin Registry  │◄─────────┤  Plugin Loader   │            │
│  │    (Pinia)       │          │  (Dynamic Import)│            │
│  └────────┬─────────┘          └──────────────────┘            │
│           │                                                      │
│           ├─► Menu Items (aggregated from all plugins)          │
│           ├─► Widgets (aggregated from all plugins)             │
│           └─► Routes (registered dynamically)                   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Plugin Context API                           │  │
│  │  (Provides: auth, routing, notifications, storage, etc.) │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ HTTP API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend Application                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │  Plugin Service  │◄───┤ Plugin Validator │                  │
│  └────────┬─────────┘    └──────────────────┘                  │
│           │                                                      │
│           ├─► Upload & Extract ZIP                              │
│           ├─► Validate Manifest                                 │
│           ├─► Install/Uninstall Management                      │
│           └─► Serve Plugin Files                                │
│                                                                   │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │Plugin Storage    │    │  PostgreSQL DB   │                  │
│  │(File System)     │    │  (Plugin Metadata)│                 │
│  └──────────────────┘    └──────────────────┘                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Plugin Lifecycle

```
1. UPLOAD    → Plugin ZIP uploaded to backend
2. VALIDATE  → Manifest validated, files extracted
3. UPLOADED  → Plugin stored in database with status=UPLOADED
4. INSTALL   → Dependencies checked, status changed to INSTALLED
5. LOAD      → Frontend downloads and executes plugin code
6. ACTIVE    → Plugin widgets/routes registered, hooks executed
7. UNINSTALL → Plugin deactivated, status=UNINSTALLED
8. DELETE    → Plugin files and database records removed
```

### Plugin States

| State        | Description                                      |
|--------------|--------------------------------------------------|
| `UPLOADED`   | Plugin uploaded and validated, ready to install  |
| `INSTALLED`  | Plugin installed and active in the system        |
| `FAILED`     | Plugin installation failed (dependency issues)   |
| `UNINSTALLED`| Plugin deactivated but files remain              |

---

## Plugin Manifest Specification

### File: `plugin.json`

Every plugin MUST include a `plugin.json` file at the root of the ZIP archive. This file defines all plugin metadata, features, and configuration.

### Complete Schema

```typescript
interface PluginManifest {
  // ============================================================================
  // REQUIRED FIELDS
  // ============================================================================

  /**
   * Unique plugin identifier (kebab-case)
   * MUST be unique across all plugins
   * MUST NOT contain spaces or special characters except hyphens
   * Example: "my-awesome-plugin"
   */
  id: string;

  /**
   * Human-readable plugin name
   * Example: "My Awesome Plugin"
   */
  name: string;

  /**
   * Semantic version string (semver)
   * Format: MAJOR.MINOR.PATCH
   * Example: "1.0.0"
   */
  version: string;

  /**
   * Author name or organization
   * Example: "John Doe" or "Acme Corp"
   */
  author: string;

  /**
   * Required core application version
   * Supports semver ranges
   * Examples: ">=1.0.0", "^1.0.0", "1.0.0"
   */
  coreVersion: string;

  // ============================================================================
  // OPTIONAL FIELDS
  // ============================================================================

  /**
   * Author email address
   * Example: "author@example.com"
   */
  authorEmail?: string;

  /**
   * Plugin description (supports markdown)
   * Example: "This plugin adds advanced analytics features"
   */
  description?: string;

  /**
   * Icon file path relative to plugin root
   * Supported formats: PNG, JPG, SVG
   * Example: "icon.png"
   */
  icon?: string;

  /**
   * License type
   * Examples: "MIT", "Apache-2.0", "Proprietary"
   */
  license?: string;

  /**
   * Plugin repository URL
   * Example: "https://github.com/user/plugin-repo"
   */
  repository?: string;

  /**
   * Plugin homepage URL
   * Example: "https://example.com/plugins/my-plugin"
   */
  homepage?: string;

  /**
   * Keywords for searchability
   * Example: ["analytics", "dashboard", "reporting"]
   */
  keywords?: string[];

  // ============================================================================
  // MENU ITEMS
  // ============================================================================

  /**
   * Menu items to register in the application navigation
   */
  menus?: MenuItem[];

  // ============================================================================
  // DASHBOARD WIDGETS
  // ============================================================================

  /**
   * Dashboard widgets to register
   */
  widgets?: Widget[];

  // ============================================================================
  // DEPENDENCIES
  // ============================================================================

  /**
   * Plugin and package dependencies
   */
  dependencies?: {
    /**
     * External npm packages required by the plugin
     * Format: ["package-name@version", ...]
     * Example: ["lodash@^4.17.0", "moment@^2.29.0"]
     */
    external?: string[];

    /**
     * Other plugins required by this plugin
     * Format: ["plugin-id@version", ...]
     * Example: ["base-plugin@^1.0.0"]
     */
    plugins?: string[];
  };

  // ============================================================================
  // PERMISSIONS
  // ============================================================================

  /**
   * Permissions configuration
   */
  permissions?: {
    /**
     * Permissions required for the plugin to function
     * Users must have these permissions to see/use the plugin
     * Example: ["PLUGIN_ADMIN", "VIEW_ANALYTICS"]
     */
    required?: string[];

    /**
     * Permissions provided by this plugin
     * Can be checked by other plugins or core app
     * Example: ["CUSTOM_FEATURE_ACCESS"]
     */
    provided?: string[];
  };

  // ============================================================================
  // SETTINGS
  // ============================================================================

  /**
   * Plugin settings configuration
   */
  settings?: {
    /**
     * Whether the plugin has a configuration panel
     * If true, a settings button will appear in plugin management
     */
    hasConfigPanel?: boolean;

    /**
     * Route to the plugin's settings page
     * Example: "/plugins/my-plugin/settings"
     */
    configRoute?: string;
  };

  // ============================================================================
  // LIFECYCLE HOOKS
  // ============================================================================

  /**
   * Lifecycle hooks configuration
   * Indicates which hooks are implemented in the plugin code
   */
  hooks?: {
    /**
     * Plugin implements onInstall hook
     * Hook will be called after plugin installation
     */
    onInstall?: boolean;

    /**
     * Plugin implements onUpdate hook
     * Hook will be called when plugin is updated to a new version
     */
    onUpdate?: boolean;

    /**
     * Plugin implements onUninstall hook
     * Hook will be called before plugin uninstallation
     */
    onUninstall?: boolean;
  };
}

// ============================================================================
// MENU ITEM SPECIFICATION
// ============================================================================

interface MenuItem {
  /**
   * Unique identifier for this menu item
   * MUST be unique within the plugin
   * Example: "my-plugin-main-menu"
   */
  id: string;

  /**
   * Display label for the menu item
   * Example: "My Feature"
   */
  label: string;

  /**
   * Menu type - where the item appears
   * - "main": Main navigation sidebar
   * - "admin": Admin section navigation
   */
  type: "main" | "admin";

  /**
   * PrimeVue icon class
   * Example: "pi pi-chart-line"
   * See: https://primevue.org/icons
   */
  icon: string;

  /**
   * Vue Router route path
   * MUST start with /plugins/{plugin-id}/
   * Example: "/plugins/my-plugin/dashboard"
   */
  route: string;

  /**
   * Display order (lower numbers appear first)
   * Example: 100
   */
  order: number;

  /**
   * Required permissions to see this menu item
   * If empty, menu item is visible to all authenticated users
   * Example: ["ADMIN", "PLUGIN_USER"]
   */
  permissions?: string[];
}

// ============================================================================
// WIDGET SPECIFICATION
// ============================================================================

interface Widget {
  /**
   * Unique identifier for this widget
   * MUST be unique within the plugin
   * Example: "my-stats-widget"
   */
  id: string;

  /**
   * Human-readable widget name
   * Example: "Sales Statistics"
   */
  name: string;

  /**
   * Component name to load from plugin module
   * MUST match an exported component from index.js
   * Example: "SalesStatsWidget"
   */
  component: string;

  /**
   * Dashboard slot where widget should appear
   * Available slots:
   * - "dashboard-top": Full-width banner area at top
   * - "dashboard-stats": Stats grid (cards in row)
   * - "dashboard-sidebar": Right sidebar area
   * - "dashboard-main": Main content area
   */
  slot: "dashboard-top" | "dashboard-stats" | "dashboard-sidebar" | "dashboard-main";

  /**
   * Display order within the slot (lower numbers appear first)
   * Example: 1
   */
  order: number;

  /**
   * Required permissions to see this widget
   * If empty, widget is visible to all authenticated users
   * Example: ["VIEW_ANALYTICS"]
   */
  permissions?: string[];

  /**
   * Props to pass to the widget component
   * Can be any JSON-serializable object
   * Example: { "title": "Welcome", "color": "blue" }
   */
  props?: Record<string, any>;
}
```

### Manifest Example

```json
{
  "id": "hello-world-plugin",
  "name": "Hello World Plugin",
  "version": "1.0.0",
  "author": "PE Investor Portal Team",
  "authorEmail": "plugins@investorportal.com",
  "description": "A sample plugin demonstrating all plugin system features",
  "coreVersion": ">=1.0.0",
  "license": "MIT",
  "repository": "https://github.com/example/hello-world-plugin",
  "homepage": "https://example.com/plugins/hello-world",
  "keywords": ["sample", "demo", "hello-world"],

  "menus": [
    {
      "id": "hello-world-main-menu",
      "label": "Hello World",
      "type": "main",
      "icon": "pi pi-globe",
      "route": "/plugins/hello-world",
      "order": 100,
      "permissions": []
    }
  ],

  "widgets": [
    {
      "id": "hello-top-widget",
      "name": "Welcome Banner",
      "component": "WelcomeBanner",
      "slot": "dashboard-top",
      "order": 1,
      "permissions": [],
      "props": {
        "message": "Hello from the plugin system!"
      }
    }
  ],

  "hooks": {
    "onInstall": true,
    "onUninstall": true
  },

  "permissions": {
    "required": [],
    "provided": []
  },

  "dependencies": {
    "external": [],
    "plugins": []
  },

  "settings": {
    "hasConfigPanel": false,
    "configRoute": ""
  }
}
```

---

## Plugin Context API Reference

### Overview

The Plugin Context API provides plugins with controlled access to core application functionality. Access the context using `usePluginContext(pluginId)`.

### Accessing the Context

```javascript
// In plugin code (index.js)
const { usePluginContext } = window;
const context = usePluginContext('your-plugin-id');

// Use context methods
context.showSuccess('Hello!', 'Plugin loaded successfully');
```

### Complete API Specification

```typescript
interface PluginContext {
  // ============================================================================
  // APPLICATION INFO
  // ============================================================================

  /**
   * Core application version
   * Example: "1.0.0"
   */
  appVersion: string;

  /**
   * Core API version
   * Example: "1.0.0"
   */
  coreVersion: string;

  // ============================================================================
  // PLUGIN INFO
  // ============================================================================

  /**
   * Current plugin ID
   * Example: "my-plugin"
   */
  pluginId: string;

  /**
   * Current plugin manifest
   * Contains all data from plugin.json
   */
  manifest: PluginManifest;

  // ============================================================================
  // USER & AUTHENTICATION (Read-Only Reactive)
  // ============================================================================

  /**
   * Current authenticated user (reactive)
   * Returns null if not authenticated
   */
  currentUser: ComputedRef<User | null>;

  /**
   * Whether user is authenticated (reactive)
   */
  isAuthenticated: ComputedRef<boolean>;

  /**
   * Current user's roles (reactive)
   * Example: ["ADMIN", "USER"]
   */
  userRoles: ComputedRef<string[]>;

  /**
   * Current user's permissions (reactive)
   * Example: ["VIEW_DASHBOARD", "EDIT_PROFILE"]
   */
  userPermissions: ComputedRef<string[]>;

  // ============================================================================
  // PERMISSION CHECKING
  // ============================================================================

  /**
   * Check if user has a specific role
   * @param roleName - Role name to check
   * @returns true if user has the role
   */
  hasRole(roleName: string): boolean;

  /**
   * Check if user has a specific permission
   * @param permissionName - Permission name to check
   * @returns true if user has the permission
   */
  hasPermission(permissionName: string): boolean;

  /**
   * Check if user has any of the specified roles
   * @param roleNames - Array of role names
   * @returns true if user has at least one role
   */
  hasAnyRole(roleNames: string[]): boolean;

  /**
   * Check if user has all of the specified roles
   * @param roleNames - Array of role names
   * @returns true if user has all roles
   */
  hasAllRoles(roleNames: string[]): boolean;

  // ============================================================================
  // ROUTING
  // ============================================================================

  /**
   * Vue Router instance
   * Full access to router methods
   */
  router: Router;

  /**
   * Navigate to a route
   * @param path - Route path to navigate to
   * @returns Promise that resolves when navigation completes
   */
  navigateTo(path: string): Promise<void>;

  /**
   * Navigate back to previous route
   */
  navigateBack(): void;

  // ============================================================================
  // NOTIFICATIONS (Toast)
  // ============================================================================

  /**
   * PrimeVue Toast service instance
   * Full access to toast methods
   */
  toast: ToastServiceMethods;

  /**
   * Show success notification
   * @param message - Main message (title)
   * @param detail - Optional detailed message
   */
  showSuccess(message: string, detail?: string): void;

  /**
   * Show error notification
   * @param message - Main message (title)
   * @param detail - Optional detailed message
   */
  showError(message: string, detail?: string): void;

  /**
   * Show warning notification
   * @param message - Main message (title)
   * @param detail - Optional detailed message
   */
  showWarning(message: string, detail?: string): void;

  /**
   * Show info notification
   * @param message - Main message (title)
   * @param detail - Optional detailed message
   */
  showInfo(message: string, detail?: string): void;

  // ============================================================================
  // API ACCESS
  // ============================================================================

  /**
   * Base API URL
   * Example: "/api"
   */
  apiBaseUrl: string;

  /**
   * Get full API URL for an endpoint
   * @param endpoint - API endpoint (with or without leading slash)
   * @returns Full API URL
   * @example getApiUrl('/users') => "/api/users"
   * @example getApiUrl('users') => "/api/users"
   */
  getApiUrl(endpoint: string): string;

  // ============================================================================
  // PLUGIN STORAGE (LocalStorage - Scoped to Plugin)
  // ============================================================================

  /**
   * Get plugin data from storage
   * Data is automatically scoped to this plugin
   * @param key - Storage key
   * @returns Stored value or null if not found
   * @example getPluginData('settings') => { theme: 'dark' }
   */
  getPluginData<T = any>(key: string): T | null;

  /**
   * Set plugin data in storage
   * Data is automatically scoped to this plugin
   * @param key - Storage key
   * @param value - Value to store (must be JSON-serializable)
   * @example setPluginData('settings', { theme: 'dark' })
   */
  setPluginData<T = any>(key: string, value: T): void;

  /**
   * Remove plugin data from storage
   * @param key - Storage key to remove
   * @example removePluginData('settings')
   */
  removePluginData(key: string): void;

  /**
   * Clear all plugin data from storage
   * Removes all data for this plugin only
   * @example clearPluginData()
   */
  clearPluginData(): void;

  // ============================================================================
  // INTER-PLUGIN COMMUNICATION (Event Bus)
  // ============================================================================

  /**
   * Emit an event that other plugins can listen to
   * Events are automatically namespaced with plugin ID
   * @param eventName - Event name
   * @param payload - Event payload (any JSON-serializable data)
   * @example emitEvent('data-updated', { count: 42 })
   */
  emitEvent(eventName: string, payload?: any): void;

  /**
   * Listen to events from this or other plugins
   * @param eventName - Event name to listen for
   * @param handler - Function to call when event is emitted
   * @example onEvent('other-plugin:data-updated', (data) => { ... })
   */
  onEvent(eventName: string, handler: (payload: any) => void): void;

  /**
   * Stop listening to an event
   * @param eventName - Event name to stop listening to
   * @param handler - Handler function to remove (must be same reference)
   * @example offEvent('other-plugin:data-updated', handler)
   */
  offEvent(eventName: string, handler: (payload: any) => void): void;
}
```

### Context Usage Examples

#### Authentication & Permissions

```javascript
const context = usePluginContext('my-plugin');

// Check if user is authenticated
if (context.isAuthenticated.value) {
  console.log('User is logged in:', context.currentUser.value);
}

// Check permissions
if (context.hasPermission('ADMIN')) {
  // Show admin features
}

if (context.hasAnyRole(['ADMIN', 'MANAGER'])) {
  // Show management features
}
```

#### Routing

```javascript
const context = usePluginContext('my-plugin');

// Navigate to a route
context.navigateTo('/dashboard');

// Navigate to plugin page
context.navigateTo('/plugins/my-plugin/settings');

// Go back
context.navigateBack();

// Access full router
context.router.push({ name: 'Dashboard', params: { id: 123 } });
```

#### Notifications

```javascript
const context = usePluginContext('my-plugin');

// Show success
context.showSuccess('Saved!', 'Your changes have been saved successfully');

// Show error
context.showError('Failed', 'Could not save changes');

// Show warning
context.showWarning('Warning', 'This action cannot be undone');

// Show info
context.showInfo('Info', 'New data is available');
```

#### Plugin Storage

```javascript
const context = usePluginContext('my-plugin');

// Save data
context.setPluginData('user-preferences', {
  theme: 'dark',
  notifications: true
});

// Load data
const prefs = context.getPluginData('user-preferences');
console.log(prefs); // { theme: 'dark', notifications: true }

// Remove specific data
context.removePluginData('user-preferences');

// Clear all plugin data
context.clearPluginData();
```

#### Inter-Plugin Communication

```javascript
const context = usePluginContext('my-plugin');

// Emit event
context.emitEvent('data-updated', {
  timestamp: Date.now(),
  count: 42
});

// Listen to events
const handler = (payload) => {
  console.log('Received:', payload);
};
context.onEvent('other-plugin:data-updated', handler);

// Stop listening
context.offEvent('other-plugin:data-updated', handler);
```

---

## File Structure Requirements

### Minimum Required Structure

```
my-plugin/
├── plugin.json          # REQUIRED: Plugin manifest
└── index.js             # REQUIRED: Plugin entry point
```

### Recommended Structure

```
my-plugin/
├── plugin.json          # Plugin manifest
├── index.js             # Main entry point (exports components, hooks)
├── README.md            # Plugin documentation
├── icon.png             # Plugin icon (referenced in manifest)
├── components/          # Optional: separate component files
│   ├── MainView.js
│   ├── Widget1.js
│   └── Widget2.js
├── utils/               # Optional: utility functions
│   └── helpers.js
└── assets/              # Optional: images, styles, etc.
    └── logo.svg
```

### File Requirements

#### 1. plugin.json (REQUIRED)
- Must be valid JSON
- Must be at root of ZIP
- Must include all required fields
- See [Plugin Manifest Specification](#plugin-manifest-specification)

#### 2. index.js (REQUIRED)
- Must be at root of ZIP
- Must be valid ES6 module
- Must export default component if plugin has routes
- Must export named components referenced in widgets
- Must export lifecycle hooks if declared in manifest

#### 3. Additional Files (OPTIONAL)
- Can include any additional JavaScript, CSS, images, etc.
- All files must be within plugin directory
- Use relative imports for additional files

### Import Restrictions

**DO NOT** import these - they are available globally:
- `window.Vue` - Vue 3 (ref, computed, onMounted, etc.)
- `window.usePluginContext` - Plugin context function
- `window.PrimeVue` - PrimeVue components
- Tailwind CSS classes - available globally
- PrimeVue icons (pi pi-*) - available globally

**CAN** import:
- Your own plugin files (relative imports)
- External libraries IF declared in dependencies

### Module Format

Plugins must use ES6 module format:

```javascript
// ✅ CORRECT
export default MyComponent;
export { Widget1, Widget2 };
export const onInstall = async () => { ... };

// ❌ INCORRECT - Do not use CommonJS
module.exports = MyComponent;
```

---

## Implementation Guide

### Step-by-Step Plugin Creation

#### STEP 1: Initialize Plugin Structure

Create the plugin directory and required files:

```bash
mkdir my-plugin
cd my-plugin
touch plugin.json
touch index.js
touch README.md
```

#### STEP 2: Create Plugin Manifest

Create `plugin.json` with all required fields:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "author": "Your Name",
  "coreVersion": ">=1.0.0",
  "description": "My plugin description",
  "menus": [],
  "widgets": [],
  "hooks": {}
}
```

#### STEP 3: Implement Plugin Code

Create `index.js` with your plugin logic:

```javascript
// Access Vue and plugin context
const { ref, computed, onMounted } = window.Vue;
const { usePluginContext } = window;
const context = usePluginContext('my-plugin');

// Main plugin component (for routes)
const MyPlugin = {
  name: 'MyPlugin',
  setup() {
    const message = ref('Hello World');

    return { message };
  },
  template: `
    <div>
      <h1>{{ message }}</h1>
    </div>
  `
};

// Export default component
export default MyPlugin;
```

#### STEP 4: Add Dashboard Widgets (Optional)

If adding widgets, define them in manifest and implement:

```json
// In plugin.json
{
  "widgets": [
    {
      "id": "my-widget",
      "name": "My Widget",
      "component": "MyWidget",
      "slot": "dashboard-main",
      "order": 1
    }
  ]
}
```

```javascript
// In index.js
const MyWidget = {
  name: 'MyWidget',
  setup() {
    const data = ref('Widget data');
    return { data };
  },
  template: `
    <div class="bg-white p-4 rounded shadow">
      <h2 class="text-xl font-bold">My Widget</h2>
      <p>{{ data }}</p>
    </div>
  `
};

// Export the widget
export { MyWidget };
```

#### STEP 5: Add Menu Items (Optional)

If adding navigation items, define in manifest:

```json
{
  "menus": [
    {
      "id": "my-menu",
      "label": "My Plugin",
      "type": "main",
      "icon": "pi pi-star",
      "route": "/plugins/my-plugin",
      "order": 100,
      "permissions": []
    }
  ]
}
```

#### STEP 6: Implement Lifecycle Hooks (Optional)

```json
// In plugin.json
{
  "hooks": {
    "onInstall": true,
    "onUninstall": true
  }
}
```

```javascript
// In index.js
export const onInstall = async () => {
  console.log('Plugin installed');
  context.showSuccess('Plugin Installed', 'Welcome!');

  // Initialize plugin data
  context.setPluginData('installed-at', new Date().toISOString());
};

export const onUninstall = () => {
  console.log('Plugin uninstalled');
  context.showInfo('Plugin Uninstalled', 'Goodbye!');

  // Clean up plugin data
  context.clearPluginData();
};
```

#### STEP 7: Package Plugin

See [Build and Packaging Process](#build-and-packaging-process)

#### STEP 8: Upload and Install

1. Navigate to Admin → Plugins (requires SUPER_ADMIN role)
2. Click "Upload Plugin"
3. Select the ZIP file
4. Click "Install" on the uploaded plugin
5. Plugin is now active

---

## Build and Packaging Process

### Packaging Requirements

Plugins must be packaged as ZIP archives with:
- ✅ `plugin.json` at the root level
- ✅ `index.js` at the root level
- ✅ All plugin files in flat structure or subdirectories
- ❌ No nested directories at root (plugin files must be at top level)

### Creating the ZIP Archive

#### Using Command Line (macOS/Linux)

```bash
# Navigate to plugin directory
cd my-plugin

# Create ZIP with all files
zip -r ../my-plugin.zip .

# Verify contents
unzip -l ../my-plugin.zip
```

#### Using Command Line (Windows)

```powershell
# Navigate to plugin directory
cd my-plugin

# Create ZIP using PowerShell
Compress-Archive -Path * -DestinationPath ..\my-plugin.zip

# Verify contents
Expand-Archive -Path ..\my-plugin.zip -DestinationPath temp-verify
dir temp-verify
```

#### Using GUI Tools

**macOS:**
1. Select all files in plugin directory
2. Right-click → "Compress Items"
3. Rename to `my-plugin.zip`

**Windows:**
1. Select all files in plugin directory
2. Right-click → "Send to" → "Compressed (zipped) folder"
3. Rename to `my-plugin.zip`

**Linux:**
1. Select all files in file manager
2. Right-click → "Compress"
3. Choose ZIP format

### Verification Checklist

Before uploading, verify your ZIP:

```bash
# Extract and check structure
unzip -l my-plugin.zip

# Should see:
# plugin.json
# index.js
# (other files)
```

✅ **CORRECT Structure:**
```
my-plugin.zip
├── plugin.json
├── index.js
├── README.md
└── icon.png
```

❌ **INCORRECT Structure (extra directory level):**
```
my-plugin.zip
└── my-plugin/
    ├── plugin.json
    ├── index.js
    └── README.md
```

### Validation on Upload

When you upload the ZIP, the backend will:

1. **Extract ZIP** to temporary directory
2. **Validate plugin.json** exists and is valid JSON
3. **Check required fields** (id, name, version, author, coreVersion)
4. **Validate index.js** exists
5. **Check for security issues** (no malicious code patterns)
6. **Verify uniqueness** (plugin ID not already in use)
7. **Extract to storage** if validation passes

Common validation errors:
- `plugin.json not found` - File must be at ZIP root
- `Invalid JSON in plugin.json` - Fix JSON syntax errors
- `Missing required field: id` - Add missing manifest fields
- `Plugin with ID 'xxx' already exists` - Change plugin ID or uninstall existing

---

## Complete Example: Hello World Plugin

### Overview

This example demonstrates ALL plugin system features:
- ✅ Dashboard widgets (4 different slots)
- ✅ Menu item in main navigation
- ✅ Plugin page with interactive features
- ✅ Plugin context API usage
- ✅ LocalStorage persistence
- ✅ Event communication
- ✅ Lifecycle hooks

### File Structure

```
hello-world-plugin/
├── plugin.json
├── index.js
└── README.md
```

### plugin.json

```json
{
  "id": "hello-world-plugin",
  "name": "Hello World Plugin",
  "version": "1.0.0",
  "author": "PE Investor Portal Team",
  "authorEmail": "plugins@investorportal.com",
  "description": "A sample plugin demonstrating all plugin system features including dashboard widgets, menus, context API, and lifecycle hooks",
  "coreVersion": ">=1.0.0",
  "license": "MIT",
  "repository": "https://github.com/example/hello-world-plugin",
  "homepage": "https://example.com/plugins/hello-world",
  "keywords": ["sample", "demo", "hello-world", "widgets"],

  "menus": [
    {
      "id": "hello-world-main-menu",
      "label": "Hello World",
      "type": "main",
      "icon": "pi pi-globe",
      "route": "/plugins/hello-world",
      "order": 100,
      "permissions": []
    }
  ],

  "widgets": [
    {
      "id": "hello-top-widget",
      "name": "Welcome Banner",
      "component": "WelcomeBanner",
      "slot": "dashboard-top",
      "order": 1,
      "permissions": [],
      "props": {
        "message": "Hello from the plugin system!"
      }
    },
    {
      "id": "hello-stats-card",
      "name": "Plugin Stats Card",
      "component": "PluginStatsCard",
      "slot": "dashboard-stats",
      "order": 5,
      "permissions": []
    },
    {
      "id": "hello-sidebar-widget",
      "name": "Quick Actions",
      "component": "QuickActionsWidget",
      "slot": "dashboard-sidebar",
      "order": 1,
      "permissions": []
    },
    {
      "id": "hello-main-widget",
      "name": "Activity Chart",
      "component": "ActivityChartWidget",
      "slot": "dashboard-main",
      "order": 1,
      "permissions": []
    }
  ],

  "hooks": {
    "onInstall": true,
    "onUninstall": true
  },

  "permissions": {
    "required": [],
    "provided": []
  },

  "dependencies": {
    "external": [],
    "plugins": []
  },

  "settings": {
    "hasConfigPanel": false
  }
}
```

### index.js (Complete Implementation)

```javascript
/**
 * Hello World Plugin - Sample Plugin for PE Investor Portal
 *
 * Demonstrates:
 * - Main plugin component (page view)
 * - Dashboard widgets (4 different slots)
 * - Plugin context API usage
 * - LocalStorage persistence
 * - Event communication
 * - Lifecycle hooks
 */

// ============================================================================
// SETUP: Access Vue and Plugin Context
// ============================================================================

// Import Vue composition API functions (available globally)
const { ref, computed, onMounted, onUnmounted } = window.Vue || {};

// Get plugin context - provides access to core app features
let context;
try {
  const usePluginContext = window.usePluginContext;
  if (usePluginContext) {
    context = usePluginContext('hello-world-plugin');
  } else {
    console.warn('Plugin context not available - using mock');
    // Mock context for development/testing
    context = {
      showSuccess: console.log,
      showInfo: console.log,
      showWarning: console.log,
      showError: console.error,
      getPluginData: () => null,
      setPluginData: () => {},
      currentUser: { value: { firstName: 'User' } },
      isAuthenticated: { value: true }
    };
  }
} catch (error) {
  console.error('Failed to get plugin context:', error);
}

// ============================================================================
// MAIN PLUGIN COMPONENT (for plugin page route)
// ============================================================================

const HelloWorldPlugin = {
  name: 'HelloWorldPlugin',

  setup() {
    const clickCount = ref(0);
    const pluginData = ref(null);

    // Handle button click
    const handleClick = () => {
      clickCount.value++;

      // Persist to storage
      context.setPluginData('clickCount', clickCount.value);

      // Show notification
      context.showSuccess('Button Clicked!', `Total clicks: ${clickCount.value}`);

      // Emit event for other plugins
      if (context.emitEvent) {
        context.emitEvent('hello-world:button-clicked', {
          count: clickCount.value
        });
      }
    };

    // Component mounted
    onMounted(() => {
      // Load saved click count
      const savedCount = context.getPluginData('clickCount');
      if (savedCount) {
        clickCount.value = savedCount;
      }

      // Load plugin settings
      pluginData.value = context.getPluginData('settings') || {
        welcomeMessage: 'Welcome to Hello World Plugin!'
      };
    });

    return {
      clickCount,
      pluginData,
      handleClick,
      currentUser: context.currentUser
    };
  },

  template: `
    <div class="space-y-6">
      <!-- Header Banner -->
      <div class="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-lg shadow-lg text-white p-8">
        <h1 class="text-3xl font-bold mb-2">Hello World Plugin</h1>
        <p class="text-purple-100">
          Welcome {{ currentUser?.firstName }}! This is a sample plugin demonstrating the plugin system.
        </p>
      </div>

      <!-- Features Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Features List -->
        <div class="bg-white rounded-lg shadow-lg border border-gray-100 p-6">
          <h2 class="text-xl font-semibold mb-4 flex items-center">
            <i class="pi pi-info-circle mr-2 text-blue-600"></i>
            Plugin Features
          </h2>
          <ul class="space-y-2">
            <li class="flex items-start">
              <i class="pi pi-check-circle text-green-600 mt-1 mr-2"></i>
              <span>Dashboard widgets in 4 different slots</span>
            </li>
            <li class="flex items-start">
              <i class="pi pi-check-circle text-green-600 mt-1 mr-2"></i>
              <span>Menu item in main navigation</span>
            </li>
            <li class="flex items-start">
              <i class="pi pi-check-circle text-green-600 mt-1 mr-2"></i>
              <span>Plugin context API access</span>
            </li>
            <li class="flex items-start">
              <i class="pi pi-check-circle text-green-600 mt-1 mr-2"></i>
              <span>LocalStorage persistence</span>
            </li>
            <li class="flex items-start">
              <i class="pi pi-check-circle text-green-600 mt-1 mr-2"></i>
              <span>Event communication system</span>
            </li>
            <li class="flex items-start">
              <i class="pi pi-check-circle text-green-600 mt-1 mr-2"></i>
              <span>Lifecycle hooks (install/uninstall)</span>
            </li>
          </ul>
        </div>

        <!-- Interactive Demo -->
        <div class="bg-white rounded-lg shadow-lg border border-gray-100 p-6">
          <h2 class="text-xl font-semibold mb-4 flex items-center">
            <i class="pi pi-bolt mr-2 text-yellow-600"></i>
            Interactive Demo
          </h2>
          <p class="text-gray-600 mb-4">
            Click the button to test plugin data persistence and event emission:
          </p>
          <button
            @click="handleClick"
            class="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
          >
            <i class="pi pi-star mr-2"></i>
            Click Me! ({{ clickCount }} times)
          </button>
          <p class="text-sm text-gray-500 mt-3 text-center">
            Your click count is persisted in LocalStorage
          </p>
        </div>
      </div>

      <!-- Developer Tip -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-blue-900 mb-2 flex items-center">
          <i class="pi pi-lightbulb mr-2"></i>
          Developer Tip
        </h3>
        <p class="text-blue-800">
          Check the dashboard to see this plugin's widgets in action!
          Navigate back to the dashboard to view widgets in the top banner, stats grid, sidebar, and main content area.
        </p>
      </div>
    </div>
  `
};

// ============================================================================
// DASHBOARD WIDGETS
// ============================================================================

/**
 * WIDGET 1: Welcome Banner (dashboard-top slot)
 * Full-width banner at the top of the dashboard
 */
const WelcomeBanner = {
  name: 'WelcomeBanner',
  props: {
    message: {
      type: String,
      default: 'Hello from the plugin system!'
    }
  },
  setup(props) {
    const isDismissed = ref(false);

    const handleDismiss = () => {
      isDismissed.value = true;
      context.setPluginData('welcomeBannerDismissed', true);
      context.showInfo('Banner Dismissed', 'You can always see it again by reinstalling the plugin');
    };

    onMounted(() => {
      const dismissed = context.getPluginData('welcomeBannerDismissed');
      if (dismissed) {
        isDismissed.value = true;
      }
    });

    return {
      isDismissed,
      handleDismiss
    };
  },
  template: `
    <div v-if="!isDismissed" class="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg text-white p-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="bg-white bg-opacity-20 rounded-full p-3">
            <i class="pi pi-gift text-2xl"></i>
          </div>
          <div>
            <h3 class="text-xl font-bold">{{ message }}</h3>
            <p class="text-purple-100 mt-1">
              This is a sample widget from the Hello World plugin. It demonstrates the dashboard-top slot.
            </p>
          </div>
        </div>
        <button
          @click="handleDismiss"
          class="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all"
          title="Dismiss"
        >
          <i class="pi pi-times"></i>
        </button>
      </div>
    </div>
  `
};

/**
 * WIDGET 2: Plugin Stats Card (dashboard-stats slot)
 * Stats card in the dashboard stats grid
 */
const PluginStatsCard = {
  name: 'PluginStatsCard',
  setup() {
    const pluginCount = ref(1);
    const activePlugins = ref(1);

    onMounted(() => {
      // Load plugin statistics from storage
      const savedCount = context.getPluginData('clickCount') || 0;
      pluginCount.value = savedCount;
    });

    return {
      pluginCount,
      activePlugins
    };
  },
  template: `
    <div class="bg-white rounded-lg shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
      <div class="flex items-center">
        <div class="flex-shrink-0 rounded-lg p-3 bg-purple-100">
          <i class="pi pi-puzzle text-purple-600 text-lg"></i>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Plugin Interactions</p>
          <p class="text-2xl font-bold text-gray-900">{{ pluginCount }}</p>
          <p class="text-sm text-purple-600 flex items-center">
            <i class="pi pi-check-circle mr-1"></i>
            Plugin Active
          </p>
        </div>
      </div>
    </div>
  `
};

/**
 * WIDGET 3: Quick Actions (dashboard-sidebar slot)
 * Action buttons in the dashboard sidebar
 */
const QuickActionsWidget = {
  name: 'QuickActionsWidget',
  setup() {
    const handleAction = (actionName) => {
      context.showSuccess(`Action: ${actionName}`, 'This is a demo action from the plugin');

      // Emit event
      if (context.emitEvent) {
        context.emitEvent('hello-world:action', { action: actionName });
      }
    };

    const navigateToPlugin = () => {
      if (context.navigateTo) {
        context.navigateTo('/plugins/hello-world');
      }
    };

    return {
      handleAction,
      navigateToPlugin
    };
  },
  template: `
    <div class="bg-white rounded-lg shadow-lg border border-gray-100">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900 flex items-center">
          <i class="pi pi-bolt mr-2 text-purple-600"></i>
          Plugin Quick Actions
        </h2>
      </div>
      <div class="p-6">
        <div class="space-y-3">
          <button
            @click="navigateToPlugin"
            class="w-full text-left px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 rounded-lg border border-purple-200 transition-all"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <i class="pi pi-external-link text-purple-600 mr-3"></i>
                <div>
                  <p class="font-medium text-gray-900">Open Plugin</p>
                  <p class="text-xs text-gray-500">View plugin page</p>
                </div>
              </div>
              <i class="pi pi-chevron-right text-gray-400"></i>
            </div>
          </button>

          <button
            @click="handleAction('Demo Action 1')"
            class="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <i class="pi pi-star text-yellow-600 mr-3"></i>
                <div>
                  <p class="font-medium text-gray-900">Demo Action</p>
                  <p class="text-xs text-gray-500">Test plugin functionality</p>
                </div>
              </div>
              <i class="pi pi-chevron-right text-gray-400"></i>
            </div>
          </button>

          <button
            @click="handleAction('Settings')"
            class="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <i class="pi pi-cog text-gray-600 mr-3"></i>
                <div>
                  <p class="font-medium text-gray-900">Settings</p>
                  <p class="text-xs text-gray-500">Configure plugin</p>
                </div>
              </div>
              <i class="pi pi-chevron-right text-gray-400"></i>
            </div>
          </button>
        </div>
      </div>
    </div>
  `
};

/**
 * WIDGET 4: Activity Monitor (dashboard-main slot)
 * Activity chart and statistics in main dashboard area
 */
const ActivityChartWidget = {
  name: 'ActivityChartWidget',
  setup() {
    const activities = ref([
      { id: 1, label: 'Plugin Installed', time: 'Just now', icon: 'pi-download', color: 'green' },
      { id: 2, label: 'Widgets Loaded', time: '1 min ago', icon: 'pi-th-large', color: 'blue' },
      { id: 3, label: 'Context Initialized', time: '2 min ago', icon: 'pi-check-circle', color: 'purple' },
    ]);

    const stats = ref({
      totalActions: 3,
      successRate: 100,
      avgLoadTime: '125ms'
    });

    return {
      activities,
      stats
    };
  },
  template: `
    <div class="bg-white rounded-lg shadow-lg border border-gray-100">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 flex items-center">
            <i class="pi pi-chart-line mr-2 text-purple-600"></i>
            Plugin Activity Monitor
          </h2>
          <span class="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
            Live
          </span>
        </div>
      </div>

      <div class="p-6">
        <!-- Stats Grid -->
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <p class="text-2xl font-bold text-green-700">{{ stats.totalActions }}</p>
            <p class="text-xs text-green-600 mt-1">Total Actions</p>
          </div>
          <div class="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <p class="text-2xl font-bold text-blue-700">{{ stats.successRate }}%</p>
            <p class="text-xs text-blue-600 mt-1">Success Rate</p>
          </div>
          <div class="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <p class="text-2xl font-bold text-purple-700">{{ stats.avgLoadTime }}</p>
            <p class="text-xs text-purple-600 mt-1">Avg Load Time</p>
          </div>
        </div>

        <!-- Activity Log -->
        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h3>
          <div
            v-for="activity in activities"
            :key="activity.id"
            class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div :class="[\`bg-\${activity.color}-100 rounded-full p-2\`]">
              <i :class="[\`pi \${activity.icon} text-\${activity.color}-600\`]"></i>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">{{ activity.label }}</p>
              <p class="text-xs text-gray-500">{{ activity.time }}</p>
            </div>
            <i class="pi pi-check-circle text-green-500"></i>
          </div>
        </div>
      </div>
    </div>
  `
};

// ============================================================================
// LIFECYCLE HOOKS
// ============================================================================

/**
 * HOOK: onInstall
 * Called when the plugin is installed
 */
const onInstall = async () => {
  console.log('Hello World Plugin: onInstall hook called');

  // Initialize plugin data
  context.setPluginData('installDate', new Date().toISOString());
  context.setPluginData('settings', {
    welcomeMessage: 'Welcome to Hello World Plugin!',
    showStatistics: true
  });

  // Show success notification
  context.showSuccess(
    'Hello World Plugin Installed!',
    'The plugin has been successfully installed. Check the dashboard to see the widgets!'
  );

  // Emit installation event
  if (context.emitEvent) {
    context.emitEvent('hello-world:installed', {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  }
};

/**
 * HOOK: onUninstall
 * Called when the plugin is uninstalled
 */
const onUninstall = () => {
  console.log('Hello World Plugin: onUninstall hook called');

  // Clean up plugin data
  context.clearPluginData();

  // Show info notification
  context.showInfo(
    'Hello World Plugin Uninstalled',
    'Thank you for trying the Hello World plugin! All plugin data has been cleared.'
  );

  // Emit uninstallation event
  if (context.emitEvent) {
    context.emitEvent('hello-world:uninstalled', {
      timestamp: new Date().toISOString()
    });
  }
};

// ============================================================================
// EXPORTS - This is what the plugin system will load
// ============================================================================

// Export default component (for plugin route)
export default HelloWorldPlugin;

// Export dashboard widgets
export {
  WelcomeBanner,
  PluginStatsCard,
  QuickActionsWidget,
  ActivityChartWidget
};

// Export lifecycle hooks
export { onInstall, onUninstall };

// Export additional utilities if needed
export const pluginInfo = {
  id: 'hello-world-plugin',
  name: 'Hello World Plugin',
  version: '1.0.0'
};
```

### Packaging

```bash
# Navigate to plugin directory
cd hello-world-plugin

# Create ZIP file
zip -r ../hello-world-plugin.zip .

# Or on Windows:
# Compress-Archive -Path * -DestinationPath ..\hello-world-plugin.zip
```

### Testing Checklist

After installing the plugin:

1. ✅ Navigate to Dashboard - verify 4 widgets appear
2. ✅ Click "Hello World" in main menu - verify plugin page loads
3. ✅ Click the interactive button - verify count increments
4. ✅ Reload page - verify count persists
5. ✅ Click "Open Plugin" in Quick Actions - verify navigation works
6. ✅ Check browser console - verify no errors
7. ✅ Uninstall plugin - verify widgets disappear

---

## API Endpoints Reference

### Backend Plugin API

**Base URL:** `/api/plugins`

#### Upload Plugin
```
POST /api/plugins/upload
Content-Type: multipart/form-data

Body: { file: <ZIP file> }

Response: {
  success: true,
  pluginId: "my-plugin",
  name: "My Plugin",
  version: "1.0.0",
  message: "Plugin uploaded successfully",
  warnings: []
}
```

#### List Plugins
```
GET /api/plugins?status=INSTALLED&page=1&limit=10

Response: {
  plugins: [
    {
      id: "uuid",
      pluginId: "my-plugin",
      name: "My Plugin",
      version: "1.0.0",
      status: "INSTALLED",
      manifest: { ... },
      ...
    }
  ],
  total: 1
}
```

#### Get Plugin
```
GET /api/plugins/:id

Response: {
  id: "uuid",
  pluginId: "my-plugin",
  name: "My Plugin",
  ...
}
```

#### Install Plugin
```
POST /api/plugins/:id/install

Response: {
  success: true,
  pluginId: "my-plugin",
  name: "My Plugin",
  version: "1.0.0",
  message: "Plugin installed successfully",
  installedAt: "2025-10-22T10:00:00Z",
  dependencies: { satisfied: true },
  warnings: []
}
```

#### Uninstall Plugin
```
POST /api/plugins/:id/uninstall

Response: {
  success: true,
  pluginId: "my-plugin",
  message: "Plugin uninstalled successfully"
}
```

#### Delete Plugin
```
DELETE /api/plugins/:id

Response: {
  success: true,
  message: "Plugin deleted successfully"
}
```

#### Get Installed Plugins
```
GET /api/plugins/installed

Response: [
  {
    id: "uuid",
    pluginId: "my-plugin",
    name: "My Plugin",
    status: "INSTALLED",
    manifest: { ... },
    ...
  }
]
```

#### Get Plugin Files
```
GET /api/plugins/:pluginId/files/:filename

Response: File content (JavaScript, images, etc.)
```

---

## Troubleshooting Common Issues

### Issue: "plugin.json not found"

**Cause:** ZIP structure is incorrect

**Solution:**
```bash
# Verify ZIP structure
unzip -l my-plugin.zip

# Should show plugin.json at root, not in subdirectory
# ✅ CORRECT: plugin.json
# ❌ WRONG: my-plugin/plugin.json
```

### Issue: "Plugin context not available"

**Cause:** Trying to access context before plugin is loaded

**Solution:**
```javascript
// Always check if context is available
const { usePluginContext } = window;
if (!usePluginContext) {
  console.error('Plugin context not available');
  return;
}

const context = usePluginContext('my-plugin');
```

### Issue: "Widget not rendering"

**Cause:** Component not exported or name mismatch

**Solution:**
```javascript
// In plugin.json, widget component is "MyWidget"
{
  "widgets": [
    { "component": "MyWidget", ... }
  ]
}

// In index.js, MUST export component with same name
export { MyWidget };
```

### Issue: "Route not working"

**Cause:** Route must start with /plugins/{plugin-id}/

**Solution:**
```json
{
  "menus": [
    {
      "route": "/plugins/my-plugin"
    }
  ]
}
```

### Issue: "Data not persisting"

**Cause:** Not using plugin storage correctly

**Solution:**
```javascript
// Always use context storage methods
context.setPluginData('key', value);  // ✅ Correct
localStorage.setItem('key', value);    // ❌ Wrong - not scoped to plugin
```

### Issue: "Plugin already exists"

**Cause:** Plugin with same ID is already uploaded

**Solution:**
1. Uninstall existing plugin first, OR
2. Delete existing plugin, OR
3. Change plugin ID in manifest

### Issue: "Module import errors"

**Cause:** Using unsupported import syntax

**Solution:**
```javascript
// ✅ CORRECT - Use global Vue
const { ref, computed } = window.Vue;

// ❌ WRONG - Cannot import from external modules
import { ref } from 'vue';
```

---

## AI Implementation Checklist

When implementing a plugin using this guide, follow these steps:

### Phase 1: Planning
- [ ] Define plugin purpose and features
- [ ] Choose unique plugin ID (kebab-case)
- [ ] Determine required widgets and slots
- [ ] Plan menu items and routes
- [ ] Identify required context APIs

### Phase 2: Structure
- [ ] Create plugin directory
- [ ] Create plugin.json with all required fields
- [ ] Create index.js file
- [ ] Add README.md for documentation

### Phase 3: Manifest
- [ ] Fill in required fields (id, name, version, author, coreVersion)
- [ ] Define menu items if needed
- [ ] Define widgets if needed
- [ ] Configure lifecycle hooks if needed
- [ ] Set dependencies if needed

### Phase 4: Implementation
- [ ] Implement main plugin component (if using routes)
- [ ] Implement all widget components
- [ ] Export all components with correct names
- [ ] Implement lifecycle hooks
- [ ] Test context API usage

### Phase 5: Testing
- [ ] Verify all exports match manifest
- [ ] Test component rendering
- [ ] Test context API methods
- [ ] Test data persistence
- [ ] Test lifecycle hooks

### Phase 6: Packaging
- [ ] Create ZIP with correct structure
- [ ] Verify plugin.json at root level
- [ ] Verify index.js at root level
- [ ] Test ZIP extraction

### Phase 7: Deployment
- [ ] Upload to plugin system
- [ ] Verify validation passes
- [ ] Install plugin
- [ ] Test all features in application
- [ ] Verify no console errors

---

## Version History

| Version | Date       | Changes                                    |
|---------|------------|--------------------------------------------|
| 1.0.0   | 2025-10-22 | Initial documentation release              |

---

## Support

For questions or issues with plugin development:
- Review this guide thoroughly
- Check the hello-world example implementation
- Verify against the troubleshooting section
- Contact: plugins@investorportal.com

---

**End of Plugin Development Guide**
