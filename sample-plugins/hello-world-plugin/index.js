/**
 * Hello World Plugin - Sample Plugin for PE Investor Portal
 *
 * This plugin demonstrates all plugin system features:
 * - Dashboard widgets in multiple slots
 * - Menu items
 * - Plugin context API usage
 * - Lifecycle hooks
 * - Local storage
 * - Event communication
 */

// Import Vue composition API functions (these are globals in the app)
const { ref, computed, onMounted, onUnmounted } = window.Vue || {};

// Get plugin context - this provides access to core app features
let context;
try {
  // In production, this would be imported, but for demo we'll get it from window
  const usePluginContext = window.usePluginContext;
  if (usePluginContext) {
    context = usePluginContext('hello-world-plugin');
  } else {
    console.warn('Plugin context not available - using mock');
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

    const handleClick = () => {
      clickCount.value++;
      context.setPluginData('clickCount', clickCount.value);
      context.showSuccess('Button Clicked!', `Total clicks: ${clickCount.value}`);

      // Emit event for other plugins
      if (context.emitEvent) {
        context.emitEvent('hello-world:button-clicked', { count: clickCount.value });
      }
    };

    onMounted(() => {
      // Load saved data
      const savedCount = context.getPluginData('clickCount');
      if (savedCount) {
        clickCount.value = savedCount;
      }

      // Load plugin data
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
      <div class="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-lg shadow-lg text-white p-8">
        <h1 class="text-3xl font-bold mb-2">Hello World Plugin</h1>
        <p class="text-purple-100">
          Welcome {{ currentUser?.firstName }}! This is a sample plugin demonstrating the plugin system.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
 * Welcome Banner Widget - Appears at dashboard-top
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
 * Plugin Stats Card - Appears in dashboard-stats grid
 */
const PluginStatsCard = {
  name: 'PluginStatsCard',
  setup() {
    const pluginCount = ref(1);
    const activePlugins = ref(1);

    onMounted(() => {
      // Simulate loading plugin statistics
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
 * Quick Actions Widget - Appears in dashboard-sidebar
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
 * Activity Chart Widget - Appears in dashboard-main
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
export { WelcomeBanner, PluginStatsCard, QuickActionsWidget, ActivityChartWidget };

// Export lifecycle hooks
export { onInstall, onUninstall };

// Export additional utilities if needed
export const pluginInfo = {
  id: 'hello-world-plugin',
  name: 'Hello World Plugin',
  version: '1.0.0'
};
