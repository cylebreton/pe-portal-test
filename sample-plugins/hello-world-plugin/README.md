# Hello World Plugin

A comprehensive sample plugin for the PE Investor Portal plugin system.

## Features

This plugin demonstrates all plugin system capabilities:

### 🎨 Dashboard Widgets
- **Welcome Banner** (`dashboard-top`) - Dismissible welcome message
- **Plugin Stats Card** (`dashboard-stats`) - Displays plugin interaction count
- **Quick Actions** (`dashboard-sidebar`) - Action buttons for plugin features
- **Activity Monitor** (`dashboard-main`) - Live activity feed and statistics

### 🔧 Core Features
- ✅ Menu item in main navigation
- ✅ Plugin context API usage (auth, routing, notifications, storage)
- ✅ LocalStorage data persistence
- ✅ Event communication system
- ✅ Lifecycle hooks (onInstall, onUninstall)
- ✅ Interactive demo page with click counter

### 🎯 What It Demonstrates

1. **Widget System**: Shows widgets in 4 different dashboard slots
2. **Navigation**: Adds a menu item to access the plugin page
3. **Context API**: Uses authentication, routing, and notifications
4. **Data Persistence**: Saves click count and settings to LocalStorage
5. **Event System**: Emits events when actions occur
6. **Lifecycle Management**: Proper install/uninstall handling

## Installation

1. Navigate to **Admin** → **Plugins** (requires SUPER_ADMIN role)
2. Click **Upload Plugin**
3. Select the `hello-world-plugin.zip` file
4. Click **Install** on the uploaded plugin
5. Navigate to **Dashboard** to see the widgets
6. Click **Hello World** in the main navigation to see the plugin page

## Testing Guide

### Test Dashboard Widgets
1. Go to Dashboard after installing
2. Verify widgets appear in:
   - Top: Purple welcome banner (can be dismissed)
   - Stats grid: Plugin interactions card
   - Sidebar: Quick actions panel
   - Main: Activity monitor with statistics

### Test Plugin Page
1. Click "Hello World" in main navigation
2. Click the interactive button
3. Verify click count increments
4. Check toast notification appears
5. Reload page - click count should persist

### Test Context API
1. Click "Open Plugin" in Quick Actions widget
2. Verify navigation to plugin page works
3. Click demo action buttons
4. Verify toast notifications work

### Test Lifecycle Hooks
1. Check browser console during installation
2. Verify success toast appears
3. Uninstall the plugin
4. Verify cleanup toast appears
5. Check that widgets disappear from dashboard

### Test Data Persistence
1. Click the button several times on plugin page
2. Navigate away
3. Come back to plugin page
4. Verify click count persisted

## File Structure

```
hello-world-plugin/
├── plugin.json       # Plugin manifest
├── index.js          # Main plugin code
└── README.md         # This file
```

## Plugin Manifest

The `plugin.json` defines:
- Plugin metadata (id, name, version, author)
- Menu items configuration
- Widget definitions with slots and props
- Lifecycle hooks
- Settings schema
- Permissions

## Code Structure

### Main Component
- Demonstrates interactive features
- Shows plugin data persistence
- Event emission examples

### Widgets
- **WelcomeBanner**: Dismissible banner with state persistence
- **PluginStatsCard**: Stats card matching dashboard design
- **QuickActionsWidget**: Interactive action buttons
- **ActivityChartWidget**: Activity log with statistics grid

### Lifecycle Hooks
- **onInstall**: Initialize plugin data, show welcome notification
- **onUninstall**: Clean up data, show goodbye notification

## Developer Notes

### Context API Usage
```javascript
const context = usePluginContext('hello-world-plugin');

// Authentication
console.log(context.currentUser.value);
console.log(context.isAuthenticated.value);

// Routing
context.navigateTo('/dashboard');

// Notifications
context.showSuccess('Title', 'Message');

// Storage
context.setPluginData('key', value);
const data = context.getPluginData('key');

// Events
context.emitEvent('event-name', payload);
context.onEvent('event-name', handler);
```

### Widget Props
Props defined in `plugin.json` are passed to widget components:
```json
"props": {
  "message": "Hello from the plugin system!"
}
```

### Styling
- Uses Tailwind CSS classes (available globally)
- Uses PrimeVue icons (`pi pi-*`)
- Matches dashboard design patterns

## Version History

### 1.0.0 (Current)
- Initial release
- 4 dashboard widgets
- Main menu item
- Interactive demo page
- Full context API integration
- Lifecycle hooks implementation

## License

MIT License - Free to use and modify

## Support

For questions or issues:
- Check the plugin system documentation
- Review the Phase 2 completion guide
- Contact: plugins@investorportal.com
