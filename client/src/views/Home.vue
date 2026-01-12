<template>
  <div class="max-w-md mx-auto p-4 pt-6 pb-24">
    <!-- 头部信息 -->
    <header class="card mb-6 fade-in">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold text-primary-600">🤰 宝宝胎动记录</h1>
          <p class="text-sm text-gray-500 mt-1">
            <span v-if="pregnancyInfo">第{{ pregnancyInfo.weeks }}周{{ pregnancyInfo.days }}天</span>
            <span v-else>未设置预产期</span>
            · {{ currentDate }}
          </p>
        </div>
        <div class="text-right">
          <div class="text-3xl font-bold text-primary-500">{{ todayStats.total }}</div>
          <div class="text-xs text-gray-500">今日记录</div>
        </div>
      </div>

      <div v-if="todayStats.lastTime" class="text-sm text-gray-600">
        ⏱️ 最近：{{ formatTime(todayStats.lastTime) }}
      </div>
    </header>

    <!-- 快速记录按钮 -->
    <div class="card mb-6 fade-in text-center">
      <button
        @click="showRecordModal = true"
        class="w-36 h-36 mx-auto bg-gradient-to-br from-primary-400 to-primary-600 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex flex-col items-center justify-center pulse-soft"
      >
        <span class="text-5xl mb-1">👶</span>
        <span class="text-white font-bold text-base">感受到了</span>
      </button>
      <p class="text-gray-500 text-sm mt-4">点击大按钮快速记录</p>
    </div>

    <!-- 今日统计 -->
    <div v-if="todayStats.total > 0" class="card mb-6 fade-in">
      <h3 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span>📊</span>
        <span>今日统计</span>
      </h3>

      <div class="grid grid-cols-2 gap-4">
        <div class="bg-primary-50 rounded-2xl p-3">
          <div class="text-2xl font-bold text-primary-600">{{ todayStats.total }}</div>
          <div class="text-xs text-gray-600">总次数</div>
        </div>
        <div class="bg-warm-50 rounded-2xl p-3">
          <div class="text-2xl font-bold text-warm-600">{{ getAverageInterval }}</div>
          <div class="text-xs text-gray-600">平均间隔</div>
        </div>
      </div>
    </div>

    <!-- 今日类型分布 -->
    <div v-if="todayStats.total > 0 && todayStats.byTag && todayStats.byTag.length > 0" class="card mb-6 fade-in">
      <h3 class="font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <span>🎯</span>
        <span>今日类型分布</span>
      </h3>

      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="item in todayStats.byTag"
          :key="item.tag"
          class="bg-gradient-to-br from-primary-50 to-warm-50 rounded-2xl p-3 text-center"
        >
          <div class="text-3xl mb-1">{{ getTagEmoji(item.tag) }}</div>
          <div class="text-sm font-medium text-gray-700">{{ item.tag }}</div>
          <div class="text-xl font-bold text-primary-600 mt-1">{{ item.count }}</div>
          <div class="text-xs text-gray-500">次</div>
        </div>
      </div>
    </div>

    <!-- 最近记录 -->
    <div class="card fade-in">
      <h3 class="font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <span>📝</span>
        <span>最近记录</span>
      </h3>

      <div v-if="recentMovements.length === 0" class="text-center py-8 text-gray-400">
        <div class="text-4xl mb-2">💭</div>
        <p>还没有记录哦</p>
      </div>

      <div v-else class="space-y-4">
        <div v-for="group in groupedMovements" :key="group.dateKey">
          <!-- 日期分组头 -->
          <div
            @click="toggleGroup(group.dateKey)"
            class="flex items-center justify-between p-3 bg-gray-100 rounded-2xl cursor-pointer hover:bg-gray-200 transition-colors"
          >
            <div class="flex items-center gap-2">
              <span class="text-lg">📅</span>
              <span class="font-medium text-gray-700">{{ group.dateLabel }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-primary-600 font-medium">{{ group.movements.length }}次</span>
              <span class="text-gray-400 transition-transform" :class="{ 'rotate-180': expandedGroups[group.dateKey] }">
                ▼
              </span>
            </div>
          </div>

          <!-- 展开的记录列表 -->
          <div v-if="expandedGroups[group.dateKey]" class="mt-2 space-y-2 pl-2">
            <div
              v-for="movement in group.movements"
              :key="movement.id"
              class="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
            >
              <div class="text-2xl">{{ getIntensityEmoji(movement.intensity) }}</div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-700">{{ movement.tag }}</span>
                  <span class="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-700">
                    {{ movement.intensity }}
                  </span>
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  {{ formatTime(movement.timestamp) }}
                  <span v-if="movement.note" class="ml-2">· {{ movement.note }}</span>
                </div>
              </div>
              <button
                @click="deleteMovement(movement.id)"
                class="text-gray-400 hover:text-red-500 transition-colors"
              >
                <span class="text-xl">🗑️</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 记录模态框 -->
    <div
      v-if="showRecordModal"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="closeRecordModal"
    >
      <div class="card max-w-md w-full fade-in">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-primary-600">
            记录胎动 👶
            <span v-if="recordCount > 0" class="text-sm font-normal text-gray-600 ml-2">
              (已记录 {{ recordCount }} 次)
            </span>
          </h2>
        </div>

        <!-- 成功提示 -->
        <div v-if="justRecorded" class="bg-green-50 text-green-700 px-4 py-3 rounded-2xl mb-4 text-sm flex items-center gap-2 fade-in">
          <span class="text-lg">✅</span>
          <span>记录成功！可以继续记录或关闭</span>
        </div>

        <form @submit.prevent="handleRecord" class="space-y-4">
          <!-- 强度选择 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">强度</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="intensity in intensityOptions"
                :key="intensity.value"
                type="button"
                @click="recordForm.intensity = intensity.value"
                class="tag-button"
                :class="{ 'tag-button-active': recordForm.intensity === intensity.value }"
              >
                <div class="text-2xl mb-1">{{ intensity.emoji }}</div>
                <div class="text-xs">{{ intensity.label }}</div>
              </button>
            </div>
          </div>

          <!-- 标签选择 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">类型</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="tag in tagOptions"
                :key="tag.value"
                type="button"
                @click="recordForm.tag = tag.value"
                class="tag-button"
                :class="{ 'tag-button-active': recordForm.tag === tag.value }"
              >
                <div class="text-2xl mb-1">{{ tag.emoji }}</div>
                <div class="text-xs">{{ tag.label }}</div>
              </button>
            </div>
          </div>

          <!-- 备注 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">备注（可选）</label>
            <input
              v-model="recordForm.note"
              type="text"
              class="input-field"
              placeholder="添加备注..."
            />
          </div>

          <!-- 按钮 -->
          <div class="flex gap-3">
            <button
              type="button"
              @click="closeRecordModal"
              class="btn-secondary flex-1"
            >
              {{ recordCount > 0 ? '完成' : '取消' }}
            </button>
            <button
              type="submit"
              :disabled="!recordForm.intensity || !recordForm.tag"
              class="btn-primary flex-1 disabled:opacity-50"
            >
              {{ recordCount > 0 ? '再记一次' : '保存记录' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import api from '../api.js';

// 状态
const showRecordModal = ref(false);
const expandedGroups = reactive({});
const todayStats = ref({ total: 0, lastTime: null });
const recentMovements = ref([]);
const recordCount = ref(0); // 本次记录会话的次数
const justRecorded = ref(false); // 刚刚记录成功的标记
const settings = ref({ dueDate: null }); // 设置（预产期）

// 强度和标签选项配置
const intensityOptions = ref([
  { value: '轻微', label: '轻微', emoji: '✨' },
  { value: '明显', label: '明显', emoji: '💫' },
  { value: '强烈', label: '强烈', emoji: '💪' }
]);

const tagOptions = ref([
  { value: '踢腿', label: '踢腿', emoji: '🦵' },
  { value: '翻身', label: '翻身', emoji: '🔄' },
  { value: '打嗝', label: '打嗝', emoji: '💨' },
  { value: '推肚子', label: '推肚子', emoji: '👋' },
  { value: '伸懒腰', label: '伸懒腰', emoji: '🤸' },
  { value: '其他', label: '其他', emoji: '✨' }
]);

const recordForm = ref({
  intensity: '',
  tag: '',
  note: ''
});

// 计算属性
const currentDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
});

// 计算孕周信息
const pregnancyInfo = computed(() => {
  if (!settings.value.dueDate) return null;

  const today = new Date();
  const dueDate = new Date(settings.value.dueDate);

  // 预产期通常是40周，280天
  const conceptionDate = new Date(dueDate);
  conceptionDate.setDate(conceptionDate.getDate() - 280);

  // 计算从怀孕开始到现在的天数
  const daysSinceConception = Math.floor((today - conceptionDate) / (1000 * 60 * 60 * 24));

  // 计算周和天
  const weeks = Math.floor(daysSinceConception / 7);
  const days = daysSinceConception % 7;

  return {
    weeks,
    days,
    totalDays: daysSinceConception
  };
});

const getAverageInterval = computed(() => {
  if (todayStats.value.total <= 1) return '-';

  // 从最近记录中筛选今天的记录
  const today = new Date().toDateString();
  const todayMovements = recentMovements.value.filter(m => {
    return new Date(m.timestamp).toDateString() === today;
  });

  if (todayMovements.length <= 1) return '-';

  // 计算第一条和最后一条记录之间的时间差
  const timestamps = todayMovements.map(m => new Date(m.timestamp).getTime());
  const oldest = Math.min(...timestamps);
  const newest = Math.max(...timestamps);
  const totalMinutes = (newest - oldest) / 1000 / 60;
  const avgMinutes = totalMinutes / (todayMovements.length - 1);

  // 格式化显示
  if (avgMinutes < 60) {
    return `${Math.round(avgMinutes)}分钟`;
  } else {
    const hours = Math.floor(avgMinutes / 60);
    const mins = Math.round(avgMinutes % 60);
    return mins > 0 ? `${hours}小时${mins}分` : `${hours}小时`;
  }
});

// 方法
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const formatDateTime = (timestamp) => {
  const date = new Date(timestamp);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `今天 ${time}`;
  }

  const dateStr = date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
  return `${dateStr} ${time}`;
};

