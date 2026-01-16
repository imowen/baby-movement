<template>
  <div class="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-20">
    <!-- 顶部导航 -->
    <div class="bg-white shadow-sm sticky top-0 z-10">
      <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <button @click="$router.go(-1)" class="text-gray-600 hover:text-gray-900">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 class="text-xl font-bold text-gray-800">孕期指南</h1>
        <button @click="$router.push('/settings')" class="text-pink-500 hover:text-pink-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 未设置孕期信息 -->
    <div v-if="!pregnancyInfo.hasPregnancyInfo" class="max-w-4xl mx-auto px-4 py-8">
      <div class="bg-white rounded-3xl shadow-xl p-8 text-center">
        <div class="w-20 h-20 bg-pink-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span class="text-4xl">🤰</span>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">欢迎使用孕期指南</h2>
        <p class="text-gray-600 mb-6">请先设置您的末次月经或预产期，以获取个性化的孕期信息</p>
        <button
          @click="$router.push('/settings')"
          class="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-3 rounded-full font-medium hover:shadow-lg transition-all"
        >
          前往设置
        </button>
      </div>
    </div>

    <!-- 已设置孕期信息 -->
    <div v-else class="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <!-- 当前孕周卡片 -->
      <div class="bg-gradient-to-r from-pink-500 to-purple-500 rounded-3xl shadow-xl p-6 text-white">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-sm opacity-90">你现在是</p>
            <h2 class="text-3xl font-bold">{{ pregnancyInfo.gestationalAge.formatted }}</h2>
            <p class="text-sm opacity-90 mt-1">第 {{ trimesterName(pregnancyInfo.gestationalAge.trimester) }} 孕期</p>
          </div>
          <div class="text-6xl">
            {{ currentWeekData?.fetal?.sizeComparison || '👶' }}
          </div>
        </div>
        <div class="bg-white/20 rounded-2xl p-4">
          <div class="flex justify-between text-sm">
            <span>距离预产期</span>
            <span class="font-medium">{{ pregnancyInfo.daysUntilEDD }} 天</span>
          </div>
          <div class="mt-2 text-xs opacity-90">
            预产期：{{ formatDate(pregnancyInfo.edd) }}
          </div>
        </div>
      </div>

      <!-- 本周宝宝发育 -->
      <div v-if="currentWeekData" class="bg-white rounded-3xl shadow-xl p-6">
        <!-- 周数提示（如果使用的是临近周数数据） -->
        <div v-if="currentWeekData._note" class="bg-blue-50 text-blue-700 text-sm px-4 py-2 rounded-xl mb-4 flex items-center">
          <span class="mr-2">ℹ️</span>
          <span>{{ currentWeekData._note }}</span>
        </div>

        <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span class="text-2xl mr-2">👶</span>
          本周宝宝发育
        </h3>

        <div class="space-y-4">
          <div class="flex items-start space-x-3">
            <div class="w-2 h-2 bg-pink-500 rounded-full mt-2"></div>
            <div>
              <p class="text-gray-600"><strong>大小：</strong>{{ currentWeekData.fetal.sizeComparison }}</p>
              <p class="text-sm text-gray-500">身长 {{ currentWeekData.fetal.length }}，体重 {{ currentWeekData.fetal.weight }}</p>
            </div>
          </div>

          <div class="border-t pt-4">
            <p class="font-medium text-gray-800 mb-2">发育亮点：</p>
            <ul class="space-y-2">
              <li v-for="(highlight, index) in currentWeekData.fetal.highlights" :key="index" class="flex items-start text-gray-600">
                <span class="text-pink-500 mr-2">✓</span>
                <span>{{ highlight }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 陪伴文案 -->
      <div v-if="currentWeekData?.companionMessage" class="bg-gradient-to-r from-purple-100 to-pink-100 rounded-3xl p-6">
        <div class="flex items-start space-x-3">
          <span class="text-2xl">💕</span>
          <p class="text-gray-700 leading-relaxed">{{ currentWeekData.companionMessage }}</p>
        </div>
      </div>

      <!-- 胎动监测提示 -->
      <div v-if="pregnancyInfo.movementMonitoring?.shouldMonitor" class="bg-blue-50 rounded-3xl p-6">
        <h3 class="text-lg font-bold text-blue-900 mb-3 flex items-center">
          <span class="text-2xl mr-2">📊</span>
          胎动监测提示
        </h3>
        <p class="text-blue-800 mb-4">{{ pregnancyInfo.movementMonitoring.reason }}</p>

        <div class="bg-white rounded-2xl p-4 space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-gray-700">12小时计数法</span>
            <span class="font-bold text-blue-600">≥ 20次</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-700">2小时计数法</span>
            <span class="font-bold text-blue-600">≥ 10次</span>
          </div>
        </div>

        <div class="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p class="text-sm font-medium text-red-800 mb-2">⚠️ 需要警惕的情况：</p>
          <ul class="text-sm text-red-700 space-y-1">
            <li>• 胎动突然停止</li>
            <li>• 12小时内少于20次</li>
            <li>• 较前一天同时段减少50%以上</li>
          </ul>
        </div>
      </div>

      <!-- 妈妈身体变化 -->
      <div v-if="currentWeekData?.maternal" class="bg-white rounded-3xl shadow-xl p-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span class="text-2xl mr-2">🤰</span>
          妈妈身体变化
        </h3>

        <div class="space-y-4">
          <div v-if="currentWeekData.maternal.changes?.length">
            <p class="font-medium text-gray-700 mb-2">正常变化：</p>
            <ul class="space-y-2">
              <li v-for="(change, index) in currentWeekData.maternal.changes" :key="index" class="flex items-start text-gray-600">
                <span class="text-purple-500 mr-2">•</span>
                <span>{{ change }}</span>
              </li>
            </ul>
          </div>

          <div v-if="currentWeekData.maternal.symptoms?.length" class="border-t pt-4">
            <p class="font-medium text-gray-700 mb-2">可能出现的症状：</p>
            <ul class="space-y-2">
              <li v-for="(symptom, index) in currentWeekData.maternal.symptoms" :key="index" class="flex items-start text-gray-600">
                <span class="text-orange-500 mr-2">•</span>
                <span>{{ symptom }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 产检提醒 -->
      <div v-if="currentWeekData?.checkup?.recommended" class="bg-green-50 rounded-3xl p-6">
        <h3 class="text-lg font-bold text-green-900 mb-3 flex items-center">
          <span class="text-2xl mr-2">🏥</span>
          产检提醒
        </h3>
        <div class="bg-white rounded-2xl p-4">
          <p class="font-medium text-gray-800 mb-2">{{ currentWeekData.checkup.type }}</p>
          <p class="text-sm text-gray-600">{{ currentWeekData.checkup.description }}</p>
        </div>
      </div>

      <!-- 本周小贴士 -->
      <div v-if="currentWeekData?.tips?.length" class="bg-white rounded-3xl shadow-xl p-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span class="text-2xl mr-2">💡</span>
          本周小贴士
        </h3>
        <ul class="space-y-3">
          <li v-for="(tip, index) in currentWeekData.tips" :key="index" class="flex items-start">
            <span class="text-yellow-500 mr-2">★</span>
            <span class="text-gray-700">{{ tip }}</span>
          </li>
        </ul>
      </div>

      <!-- 医学免责声明 -->
      <div class="bg-gray-50 rounded-2xl p-4 text-center">
        <p class="text-xs text-gray-500 leading-relaxed">
          本内容仅供参考，不能替代专业医疗建议。<br>
          如有任何疑问或不适，请及时咨询医生。
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';

export default {
  name: 'PregnancyGuide',
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const pregnancyInfo = reactive({
      hasPregnancyInfo: false,
      gestationalAge: null,
      edd: null,
      daysUntilEDD: 0,
      currentWeekData: null,
      movementMonitoring: null
    });

    const currentWeekData = computed(() => pregnancyInfo.currentWeekData);

    const trimesterName = (trimester) => {
      const names = { 1: '一', 2: '二', 3: '三' };
      return names[trimester] || '';
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    };

    const loadPregnancyInfo = async () => {
      try {
        const response = await api.getPregnancyInfo();
        if (response.hasPregnancyInfo) {
          Object.assign(pregnancyInfo, response);
        } else {
          pregnancyInfo.hasPregnancyInfo = false;
        }
      } catch (error) {
        console.error('加载孕期信息失败:', error);
      }
    };

    onMounted(() => {
      loadPregnancyInfo();
    });

    return {
      loading,
      pregnancyInfo,
      currentWeekData,
      trimesterName,
      formatDate
    };
  }
};
</script>