const getIntensityEmoji = (intensity) => {
  const emojiMap = {
    '轻微': '✨',
    '明显': '💫',
    '强烈': '💪'
  };
  return emojiMap[intensity] || '👶';
};

const getTagEmoji = (tag) => {
  const emojiMap = {
    '踢腿': '🦵',
    '翻身': '🔄',
    '打嗝': '💨',
    '推肚子': '👋',
    '伸懒腰': '🤸',
    '其他': '✨'
  };
  return emojiMap[tag] || '✨';
};

// 按日期分组的记录
const groupedMovements = computed(() => {
  if (recentMovements.value.length === 0) return [];

  const groups = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  recentMovements.value.forEach(m => {
    const date = new Date(m.timestamp);
    const dateKey = date.toISOString().split('T')[0];

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(m);
  });

  return Object.entries(groups)
    .map(([dateKey, movements]) => {
      const date = new Date(dateKey + 'T00:00:00');
      let dateLabel;

      if (date.toDateString() === today.toDateString()) {
        dateLabel = '今天';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateLabel = '昨天';
      } else {
        dateLabel = date.toLocaleDateString('zh-CN', {
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        });
      }

      return {
        dateKey,
        dateLabel,
        movements: movements.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      };
    })
    .sort((a, b) => new Date(b.dateKey) - new Date(a.dateKey));
});

const toggleGroup = (dateKey) => {
  expandedGroups[dateKey] = !expandedGroups[dateKey];
};

// 初始化展开状态（默认展开第一个分组）
const initExpandedGroups = () => {
  if (groupedMovements.value.length > 0) {
    expandedGroups[groupedMovements.value[0].dateKey] = true;
  }
};

const loadSettings = async () => {
  try {
    const data = await api.getSettings();
    settings.value = data;
  } catch (error) {
    console.error('加载设置失败:', error);
  }
};

const loadData = async () => {
  try {
    // 计算最近3天的日期范围
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 2); // 今天 + 前2天 = 3天
    startDate.setHours(0, 0, 0, 0);

    const [stats, movements] = await Promise.all([
      api.getTodayStats(),
      api.getMovements({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100
      })
    ]);

    todayStats.value = stats;
    recentMovements.value = movements;

    // 初始化展开状态
    setTimeout(() => {
      if (groupedMovements.value.length > 0 && Object.keys(expandedGroups).length === 0) {
        expandedGroups[groupedMovements.value[0].dateKey] = true;
      }
    }, 0);
  } catch (error) {
    console.error('加载数据失败:', error);
  }
};

const handleRecord = async () => {
  try {
    await api.createMovement({
      timestamp: new Date().toISOString(),
      intensity: recordForm.value.intensity,
      tag: recordForm.value.tag,
      note: recordForm.value.note
    });

    // 增加记录次数
    recordCount.value++;

    // 显示成功提示
    justRecorded.value = true;
    setTimeout(() => {
      justRecorded.value = false;
    }, 2000);

    // 清空备注，保留强度和标签选择
    recordForm.value.note = '';

    // 刷新数据
    await loadData();
  } catch (error) {
    alert('记录失败：' + (error.error || '未知错误'));
  }
};

// 关闭记录会话
const closeRecordModal = () => {
  showRecordModal.value = false;
  recordCount.value = 0;
  recordForm.value = { intensity: '', tag: '', note: '' };
  justRecorded.value = false;
};

const deleteMovement = async (id) => {
  if (!confirm('确定删除这条记录吗？')) return;

  try {
    await api.deleteMovement(id);
    await loadData();
  } catch (error) {
    alert('删除失败：' + (error.error || '未知错误'));
  }
};

onMounted(() => {
  loadSettings();
  loadData();
});
</script>
